#!/usr/bin/env node
'use strict';

/*
 * ============================================================================
 * Luxtronik WebSocket Test Client
 * Version 1.1
 *
 * Reverse Engineering Tool
 *
 * Funktionen:
 *  - WebSocket Verbindung
 *  - LOGIN
 *  - GET
 *  - SET
 *  - REFRESH
 *  - RAW Befehle
 *  - Auto Refresh
 *  - Trace
 *  - Statistik
 *  - JSON Decoder
 *
 * Teil 1/3
 * ============================================================================
 */

const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const HOST = process.env.LUX_HOST || '172.16.2.20';
const PORT = Number(process.env.LUX_PORT || 8214);

let ws = null;

let trace = true;
let refreshTimer = null;

const statistics = {
    Navigation: 0,
    Content: 0,
    values: 0,
    unknown: 0
};

//
// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
//

const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile =
    path.join(
        logDir,
        new Date()
            .toISOString()
            .replace(/:/g, '-')
            .replace(/\..*/, '') + '.log'
    );

function timestamp() {
    return new Date().toISOString().substring(11, 23);
}

function writeLog(line) {

    fs.appendFileSync(
        logFile,
        line + '\n',
        'utf8'
    );

}

function log(line) {

    console.log(line);
    writeLog(line);

}

function tx(message) {

    log(`[${timestamp()}] TX -> ${message}`);

}

function rx(message) {

    if (trace)
        log(`[${timestamp()}] RX <- ${message}`);

}

//
// ---------------------------------------------------------------------------
// JSON Decoder
// ---------------------------------------------------------------------------
//

function decodeMessage(raw) {

    rx(raw);

    let json;

    try {

        json = JSON.parse(raw);

    } catch {

        statistics.unknown++;
        return;

    }

    switch (json.type) {

        case 'Navigation':

            statistics.Navigation++;

            log('');
            log('==========================');
            log(' Navigation');
            log('==========================');

            if (json.items)
                log(`Root Items : ${json.items.length}`);

            break;

        case 'Content':

            statistics.Content++;

            log('');
            log('==========================');
            log(' Content');
            log('==========================');

            log(`Section : ${json.name}`);

            if (json.items)
                log(`Items   : ${json.items.length}`);

            break;

        case 'values':

            statistics.values++;

            log('');
            log('==========================');
            log(' Values');
            log('==========================');

            if (json.items) {

                for (const item of json.items) {

                    log(
                        `${item.id} = ${item.value}`
                    );

                }

            }

            break;

        default:

            statistics.unknown++;

            log('');
            log('==========================');
            log(' Unknown');
            log('==========================');

            log(`Type : ${json.type}`);

    }

}


//
// ---------------------------------------------------------------------------
// WebSocket Client
// ---------------------------------------------------------------------------
//

function connect() {

    if (ws) {

        log('Bereits verbunden.');
        return;

    }

    const url = `ws://${HOST}:${PORT}`;

    log('');
    log('==========================');
    log(' Connect');
    log('==========================');
    log(`URL : ${url}`);

    ws = new WebSocket(url, 'Lux_WS');

    ws.on('open', () => {

        log('Status : CONNECTED');

    });

    ws.on('message', data => {

        decodeMessage(data.toString());

    });

    ws.on('close', () => {

        log('');
        log('==========================');
        log(' Connection');
        log('==========================');
        log('Status : CLOSED');

        ws = null;

        stopRefresh();

    });

    ws.on('error', err => {

        log('');
        log('==========================');
        log(' Error');
        log('==========================');
        log(err.message);

    });

}

function disconnect() {

    stopRefresh();

    if (ws) {

        ws.close();
        ws = null;

    }

}

//
// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------
//

function send(command) {

    if (!ws) {

        log('Nicht verbunden.');
        return false;

    }

    if (ws.readyState !== WebSocket.OPEN) {

        log('Socket nicht offen.');
        return false;

    }

    tx(command);

    ws.send(command);

    return true;

}

//
// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
//

function login(pin) {

    if (!pin) {

        log('PIN fehlt.');
        return;

    }

    send(`LOGIN;${pin}`);

}

function get(id) {

    if (!id) {

        log('ID fehlt.');
        return;

    }

    send(`GET;${id}`);

}

function setValue(id, value) {

    if (!id) {

        log('ID fehlt.');
        return;

    }

    if (value === undefined) {

        log('Wert fehlt.');
        return;

    }

    send(`SET;set_${id};${value}`);

}

