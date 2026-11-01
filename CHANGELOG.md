# Changelog

Veškeré významné změny v projektu Lovec upírů jsou zaznamenávány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/).

## [1.3.0] - 2026-11-01

### Přidáno (Added)
- **Obrana a Štít**: Lovci i nepřátelé mají trvalou Obranu (Jaromír 2, Káča 2, Venca 1, Honza 0; nepřátelé 0–3 podle archetypu). Štít rovný Obraně se nahazuje na začátku bitvy a po každém kole protivníků; nevyužitý Štít na konci kola zcela vyprchá.
- **Švunk**: Kombo o 2+ destičkách, které zabije nepřítele, zkrátí Chladnutí své první destičky o počet destiček v kombu (kdykoliv během bitvy). Nahrazuje původní Momentum.
- **Ukazatel manévru**: Stav Chladnutí manévru Krok do nepřítele v HUD a v ovládací liště.
- **Zobrazení Obrany**: Odznak `🛡️X` u HP baru, Obrana v HUD, inspektoru nepřítele a na kartách lovců.
- **Dokumentace**: ADR 0002 (Chladnutí a Švunk), ADR 0003 (Obrana a cyklus Štítu), nové pojmy v `GLOSSARY.md`.
- **Testy**: `scratch_tests/test_obrana_stit.mjs`.

### Změněno (Changed)
- **Chladnutí**: Destička po zahrání drží plnou hodnotu a začne klesat až v dalších tazích (dříve se hned odečetl 1 tah). Anglicismy „Cooldown/CD“ nahrazeny termínem Chladnutí.
- **Krok do nepřítele**: Chladnutí manévru podléhá stejným zkracovačům jako destičky (např. Čekání s kapesními hodinkami).
- **Štít**: Pohlcuje zranění bod po bodu; vedlejší efekty projdou jen při průrazu do HP.

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
