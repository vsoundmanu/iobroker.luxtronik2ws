'use strict';

const WebSocket = require('ws');

class Protocol {

constructor(adapter) {
    this.adapter = adapter;
    this.ws = null;

    this.callbacks = {
        navigation: null,
        content: null,
        disconnect: null
    };
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

		this.ws.on('message', data =>
			this.handleMessage(data.toString())
		);

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

    disconnect() {
    }

	send(msg) {
		if (this.ws && this.ws.readyState === 1) {
			this.ws.send(msg);
		}
	}

    handleMessage(raw) {
        throw new Error('Not implemented');
    }
	
	handleMessage(raw) {
    	this.adapter.handleMessage(raw);
	}

}

module.exports = Protocol;
