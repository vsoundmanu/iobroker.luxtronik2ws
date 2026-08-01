'use strict';

const Protocol = require('./lib/protocol');

const utils = require('@iobroker/adapter-core');
const Writer = require('./lib/writer');
const WriteQueue = require('./lib/write-queue');
const Session = require('./lib/session');
let mqttClient = null;

// MQTT optional laden
let mqtt;
try { mqtt = require('mqtt'); } catch(e) { mqtt = null; }

class Luxtronik2WS extends utils.Adapter {

    constructor(options) {
        super({ ...options, name: 'luxtronik2ws' });
        this.navIds = [];
        this.pollTimer = null;
        this.reconnectTimer = null;
        this.isConnected = false;
        this.isReady = false;
        this.createdObjects = new Set();
		this.protocol = new Protocol(this);
		this.writer = new Writer(this);
		this.writeQueue = new WriteQueue(this, this.writer);
		this.session = new Session();

        // Mapping: Bereichsname → Config-Flag
        this.sectionMapping = {
            'Temperaturen':         'fetchTemperaturen',
            'Eingänge':             'fetchEingaenge',
            'Ausgänge':             'fetchAusgaenge',
            'Betriebsstunden':      'fetchBetriebsstunden',
            'Anlagenstatus':        'fetchAnlagenstatus',
            'Energiemonitor':       'fetchEnergiemonitor',
            'Wärmemenge':           'fetchEnergiemonitor',
            'Leistungsaufnahme':    'fetchEnergiemonitor',
            'Ablaufzeiten':         'fetchAblaufzeiten',
            'Fehlerspeicher':       'fetchFehlerspeicher',
            'Abschaltungen':        'fetchFehlerspeicher',
            'GLT':                  'fetchSHI',
            'Smart Home Interface': 'fetchSHI'
        };

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
	this.on('stateChange', this.onStateChange.bind(this));
    }

    async onReady() {
        this.log.info(`Luxtronik2WS Adapter gestartet v0.2.1`);
        this.log.info(`Ziel: ${this.config.host}:${this.config.port}`);
        await this.setStateAsync('info.connection', false, true);

        // MQTT für Loxone starten
        if (this.config.loxoneEnabled && this.config.loxoneMqttHost) {
            this.connectMqtt();
        }

	await this.subscribeStates('*');

        this.connect();
    }

    // ─── MQTT für Loxone ──────────────────────────────────────────────────────
	// TODO P3:
	// Remove integrated MQTT/Loxone support.
	// Use ioBroker MQTT adapter instead.

    connectMqtt() {
        if (!mqtt) {
            this.log.warn('MQTT Modul nicht verfügbar — npm install mqtt ausführen');
            return;
        }
        const host = this.config.loxoneMqttHost;
        const port = this.config.loxoneMqttPort || 1883;
        const url = `mqtt://${host}:${port}`;

        const opts = { clientId: 'iobroker-luxtronik2ws' };
        if (this.config.loxoneMqttUser) opts.username = this.config.loxoneMqttUser;
        if (this.config.loxoneMqttPassword) opts.password = this.config.loxoneMqttPassword;

        mqttClient = mqtt.connect(url, opts);
        mqttClient.on('connect', () => {
            this.log.info(`✅ MQTT verbunden mit ${url} (Loxone)`);
            mqttClient.publish(`${this.config.loxoneMqttTopic}/status`, 'online', { retain: true });
        });
        mqttClient.on('error', (e) => this.log.error(`MQTT Fehler: ${e.message}`));
        mqttClient.on('close', () => this.log.warn('MQTT Verbindung getrennt'));
    }

    publishMqtt(section, name, value, unit) {
        if (!this.config.loxoneEnabled || !mqttClient || !mqttClient.connected) return;
        const prefix = this.config.loxoneMqttTopic || 'waermepumpe';
        const topic = `${prefix}/${this.buildStateId(section, name)}`;
        // Loxone braucht reinen Zahlenwert — OHNE Einheit!
        const payload = String(value);
        mqttClient.publish(topic, payload, { retain: true });
    }

    // ─── WebSocket ────────────────────────────────────────────────────────────

    connect() {
		this.protocol.connect();
    }

send(msg) {
    this.protocol.send(msg);
}

