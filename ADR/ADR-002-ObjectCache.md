# ADR-002 – Navigation statt dauerhafter Luxtronik-IDs

Luxtronik-IDs können sich ändern. Der Adapter liest die Navigation deshalb bei
jeder Verbindung neu ein und hält die Zuordnung nur in `Session` im Speicher.

`ObjectCache` ist für eine spätere Erweiterung vorgesehen und wird in V0.2.1
noch nicht als Laufzeitquelle verwendet.
