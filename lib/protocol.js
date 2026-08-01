'use strict';

const WebSocket = require('ws');

class Protocol {

constructor(adapter) {
    this.adapter = adapter;
    this.ws = null;
}

	buildUrl() {
    	return `ws://${this.adapter.config.host}:${this.adapter.config.port}`;
	}
	
    connect() {
        const url = this.buildUrl();
        try {
            this.ws = new WebSocket(url, 'Lux_WS');
        } catch (e) {
            this.adapter.log.error(`WebSocket Fehler: ${e.message}`);
            this.adapter.scheduleReconnect();
            return;
        }

        this.ws.on('open', () => {
            this.adapter.log.info(`✅ Verbunden mit ${url}`);
            this.adapter.isConnected = true;
            this.adapter.setStateAsync('info.connection', true, true);
            this.send(`LOGIN;${this.adapter.config.password}`);
        });

		this.ws.on('message', data => {
			const text = data.toString();
			this.adapter.log.debug(`RX <- ${text}`);
			this.adapter.handleMessage(text);
		});

        this.ws.on('close', () => {
            this.adapter.log.warn('🔌 Verbindung getrennt');
            this.adapter.isConnected = false;
            this.adapter.isReady = false;
            this.adapter.setStateAsync('info.connection', false, true);
            this.adapter.clearTimers();
            this.adapter.scheduleReconnect();
        });

        this.ws.on('error', (err) => this.adapter.log.error(`WebSocket Fehler: ${err.message}`));
    }

send(command) {

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.adapter.log.warn(`TX BLOCKED -> ${command}`);
        return;
    }

    const logCommand = command.startsWith('LOGIN;')
        ? 'LOGIN;<redacted>'
        : command;

    this.adapter.log.debug(`TX -> ${logCommand}`);

    this.ws.send(command);
}

}

module.exports = Protocol;