    scheduleReconnect() {
        const interval = (this.config.reconnectInterval || 60) * 1000;
        this.log.info(`🔄 Reconnect in ${this.config.reconnectInterval || 60}s...`);
        this.reconnectTimer = setTimeout(() => this.connect(), interval);
    }

    clearTimers() {
        if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
        if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    }

    // ─── Nachrichten ─────────────────────────────────────────────────────────

async handleMessage(raw) {
    let data;

    try {
        data = JSON.parse(raw);
    } catch (e) {
        return;
    }

    if (data.type === 'Navigation' && data.items) {
        this.log.info('📂 Navigation empfangen');

        this.navIds = [];
        this.session.clear();

        this.extractNavIds(data.items);

        this.log.info(
            `📋 ${this.navIds.length} Bereiche gefunden (nach Filter: ${
                this.navIds.filter(n => this.isSectionEnabled(n.name)).length
            } aktiv)`
        );

        this.isReady = true;

        this.pollAll();

        const interval = (this.config.pollInterval || 30) * 1000;
        this.pollTimer = setInterval(() => this.pollAll(), interval);

        return;
    }

    if (data.items && Array.isArray(data.items)) {
        await this.processItems(
            data.items,
            data.name || 'unknown'
        );

    }
}

    isSectionEnabled(name) {
        const flag = this.sectionMapping[name];
        if (!flag) return true; // unbekannte Bereiche immer abfragen
        return this.config[flag] !== false;
    }

	extractNavIds(sections) {

		const addNavigation = item => {

			if (!item.id || !item.name) {
				return;
			}

			this.session.addNavigation(
				item.name,
				item.id
			);

			this.navIds.push({
				id: item.id,
				name: item.name
			});

		};

		const recurse = items => {

			for (const item of items) {

				addNavigation(item);

				if (item.items && item.items.length > 0) {
					recurse(item.items);
				}
			}
		};

		for (const section of sections) {

			addNavigation(section);

			if (section.items) {
				recurse(section.items);
			}
		}
}


pollAll() {

    if (!this.isReady || !this.isConnected) {
        return;
    }

    const active = this.navIds
        .filter(entry => this.isSectionEnabled(entry.name));

    this.log.debug(`🔄 Polling ${active.length} Bereiche...`);

    for (const entry of active) {
		this.log.debug(`GET ${entry.name}`);
        this.send(`GET;${entry.id}`);
    }
}


	async refreshNavigation(name) {

		if (!this.isConnected || !this.isReady) {
			return;
		}

		const entry = this.session
			.getNavigationEntries()
			.find(e => e.name === name);

		if (!entry) {

			this.log.warn(
				`Refresh: Bereich "${name}" nicht gefunden.`
			);

			return;
		}

		this.log.info(
			`REFRESH -> ${name}`
		);

		this.send(
			`GET;${entry.id}`
		);

	}