function refresh() {

    send('REFRESH');

}

function raw(command) {

    if (!command) {

        log('Befehl fehlt.');
        return;

    }

    send(command);

}

//
// ---------------------------------------------------------------------------
// Auto Refresh
// ---------------------------------------------------------------------------
//

function startRefresh(interval = 1000) {

    stopRefresh();

    log(`Auto Refresh: ${interval} ms`);

    refreshTimer = setInterval(() => {

        refresh();

    }, interval);

}

function stopRefresh() {

    if (!refreshTimer)
        return;

    clearInterval(refreshTimer);

    refreshTimer = null;

    log('Auto Refresh gestoppt.');

}

//
// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------
//

function printSummary() {

    log('');
    log('==========================');
    log(' Summary');
    log('==========================');

    log(`Navigation : ${statistics.Navigation}`);
    log(`Content    : ${statistics.Content}`);
    log(`Values     : ${statistics.values}`);
    log(`Unknown    : ${statistics.unknown}`);

}

function resetSummary() {

    statistics.Navigation = 0;
    statistics.Content = 0;
    statistics.values = 0;
    statistics.unknown = 0;

    log('Statistik zurückgesetzt.');

}


//
// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
//

function printHelp() {

    console.log(`
Available commands

connect
disconnect

login <PIN>

refresh
refresh on
refresh off

get <ID>

set <ID> <RAW>

raw <COMMAND>

trace on
trace off

summary
summary reset

repeat <COUNT> <COMMAND>

sleep <MS>

help

quit
exit
`);

}

//
// ---------------------------------------------------------------------------
// Repeat
// ---------------------------------------------------------------------------
//

function repeatCommand(count, command) {

    count = Number(count);

    if (isNaN(count) || count <= 0) {

        log('Ungültige Anzahl.');
        return;

    }

    for (let i = 0; i < count; i++) {

        send(command);

    }

}

//
// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------
//

function sleep(ms) {

    ms = Number(ms);

    if (isNaN(ms))
        return Promise.resolve();

    return new Promise(resolve => setTimeout(resolve, ms));

}

//
// ---------------------------------------------------------------------------
// Command Line
// ---------------------------------------------------------------------------
//

const rl = readline.createInterface({

    input: process.stdin,
    output: process.stdout,
    prompt: 'lux> '

});

log('');
log('========================================');
log(' Luxtronik WebSocket Test Client');
log('========================================');
log(`Host : ${HOST}`);
log(`Port : ${PORT}`);
log(`Log  : ${logFile}`);
log('');
log('Type "help" for commands.');
log('');

rl.prompt();

rl.on('line', async line => {

    const input = line.trim();

    if (!input) {

        rl.prompt();
        return;

    }

    const args = input.split(/\s+/);

    const cmd = args.shift().toLowerCase();

    switch (cmd) {

        case 'connect':

            connect();
            break;

        case 'disconnect':

            disconnect();
            break;

        case 'login':

            login(args[0]);
            break;

        case 'refresh':

            if (args.length === 0) {

                refresh();

            } else if (args[0] === 'on') {

                startRefresh();

            } else if (args[0] === 'off') {

                stopRefresh();

            }

            break;

        case 'get':

            get(args[0]);
            break;

        case 'set':

            setValue(args[0], args[1]);
            break;

        case 'raw':

            raw(args.join(' '));
            break;

        case 'trace':

            if (args[0] === 'on') {

                trace = true;
                log('Trace aktiviert.');

            } else if (args[0] === 'off') {

                trace = false;
                log('Trace deaktiviert.');

            }

            break;

        case 'summary':

            if (args[0] === 'reset') {

                resetSummary();

            } else {

                printSummary();

            }

            break;

        case 'repeat':

            if (args.length < 2) {

                log('repeat <COUNT> <COMMAND>');
                break;

            }

            repeatCommand(
                args[0],
                args.slice(1).join(' ')
            );

            break;

        case 'sleep':

            await sleep(args[0]);
            break;

        case 'help':

            printHelp();
            break;

        case 'quit':
        case 'exit':

            disconnect();

            rl.close();

            process.exit(0);

            break;

        default:

            log(`Unbekannter Befehl: ${cmd}`);

    }

    rl.prompt();

});

rl.on('close', () => {

    disconnect();

    process.exit(0);

});