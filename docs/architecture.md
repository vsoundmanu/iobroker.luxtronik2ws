# Luxtronik2WS – Architektur

Version: 0.2.1

## Überblick

Der Adapter liest die Daten der Wärmepumpe über das Luxtronik-WebSocket-
Protokoll und stellt sie als ioBroker-States bereit. Zwei getestete
Betriebsarten können zusätzlich geschrieben werden.

## Komponenten

### `main.js`

- Startet und stoppt den Adapter.
- Erstellt und aktualisiert ioBroker-States.
- Steuert Polling, Reconnect und die optionale MQTT-Ausgabe.
- Übergibt nicht bestätigte State-Änderungen an die `WriteQueue`.

### `Protocol`

`Protocol` hält die dauerhafte WebSocket-Verbindung für das Lesen. Es meldet
sich an, leitet Nachrichten an `main.js` weiter und sendet die GET-Befehle des
Pollings.

### `Session`

Speichert die bei der Anmeldung erhaltenen Navigationsnamen und ihre aktuellen
Luxtronik-IDs. Die IDs werden bei jeder Verbindung neu eingelesen.

### `WriteQueue`

Reiht Schreibaufträge nach Eingangsreihenfolge ein. Es läuft immer nur ein
Auftrag gleichzeitig, damit sich `SET` und `SAVE` nicht gegenseitig stören.

### `Writer` und `WriteSession`

`Writer` löst eine unterstützte ioBroker-State-ID über `write-mapping.js` auf.
Für jeden Auftrag öffnet `WriteSession` eine kurzlebige WebSocket-Verbindung
und führt aus:

1. Anmeldung und Einlesen der Navigation
2. `GET` des Zielbereichs
3. `SET` mit der Luxtronik-Rohwert-ID
4. `SAVE;1`
5. erneutes `GET` und Vergleich des zurückgelesenen Werts (Verify)
6. Verbindung schließen

Nur ein bestätigter Vergleich zählt als erfolgreicher Schreibvorgang.

## Datenfluss

```text
Lesen:     Luxtronik → Protocol → main.js → ioBroker → MQTT (optional)
Schreiben: ioBroker → WriteQueue → Writer → WriteSession → Luxtronik
```

## Aktuelle Grenzen

- Schreibbar sind nur die in `write-mapping.js` hinterlegten Betriebsarten für
  Heizkreis und Warmwasser.
- `ObjectCache` und `Parameter` sind vorbereitete Dateien, aber noch kein
  aktiver Teil des Laufzeitpfads.
- Ein automatischer Retry bei fehlgeschlagener Verifikation ist noch nicht
  implementiert.
