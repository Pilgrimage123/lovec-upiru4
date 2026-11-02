# Changelog

Veškeré významné změny v projektu Lovec upírů jsou zaznamenávány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/).

## [1.3.2] - 2026-11-02

### Opraveno (Fixed)
- **Kritický pád invariantu u Hloupého Honzy (`resolveHeroBump`)**: Při manévru *Selský beran* do nepřítele přiraženého ke zdi nebo překážce se pozice hrdiny dříve posouvala bezpodmínečně na obsazené pole, což vyvolalo pád hry a zamrznutí animací. Nyní se poškození a odhození vyhodnocují bezpečně a hrdina vstoupí na pole pouze v případě, že se uvolnilo.
- **Tlačítka kroku vedle nepřítele (`canHeroMoveDir`)**: Opravena podmínka v ovládací liště, která zakazovala krok vlevo/vpravo při sousedství s nepřítelem. Hráči na myši i dotykových obrazovkách nyní mohou kliknutím provést podpisový *Krok do nepřítele*.
- **Únik klávesových vstupů do bitvy na pozadí**: Ošetřena inicializace `appState.screen = 'title'` a zámek klávesnice v `main.js`, aby stisk kláves `1`–`4` či mezerníku na úvodní obrazovce nespouštěl akce ve skryté bitvě.
- **Klávesové zkratky v otevřených modálech**: Klávesové zkratky úvodní obrazovky (1–4, Enter, mezerník, R) jsou nyní zablokovány, pokud je otevřený jakýkoliv dialog (pravidla, archiv, animační laboratoř), a neaktivují omylem start hry při interakci s tlačítky.
- **Synchronizace výběru lovce z Hradního archivu**: Výběr lovce uvnitř modálu archivu na úvodní obrazovce se nyní okamžitě promítne do výběru na titulní straně.
- **Ukazatel manévru a chladnutí v HUD a ovládací liště**: Do DOM šablony HUDu a lišty akcí byly doplněny chybějící prvky manévru *Krok do nepřítele* s indikací chladnutí.
- **Oprava zobrazení Obrany pro Honzu**: V tooltipech HUDu byla opravena logická chyba `0 || 1`, která Honzovi mylně přisuzovala 1 Obranu namísto 0. Na mapě se nyní správně zobrazuje hodnota Obrany daného lovce.
- **Kolize CSS pravidla `.hidden`**: Doplněna explicitní specifičnost pro `#event-choices-box.hidden`, `#event-outcome-box.hidden`, `.neprakta-tooltip.hidden` a varovné odznaky ohrožení, které dříve zůstávaly viditelné kvůli `display: flex` v `ui.css`.
- **Kontrast textů v HUD, tooltipech a archivu**: Přepracovány barvy v `.hud-defense`, `.hud-maneuver`, depeších terénu v tooltipech a seznamu destiček v archivu pro bezchybnou čitelnost a splnění kontrastních norem.
- **Mobilní rozvržení akcí a výšky spritů**: Opraven selektor tlačítka náhledu `#btn-act-preview-toggle` v mobilní mřížce a upraveny výšky spritů v `@media (max-width: 720px)`, aby nepřetékaly z polí bojiště.
- **Animace a hlášení pro všechny lovce**: Opravena animace manévru *Kapsářská záměna* u Káči, aktualizace HP baru a odznaku při léčení, a nahrazena natvrdo zapsaná jména „Venca“ v bojových zprávách a oknech dynamickým jménem zvoleného lovce (Honza, Jaromír, Káča).

## [1.3.1] - 2026-11-02

### Opraveno (Fixed)
- **Výběr lovců na úvodní obrazovce**: Opraveno zobrazení a interaktivita Síně lovců:
  - Doplněn `@import "tailwindcss";` do `src/game/styles/main.css` pro plnou funkčnost Tailwind v4 utility tříd v produkčním i náhledovém sestavení.
  - Odstraněna kolize generického CSS pravidla `.hidden { display: none !important; }`, která potlačovala responzivní zobrazení `hidden lg:grid` a způsobovala skrytí karet na desktopech.
  - Doplněna chybějící vlastnost `defense: 2` pro Rittmeistera Jaromíra a Káču v `HUNTERS_DATA` dle TypeScript definice `HunterDeed`.
  - **Responzivní adaptace**: Kompaktní přepínač 4 záložek (`hunters-mobile-view`) na mobilech a tabletech (< 1024px) a 4 paralelní sloupce (`hunters-desktop-view`) na laptopech a desktopech (>= 1024px), vertikálně optimalizované pro standardní výšku 768px tak, aby tlačítko „VYRAZIT NA DRÁKULU“ bylo vždy viditelné bez ořezu.
  - **Klávesa Enter v poli seedu**: Stisk Enter při psaní v poli expedičního spisu nyní rovnou odstartuje hru se zvoleným lovcem a zadaným seedem.

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
