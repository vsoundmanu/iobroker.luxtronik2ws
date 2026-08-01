# Technische Entscheidungen

## Schreiben in einer eigenen Sitzung

Der dauerhafte Lese-Kanal bleibt während des Pollings aktiv. Ein
Schreibvorgang öffnet deshalb eine kurze, eigene `WriteSession`. So kann der
Schreibablauf (`LOGIN`, `GET`, `SET`, `SAVE`, Verify) eindeutig abgegrenzt
werden.

## Serielle WriteQueue

Die Luxtronik wird nicht parallel beschrieben. `WriteQueue` führt Aufträge in
der Reihenfolge ihres Eingangs aus und fährt nach einem fehlgeschlagenen
Auftrag mit dem nächsten fort.

## Verify ist Teil eines erfolgreichen Schreibvorgangs

Ein erfolgreich übertragener WebSocket-Befehl ist keine ausreichende
Bestätigung. Erst wenn der nach `SAVE` erneut gelesene Rohwert dem gewünschten
Wert entspricht, gilt der Schreibauftrag als erfolgreich.

## Statisches Write-Mapping

V0.2.1 unterstützt bewusst nur die getesteten Betriebsarten für Heizkreis und
Warmwasser. Weitere Parameter werden erst nach Prüfung ihrer Rohwerte und
Seiteneffekte ergänzt.
