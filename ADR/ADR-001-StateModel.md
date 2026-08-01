# ADR-001 – State-Modell

Die Luxtronik liefert bei schreibbaren Parametern einen Rohwert (`raw`) und
einen Anzeigewert (`value`). ioBroker zeigt bei Parametern mit `div` den
skalierten Wert und skaliert Min, Max und Schrittweite entsprechend.

Bestehende ioBroker-Objekte behalten ihren bereits angelegten Typ, weil
ioBroker diesen Typ nicht nachträglich ändern kann.
