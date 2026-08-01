# Luxtronik WebSocket Protokoll

Version: 2026-07-28

Dieses Dokument beschreibt den aktuellen Kenntnisstand des WebSocket-Protokolls der Luxtronik-Weboberfläche.

Status:
- ✅ Verifiziert = durch Browser- oder Wireshark-Mitschnitt bestätigt
- ⚠️ Hypothese = wahrscheinlich, aber noch nicht vollständig bestätigt
- ❓ Offen = noch zu untersuchen

---

# 1. Verbindung

## WebSocket

URL

```
ws://<IP>:8214
```

Subprotocol

```
Lux_WS
```

Status: ✅ Verifiziert

---

# 2. Login

Client

```
LOGIN;<PIN>
```

Beispiel

```
LOGIN;999999
```

Antwort

```
Navigation
```

Status: ✅ Verifiziert

---

# 3. Navigation

Antwort nach erfolgreichem Login.

Beispiel

```json
{
    "type":"Navigation",
    "items":[ ... ]
}
```

Enthält

- Bereiche
- Navigations-IDs
- Namen
- readOnly

Status: ✅ Verifiziert

---

# 4. GET

Client

```
GET;<Navigation-ID>
```

Beispiel

```
GET;0x42cfbc80
```

Antwort

```
Content
```

Status: ✅ Verifiziert

Hinweis

Die Navigation-ID stammt aus der aktuellen Navigation.

---

# 5. Content

Antwort auf GET.

Beispiel

```json
{
    "type":"Content",
    "name":"Einstellungen",
    "items":[ ... ]
}
```

Enthält

- Item-ID
- Name
- raw
- value
- type
- options
- min
- max
- step

Status: ✅ Verifiziert

---

# 6. SET

Client

```
SET;set_<Item-ID>;<raw>
```

Beispiel

```
SET;set_0x42cf66ac;4
```

Status: ✅ Verifiziert

Nach erfolgreichem SET erfolgt kein Content.

Stattdessen erscheinen nach REFRESH aktualisierte values.

---

# 7. SAVE

Client

```
SAVE;1
```

Status: ✅ Verifiziert (Wireshark)

Nach SAVE sendet die Luxtronik erneut ein vollständiges Content.

SAVE scheint Änderungen dauerhaft zu übernehmen.

## Schreiben im Adapter (V0.2.1)

Der Adapter öffnet für einen Schreibauftrag eine eigene Sitzung und verwendet
diese Reihenfolge:

```text
LOGIN → Navigation → GET Bereich → SET → SAVE → GET Bereich → Verify
```

Nach dem zweiten `GET` wird der zurückgelesene Rohwert mit dem angeforderten
Wert verglichen. Stimmen beide nicht überein, wird der Auftrag als
Schreibfehler behandelt.

---

# 8. REFRESH

Client

```
REFRESH
```

Status: ✅ Verifiziert

Browser sendet REFRESH ungefähr einmal pro Sekunde.

REFRESH erzeugt keine direkte Antwort.

Nach REFRESH können values erscheinen.

---

# 9. values

Server

```json
{
    "type":"values",
    "items":[
        {
            "id":"0x42cf66ac",
            "value":"Aus"
        }
    ]
}
```

Status: ✅ Verifiziert

Enthält ausschließlich aktuelle Werte.

Keine Metadaten.

---

# 10. Kommunikationsablauf

Login

```
LOGIN

↓

Navigation
```

Bereich öffnen

```
GET

↓

Content
```

Wert ändern

```
SET

↓

REFRESH

↓

values
```

Speichern

```
SAVE;1

↓

Content

↓

REFRESH

↓

values
```

Status: ✅ Verifiziert

---

# 11. IDs

Navigation

liefert

Navigation-IDs.

Content

liefert

Item-IDs.

SET verwendet ausschließlich Item-IDs.

Status: ✅ Verifiziert

---

# 12. Session

⚠️ Hypothese

Die Luxtronik verwaltet einen Sitzungszustand.

Dieser beeinflusst möglicherweise

- gültige IDs
- Schreibzugriffe
- GET

Noch zu untersuchen.

---

# 13. Broadcast

Test

Browser + Testclient gleichzeitig verbunden.

Ergebnis

Änderungen im Browser wurden nicht an den Testclient übertragen.

Status: ✅ Verifiziert

Die WebSocket-Verbindung arbeitet offenbar nicht als Publish/Subscribe-System.

---

# 14. Offene Fragen

## OQ-001

Warum trennt die Luxtronik den Testclient bei GET?

Status

Offen

---

## OQ-002

Welche Bedeutung hat REFRESH intern?

Status

Teilweise verstanden.

---

## OQ-003

Sind Navigation-IDs oder Item-IDs sitzungsabhängig?

Status

Zu prüfen.

---

## OQ-004

Welche Antwort liefert SAVE?

Status

Zu untersuchen.

---

# 15. Firmware

Getestet mit

Luxtronic

```
3.92.2
```

Antwortformat

```
JSON
```

---

# Changelog

## 2026-07-28

Erstfassung.

Verifiziert

- LOGIN
- Navigation
- GET
- Content
- SET
- SAVE
- REFRESH
- values
