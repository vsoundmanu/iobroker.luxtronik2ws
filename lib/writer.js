'use strict';

const WriteSession = require('./write-session');
const mapping = require('./write-mapping');

class Writer {

    constructor(adapter) {

        this.adapter = adapter;

    }

    async write(stateId, value) {

        // Adapter-Präfix entfernen
        const id = stateId.replace(
            `${this.adapter.namespace}.`,
            ''
        );

        const entry = mapping[id];

        if (!entry) {

            throw new Error(
                `Kein Write-Mapping für "${id}" vorhanden.`
            );

        }

        this.adapter.log.info(
            `WRITE: ${entry.navigation} -> ${entry.item} = ${value}`
        );

        const session =
            new WriteSession(this.adapter);

		const verification = await session.write(
			entry.navigation,
			entry.item,
			value
		);

		return {

			success: true,

            verified: true,

            actualValue: verification.actualValue,

			navigation: entry.navigation

		};

    }

}

module.exports = Writer;
