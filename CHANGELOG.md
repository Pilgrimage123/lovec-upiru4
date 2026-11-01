# Changelog

Veškeré významné změny v projektu Lovec upírů jsou zaznamenávány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/).

## [1.2.0] - 2026-11-01

### Přidáno (Added)
- **Síň lovců (Hostinec „U Svěcené pípy“)**: Radikálně přestavěná úvodní obrazovka zasazená do atmosféry českého venkova a c. k. hospodské gotiky konce 19. století.
- **4 velkoformátové Lovecké archy**: Paralelní zobrazení všech 4 hratelných lovců (Venca Česnekáč, Hloupý Honza, Rittmeister Jaromír, Káča Pavučina) s erby, pivními známkami, podpisovými zbraněmi a parodickými hláškami.
- **C. k. výpravní glejt**: Spodní úřední panel se seedem expedičního spisu, generátorem parodických seedů (`CESNEK-1899`, `POVIDLA-1420`, `C-K-DRAGOUN-1848`...) a spouštěcím tlačítkem „Vyrazit na Drákulu [ENTER]“.
- **Záchranný systém portrétů**: Automatický erbovní fallback s velkým symbolem a zlatou září v případě chybějících externích obrázků.
- **Centralizovaná správa portrétů (`HUNTER_PORTRAITS`)**: Připravené rozhraní pro budoucí nahrání finálních ilustrací.
- **Doménová dokumentace**: Vytvořen `GLOSSARY.md` a architektonický záznam `docs/adr/0001-sin-lovcu-front-page-architecture.md`.

### Změněno (Changed)
- **Vizuální styl a scénografie**: Opustil se původní šedo-modrý dashboard ve prospěch tmavé hospodské gotiky, teplého svitu loučí a měsíčního svitu.
- **Zvýšení kontrastu písma**: Kompletní revize barev textů, odstranění nevýrazných poloprůhledných vrstev na tmavých podkladech a zajištění vysoké čitelnosti všech taktických popisů a klávesových zkratek.
