# ioBroker.luxtronik2ws

WebSocket-basierter ioBroker-Adapter für Alpha Innotec / Novelan / Siemens Luxtronik Wärmepumpen.

Dieser Adapter kommuniziert direkt mit der integrierten Luxtronik-Weboberfläche über das WebSocket-Protokoll und liest sowie schreibt nahezu alle verfügbaren Parameter.

---

## Highlights

- Vollständige Kommunikation über das Luxtronik-WebSocket-Protokoll
- Automatische Erkennung der Menüstruktur
- Dynamische Erzeugung aller ioBroker-Objekte
- Rekursive Abbildung der kompletten Menüstruktur
- Lesen sämtlicher verfügbarer Werte
- Schreiben von Einstellungen direkt aus ioBroker
- MQTT-Unterstützung für externe Systeme (z.B. Loxone)
- Konfigurierbare Polling-Intervalle
- Unterstützt aktuelle Luxtronik-Webinterfaces

---

## Unterstützte Systeme

- Alpha Innotec
- Novelan
- Siemens
- weitere Luxtronik-Systeme mit WebSocket-Weboberfläche

---

## Architektur

```
            Luxtronik

           WebSocket
          /         \
         /           \
 Reader             Writer
 (dauerhaft)     (temporär)

 Polling         CONNECT
 Navigation      LOGIN
 States          GET
 MQTT            SET
                 SAVE
                 CLOSE
```

### Reader

Der Reader hält dauerhaft eine WebSocket-Verbindung zur Wärmepumpe.

Er übernimmt

- Navigation
- Polling
- Objektverwaltung
- MQTT
- Aktualisierung der ioBroker-States

### Writer

Der Writer verwendet bewusst eine eigene kurzlebige WebSocket-Verbindung.

Für jeden Schreibvorgang wird

```
CONNECT
LOGIN
GET
SET
SAVE
DISCONNECT
```

durchgeführt.

Dadurch beeinflussen sich Lesen und Schreiben nicht gegenseitig.

---

## Objektstruktur

Der Objektbaum entspricht der Menüstruktur der Luxtronik-Weboberfläche.

Beispiel

```
informationen
    temperaturen
    waermemenge
    leistungsaufnahme

einstellungen
    heizkreis
    warmwasser

anlagenstatus

eingaenge

ausgaenge
```

---

## Installation

```bash
npm install
```

Danach

```bash
iobroker add luxtronik2ws
```

---

## Konfiguration

- IP-Adresse
- Passwort
- Pollingintervall
- gewünschte Bereiche

---

## Entwicklung

Projektstruktur

```
lib/
    protocol.js
    session.js
    writer.js
    write-session.js
    write-mapping.js
```

---

## Roadmap

- Write Queue
- Verify nach Schreibvorgängen
- automatische Mapping-Erzeugung
- Export-/Importfunktionen
- weitere schreibbare Parameter

---

## Credits

Dieses Projekt basiert auf den Untersuchungen und der Vorarbeit des ursprünglichen Projekts
https://github.com/civiale/iobroker.luxtronik2ws

**iobroker.luxtronik**

Vielen Dank an den ursprünglichen Autor für die Analyse des Luxtronik-Webinterfaces und die ersten Implementierungen.

Der Adapter wurde anschließend grundlegend weiterentwickelt:

- vollständige WebSocket-Kommunikation
- neue Reader/Writer-Architektur
- dynamische Objekterzeugung
- rekursive Menüabbildung
- Schreibunterstützung
- MQTT
- zahlreiche funktionale Erweiterungen.

---

## Lizenz

MIT
