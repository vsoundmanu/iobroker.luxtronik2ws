'use strict';

const WebSocket = require('ws');

class WriteSession {

    constructor(adapter) {

		this.adapter = adapter;
		this.ws = null;
		this.navigation = new Map();

    }

    connect() {

        return new Promise((resolve, reject) => {

            const url =
                `ws://${this.adapter.config.host}:${this.adapter.config.port}`;

            this.adapter.log.info(
                `WRITE: Verbinde zu ${url}`
            );

            this.ws = new WebSocket(url, 'Lux_WS');

            this.ws.once('open', () => {

                this.adapter.log.info(
                    'WRITE: Verbunden'
                );

                resolve();

            });

            this.ws.once('error', err => {

                reject(err);

            });

        });

    }

    login() {

        return new Promise((resolve, reject) => {

            const timeout = setTimeout(() => {

                reject(
                    new Error('WRITE Login Timeout')
                );

            }, 5000);

            this.ws.on('message', data => {

                let json;

                try {

                    json = JSON.parse(data);

                } catch {

                    return;

                }

                if (json.type === 'Navigation') {

                    clearTimeout(timeout);

                    this.adapter.log.info(
                        'WRITE: Login erfolgreich'
                    );
					this.navigation.clear();

					const walk = items => {

						for (const item of items) {

							if (item.name && item.id) {
								this.navigation.set(item.name, item.id);
							}

							if (item.items) {
								walk(item.items);
							}
						}
					};

					walk(json.items || []);
                    resolve();

                }

            });

            const cmd =
                `LOGIN;${this.adapter.config.password}`;

            this.adapter.log.info(
                'WRITE TX -> LOGIN;<redacted>'
            );

            this.ws.send(cmd);

        });

    }

    disconnect() {

        return new Promise(resolve => {

            if (!this.ws) {

                resolve();
                return;

            }

            this.ws.once('close', () => {

                this.adapter.log.info(
                    'WRITE: Verbindung geschlossen'
                );

                resolve();

            });

            this.ws.close();

        });

    }

	findNavigationId(name) {
    return this.navigation.get(name);
	}
	findItem(content, itemName) {

    const walk = items => {

        for (const item of items || []) {

            if (item.name === itemName) {
                return item;
            }

            if (item.items) {

                const found = walk(item.items);

                if (found) {
                    return found;
                }
            }

        }

        return null;

    };

    return walk(content.items);

}

    delay(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

    valuesEqual(actual, expected) {

        // ioBroker kann numerische Werte als String liefern. Für die
        // Luxtronik-Rohwerte sind "4" und 4 identisch.
        return String(actual) === String(expected);

    }

    async verify(navigation, itemName, expectedRawValue) {

        const content = await this.getContent(navigation);
        const item = this.findItem(content, itemName);

        if (!item) {
            throw new Error(
                `Verify: Item "${itemName}" nicht gefunden.`
            );
        }

        const actualValue = item.raw !== undefined
            ? item.raw
            : item.value;

        if (!this.valuesEqual(actualValue, expectedRawValue)) {
            throw new Error(
                `Verify fehlgeschlagen für "${itemName}": ` +
                `erwartet ${expectedRawValue}, erhalten ${actualValue}.`
            );
        }

        this.adapter.log.info(
            `WRITE Verify erfolgreich: ${item.name} = ${actualValue}`
        );

        return {
            itemId: item.id,
            actualValue
        };

    }
	async getContent(name) {

    const id = this.findNavigationId(name);

    if (!id) {
        throw new Error(
            `Navigation "${name}" nicht gefunden.`
        );
    }

    return new Promise((resolve, reject) => {

        const timeout = setTimeout(() => {

            reject(
                new Error('Content Timeout')
            );

        }, 5000);

        const listener = data => {

            let json;

            try {

                json = JSON.parse(data);

            } catch {

                return;

            }

            if (
                json.type === 'Content' ||
                json.items
            ) {

                clearTimeout(timeout);

                this.ws.off(
                    'message',
                    listener
                );

                resolve(json);

            }

        };

        this.ws.on(
            'message',
            listener
        );

        const cmd = `GET;${id}`;

        this.adapter.log.debug(
            `WRITE TX -> ${cmd}`
        );

        this.ws.send(cmd);

    });

	}

	async set(itemId, rawValue) {

    return new Promise((resolve, reject) => {

        const cmd =
            `SET;set_${itemId};${rawValue}`;

        this.adapter.log.debug(
            `WRITE TX -> ${cmd}`
        );

        this.ws.send(cmd, err => {

            if (err) {
                reject(err);
                return;
            }

            resolve();

        });

    });

	}

	async save() {

    return new Promise((resolve, reject) => {

        const cmd = "SAVE;1";

        this.adapter.log.debug(
            `WRITE TX -> ${cmd}`
        );

        this.ws.send(cmd, err => {

            if (err) {
                reject(err);
                return;
            }

            resolve();

        });

    });

	}

	async write(
    navigation,
    itemName,
    rawValue
) {

    await this.connect();

    try {

        await this.login();

        const content =
            await this.getContent(
                navigation
            );

        const item =
            this.findItem(
                content,
                itemName
            );

        if (!item) {

            throw new Error(
                `Item "${itemName}" nicht gefunden.`
            );

        }

        this.adapter.log.info(
            `WRITE: ${item.name} (${item.id}) -> ${rawValue}`
        );

        await this.set(
            item.id,
            rawValue
        );

        await this.delay(100);

        await this.save();

        // SAVE wird von der Luxtronik asynchron verarbeitet. Erst danach den
        // Parameter erneut lesen und die Übernahme des Rohwerts bestätigen.
        await this.delay(250);

        return this.verify(
            navigation,
            itemName,
            rawValue
        );

    } finally {

        await this.disconnect();

    }

	}

}

module.exports = WriteSession;