    // ─── States + MQTT ────────────────────────────────────────────────────────

async processItems(items, sectionName) {

    if (!Array.isArray(items)) {
        return;
    }

    for (const item of items) {

        // -----------------------------
        // Unterpunkte zuerst verarbeiten
        // -----------------------------

        if (Array.isArray(item.items) && item.items.length > 0) {

			const nextSection = item.name
				? this.buildStateId(sectionName, item.name)
				: sectionName;

            await this.processItems(
                item.items,
                nextSection
            );
        }

        // Container ohne Wert überspringen
        if (item.value === undefined || item.value === null || !item.name) {
            continue;
        }

        const stateId = this.buildStateId(
            sectionName,
            item.name
        );

		const hasRaw =
			item.raw !== undefined;

		const value = hasRaw
			? (item.div ? item.raw / item.div : item.raw)
			: this.parseValue(item.value);

        const unit = item.unit || '';

        const role = this.guessRole(
            item.name,
            unit
        );

        // -----------------------------
        // Datentyp bestimmen
        // -----------------------------

        let stateType;

        if (item.raw !== undefined) {
            stateType = typeof item.raw;
        } else {

            stateType =
                typeof value === 'boolean'
                    ? 'boolean'
                    : typeof value === 'number'
                        ? 'number'
                        : 'string';
        }

        // ioBroker erlaubt keine nachträgliche Änderung des State-Typs. Bei
        // bestehenden Objekten muss deshalb deren Typ für den Wert verwendet
        // werden, auch wenn die Luxtronik nun einen numerischen raw-Wert liefert.
        const existingObject = await this.getObjectAsync(stateId);

        if (
            existingObject &&
            ['boolean', 'number', 'string'].includes(
                existingObject.common?.type
            )
        ) {
            stateType = existingObject.common.type;
        }

        // -----------------------------
        // Objekt erzeugen
        // -----------------------------

        if (!this.createdObjects.has(stateId)) {

            await this.setObjectAsync(stateId, {

                type: 'state',

                common: {

                    name: item.name,

                    type: stateType,

                    role,

                    unit,

                    read: true,

                    write: item.raw !== undefined,

                    min: item.min !== undefined
                        ? (item.div ? item.min / item.div : item.min)
                        : undefined,

                    max: item.max !== undefined
                        ? (item.div ? item.max / item.div : item.max)
                        : undefined,

                    step: item.step !== undefined
                        ? (item.div ? item.step / item.div : item.step)
                        : undefined,

                    states: item.options || undefined
                },

                native: {

                    luxId: item.id || '',

                    raw: item.raw,

                    type: item.type || '',

                    div: item.div || 1,

                    options: item.options || null,

                    min: item.min,

                    max: item.max,

                    step: item.step
                }
            });

            this.createdObjects.add(stateId);
        }

        // -----------------------------
        // Typ konvertieren
        // -----------------------------

        let safeValue = value;

        if (stateType === 'number' && typeof value !== 'number') {
            safeValue = parseFloat(value) || 0;
        }

        if (stateType === 'boolean' && typeof value !== 'boolean') {
            safeValue =
                value === true ||
                value === 'true' ||
                value === '1' ||
                value === 1;
        }

        if (stateType === 'string' && typeof value !== 'string') {
            safeValue = String(value);
        }

        await this.setStateAsync(stateId, {
            val: safeValue,
            ack: true
        });


        this.publishMqtt(
            sectionName,
            item.name,
            safeValue,
            unit
        );
    }
}

	buildStateId(path, name) {

		if (!path || path.length === 0) {
			return this.cleanName(name);
		}

		return `${path}.${this.cleanName(name)}`;

	}

	cleanName(name) {

    return String(name)
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

	}

    parseValue(raw) {
        if (typeof raw === 'number' || typeof raw === 'boolean') return raw;
        if (typeof raw === 'string') {
            // Einheit entfernen falls vorhanden z.B. "52.2°C" → 52.2
            const stripped = raw.replace(/[°%a-zA-ZÄäÖöÜü\/]+$/, '').replace(',', '.').trim();
            const num = parseFloat(stripped);
            if (!isNaN(num)) return num;
            if (raw === 'true') return true;
            if (raw === 'false') return false;
        }
        return raw;
    }

    guessRole(name, unit) {
        if (unit === '°C' || name.toLowerCase().includes('temperatur')) return 'value.temperature';
        if (unit === 'kWh') return 'value.energy';
        if (unit === 'kW' || unit === 'W') return 'value.power';
        if (unit === '%') return 'value.battery';
        if (unit === 'h') return 'value';
        if (unit === 'bar') return 'value.pressure';
        return 'value';
    }

    // ─── Stop ─────────────────────────────────────────────────────────────────

async onStateChange(id, state) {

    if (!state || state.ack) {
        return;
    }

    try {

        const result =
            await this.writeQueue.enqueue(
                id,
                state.val
            );

        if (
            result &&
            result.success &&
            result.navigation
        ) {

            await this.refreshNavigation(
                result.navigation
            );

        }

    } catch (e) {

        this.log.error(
            `Schreibfehler: ${e.message}`
        );

    }

}

    onUnload(callback) {
        try {
            this.clearTimers();
            this.writeQueue.stop();
            if (mqttClient) { mqttClient.end(); mqttClient = null; }
            if (this.ws) { this.ws.terminate(); this.ws = null; }
            this.log.info('Adapter gestoppt');
            callback();
        } catch (e) { callback(); }
    }
}

if (require.main !== module) {
    module.exports = (options) => new Luxtronik2WS(options);
} else {
    new Luxtronik2WS();
}
