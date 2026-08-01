# ADR-003 – Sicheres Schreiben

Schreibvorgänge werden in `WriteQueue` serialisiert. Ein Auftrag verwendet
eine eigene `WriteSession` und gilt erst nach `SET`, `SAVE` und erfolgreichem
Zurücklesen des Werts als erfolgreich.

V0.2.1 beschränkt sich auf ein getestetes, statisches Write-Mapping für die
Betriebsarten von Heizkreis und Warmwasser.
