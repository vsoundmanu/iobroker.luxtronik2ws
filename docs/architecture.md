# Luxtronik2WS Adapter Architecture

Version: 0.2.0

---

# Ziel

Der Adapter trennt Kommunikation, Datenmodell und
ioBroker vollständig voneinander.

Die Kommunikation erfolgt ausschließlich über die
Luxtronik-WebSocket-Schnittstelle.

---

# Komponenten

## main.js

Verantwortlich für

- Adapterstart
- ioBroker
- MQTT
- Konfiguration

Nicht verantwortlich für

- WebSocket
- Parsing
- SET
- SAVE

---

## Protocol

Verantwortlich für

- WebSocket
- Login
- RX
- TX
- JSON Parsing
- Dispatcher

Keine Kenntnis über ioBroker.

---

## ObjectCache

Speichert sämtliche Parameter.

Quelle der Wahrheit für

- luxId
- raw
- value
- type
- options
- writable

---

## Writer

Verantwortlich für

SET

SAVE

Verify

Retry

---

# Datenfluss

Lesen

Protocol

↓

Parameter

↓

ObjectCache

↓

ioBroker

↓

MQTT

Schreiben

ioBroker

↓

Writer

↓

ObjectCache

↓

Protocol

↓

Luxtronik

---

# Architekturregeln

1.
Keine Klasse kennt WebSocket außer Protocol.

2.
Keine Klasse kennt ioBroker außer main.js.

3.
Writer arbeitet ausschließlich mit Parameter-Objekten.

4.
ObjectCache ist die einzige Quelle für Metadaten.

5.
LuxIDs werden niemals dauerhaft gespeichert.


## Parameter Model

Der Adapter verwendet intern ausschließlich Parameter-Objekte.

Ein Parameter beschreibt genau ein Objekt der Luxtronik.

Eigenschaften:

...q
