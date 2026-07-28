'use strict';

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
    connect() {
        throw new Error('Not implemented');
    }

    disconnect() {
    }

	send(msg) {

		if (this.adapter.ws &&
			this.adapter.ws.readyState === 1) {

			this.adapter.ws.send(msg);

		}

	}

    handleMessage(raw) {
        throw new Error('Not implemented');
    }
}

module.exports = Protocol;
