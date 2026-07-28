'use strict';

class Writer {

    constructor(adapter) {

        this.adapter = adapter;

    }

    /**
     * kleine Pause
     */
    delay(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

    /**
     * SET senden
     */
    async set(itemId, rawValue) {

        const command = `SET;set_${itemId};${rawValue}`;

        this.adapter.log.info(`WRITE -> ${command}`);

        this.adapter.send(command);

    }

    /**
     * SAVE senden
     */
    async save() {

        this.adapter.log.info('WRITE -> SAVE;1');

        this.adapter.send('SAVE;1');

    }

    /**
     * kompletten Schreibvorgang durchführen
     */
    async write(itemId, rawValue) {

await this.set(itemId, rawValue);

await this.delay(100);

if (!this.adapter.isConnected) {
    this.adapter.log.warn('Schreibvorgang abgebrochen: Verbindung getrennt.');
    return;
}

await this.save();

    }

}

module.exports = Writer;
