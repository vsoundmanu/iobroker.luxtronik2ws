'use strict';

class Protocol {

    constructor(adapter) {
        this.adapter = adapter;
        this.ws = null;
    }

    connect() {
        throw new Error('Not implemented');
    }

    disconnect() {
    }

    send(msg) {
        throw new Error('Not implemented');
    }

    handleMessage(raw) {
        throw new Error('Not implemented');
    }
}

module.exports = Protocol;
