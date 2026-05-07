# Silevis - Tablica wyników

Frontend-only ranking wyników wyciskania na klatę i podciągania na drążku.

Uruchomienie lokalne: otwórz `index.html` w przeglądarce.

Dane zapisują się lokalnie w przeglądarce przez IndexedDB, z awaryjnym fallbackiem do localStorage. Każda zakładka ma osobny zestaw wyników, opis algorytmu punktacji, eksport danych do JSON oraz CSV, import JSON i bezpieczne czyszczenie wyników z opcjonalnym backupem.
