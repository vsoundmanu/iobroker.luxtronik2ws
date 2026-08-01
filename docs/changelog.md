## 0.2.1 (2026-08-01)

### Added

- Schreiben der Betriebsarten `Einstellungen.heizkreis` und
  `Einstellungen.warmwasser`
- FIFO-WriteQueue: Schreibaufträge werden nacheinander ausgeführt
- Verify: Nach `SET` und `SAVE` liest der Adapter den Wert erneut und meldet
  eine Abweichung als Schreibfehler
- Sofortiger Refresh des betroffenen Bereichs nach erfolgreichem Schreiben

### Fixed

- Skalierung von Luxtronik-Rohwerten mit `div` beim Anlegen von States
- Bestehende ioBroker-State-Typen werden beim Aktualisieren berücksichtigt
- Vollständige Abfrage aller Navigationsbereiche wiederhergestellt
- WebSocket-Pakete werden nur noch auf Debug-Level geloggt; Login-PINs werden
  im Log maskiert

### Changed

- Schreibpfad bereinigt und nicht verwendete Platzhalter entfernt
- Versioniertes Deployment-Skript unter `tools/deploy.sh` ergänzt

## 0.2.0 (development)

### Changed

- Introduced Protocol class
- Moved WebSocket connection into Protocol
- Moved send() into Protocol

### Internal

- Project structure created
- Development workflow established
