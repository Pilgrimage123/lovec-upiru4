# Changelog

Veškeré významné změny v projektu Lovec upírů jsou zaznamenávány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/).

## [2.2.0] - 2026-11-07

### Přidáno & Změněno (Added & Changed)
- **Chytrý systém komnat a procedurální generování bojiště (ADR 0015)**:
  - **Procedurální syntéza Bojiště (Smart Tactical Synthesizer)**:
    - Odklon od statických šablon k dynamické procedurální syntéze 1D arén z rozpočtu Hrozby (1–5) a Taktických archetypů (`swarm`, `shieldwall`, `snipers`, `brute_force`, `disruption`, `ambush`, `elite`).
    - Zaveden registr rolí nepřátel `ENEMY_ROLE_REGISTRY` a bodového ohodnocení (Roj = 1b, Úderník = 2b, Předvoj/Štít = 3b, Střelec = 3b, Elita = 5b).
    - Zastropování počtu nepřátel na startu (max 2 v Aktu 1, max 3 v Aktech 2–3); zbývající body rozpočtu přicházejí v telegrafovaných vlnách z bran (vlna 1 v tahu 4, vlna 2 v tahu 7) s dynamickým zrychlením při board-clearu.
  - **3 bezpečnostní invarianty terénu a férovosti**:
    - *Zóna bezpečného nápřahu*: Startovní pole lovce a jeho sousedé (`heroCell ± 1`) nikdy neobsahují propast ani kůly (garance bezpečného 1. tahu).
    - *Hustota pastí*: Pasti a překážky nepřekročí 25 % délky bojiště.
    - *Dostupnost*: Zákaz neprostupných zdí z nerozbitných překážek.
  - **Panské rozkazy komnaty (C. k. taktické anomálie)**:
    - 6 autentických tematických rozkazů (🪵 *Ztrouchnivělá podlaha*, 🧄 *Česnekový průvan z kuchyní*, 📜 *C. k. zákaz ústupu*, 🧱 *Úzká hradební římsa*, ⛪ *Posvěcená kaple*, 🕯️ *Zámecké šero a průvan*) se specifickými pravidly pro pohyb, dostřel a terén.
    - Selektivní výskyt na Severní výspě, u Elitních drábů a v bězích s aktivní Kletbou.
    - Plné telegrafování odznaku Panského rozkazu (`.map-node-order-pill`) přímo na Katastrální revírní mapě.
  - **Katastrální revírní mapa rozšířena na 8 etap (Etapa I–VIII)**:
    - Procedurální DAG graf s 8 etapami postupu panstvím a garancí minimálně 3–4 šarvátek před bossem.
    - Před-bossovská příprava (Etapa VII): Všechny cesty se před finálním bossem sbíhají do přípravného rozcestí s volbou mezi Hospodou U Svěcené pípy (léčení, proviant) a Kolářskou dílnou mistra Hanuše (vylepšení destiček).
    - Trůnní sál pána hradu (Etapa VIII): Vládce patra s unikátními fázemi.
  - **Doménová dokumentace a slovník**:
    - V `GLOSSARY.md` ukotveny pojmy *Katastrální revír*, *Komnata*, *Bojiště* a *Panský rozkaz komnaty*.
    - Sepsán architektonický záznam `docs/adr/0015-chytry-system-komnat-a-proceduralni-bojiste.md`.

## [2.1.0] - 2026-11-06

### Přidáno & Změněno (Added & Changed)
- **Časování akcí nepřátel, odpalování fronty a dynamické přesměrování útoků (ADR 0014)**:
  - **Kanonický model nepřátel bez číselných odpočtů**:
    - Odstraněny matoucí číselné odpočty u nepřátel ve prospěch fázového modelu: nepřátelé sestavují vlastní vícepoložkovou frontu destiček (kapacita 1–3 dle archetypu).
    - Fáze nabíjení fronty se nijak neindikuje textovým odznakem (žádný nápis „⚪ NABÍJÍ“; hráč vidí pouze destičky ve slotech bez zbytečného balastu).
    - Pokud hráč ustoupí během nabíjení, nepřítel ho pronásleduje krokem a rozpracované destičky si ve frontě ponechává.
    - Telegrafovaný pohyb (`👣 Krok`) i otočení (`🔄 Otočení`) dává hráči prostor na reakci stejným způsobem jako stav Příprava k odpálení (`🚨 1 AKCE`).
  - **Příprava k odpálení (🚨) a Kiting do prázdna**:
    - Po naplnění kapacity fronty nepřítel zčervená (`ARMED_RED` / `🚨 1 AKCE`). Hráč má garantován přesně 1 tah na reakci.
    - Pokud hráč v tomto tahu ustoupí mimo dosah, nepřítel sekne do prázdna, fronta se vyprázdní a použité destičky začnou chladnout.
  - **Dynamický přepočet palebné dráhy a Přátelská palba**:
    - Přežije-li nepřítel v `🚨` kombo hráče, jeho útok se neruší – dynamicky se vyhodnotí z jeho nové pozice a směru pohledu.
    - Zásah jiného nepřítele v nové dráze korektně uděluje poškození i vedlejší efekty a loguje kanonickou hlášku `🧛‍♂️💥 PŘÁTELSKÁ PALBA!`.
    - Pořadí hromadného odpalu se řídí Iniciativou; padne-li nepřítel zásahem spojence, jeho útok již neproběhne.
  - **Zdržení Zmatením (❓)**:
    - Stav Zmatení (❓) nepřátelskou frontu nemaže, nýbrž odkládá odpal o 1 tah.
    - U zmateného nepřítele se neindikuje výstraha nápřahu (`🚨`), nýbrž svítí čistý žlutý odznak `❓ ZMATEN`.
  - **Ekonomika tahů lovce**:
    - Vložení standardní destičky = 1 tah (rychlovky = 0 tahů).
    - Odpálení fronty = 1 tah (všechny zařazené destičky vyletí v sérii před nepřátelskou fází).
    - Vyjmutí a přerovnání destiček ve frontě = 0 tahů (zdarma).
  - **Doménová dokumentace a testy**:
    - Aktualizován `GLOSSARY.md` a sepsán architektonický záznam `docs/adr/0014-casovani-akci-nepratel-a-odpalovani-fronty.md`.
    - Vytvořena komplexní testovací sada `scratch_tests/test_enemy_timing_and_queue.mjs` (všech 6 testů prochází na 100 %).

## [2.0.0] - 2026-11-05

### Přidáno (Added)
- **Chytrý procedurální systém generování revírů a etap (Smart Stage System)**:
  - **Procedurální grafová mapa (DAG)**: Dynamické větvení revíru do 6 etap (Etapa I–VI) se zaručenou dopřednou návazností, nulovými slepými uličkami a stoprocentní průchodností k hradnímu bossovi pro každé unikátní semínko (`run.seed`).
  - **Taktické archetypy a rozpočet hrozby (Threat Budget)**:
    - Bohatá knihovna 29 předem navržených střetů roztříděných podle taktických archetypů (*Letecký & rychlý roj*, *Štítová hradba*, *Střelecká křížová palba*, *Zákeřná léčka & pasti*, *Přepadení ze zálohy*, *Surová drtivá síla*, *C. k. panská inkvizice*, *Vládce patra*).
    - Škála hrozby 1 až 5 (Boss 6) reflektující hloubku etapy a strategickou povahu zvolené trasy.
  - **Specializované trasy s poměrem rizika a odměny (Risk-Reward Lanes)**:
    - *Severní výspa (Vysoké riziko)*: Zvýšená hrozba, garantovaný elitní dráb ve 3. etapě, štědrá kořist a dukátový žold.
    - *Císařská magistrála (Vyvážený revír)*: Rovnoměrný průzkum s dílnami, křižovatkami a taktickými přestřelkami.
    - *Jižní hradební úvoz (Zásobovací stezka)*: Nižší hrozba, vyšší koncentrace pohostinství, náhodných setkání a truhlic.
  - **C. a k. katastrální kartografie s vektorovými kolejemi (SVG Rails)**:
    - Vizuální vykreslování hladkých Bézierových křivek spojujících uzly mapy (prošlé cesty v jantarovém lesku, volitelné cesty s dynamickou animací postupu, neaktivní v dobovém inkoustu).
    - Taktický průzkum na kartách uzlů: ukazatel hrozby (lebky), náhled taktického archetypu a průzkumná nápověda.

## [1.9.0] - 2026-11-04

### Přidáno & Vyváženo (Added & Balanced)
- **Vyvážení lovců podle benchmarku Sokola Venci a asymetrická Verva (ADR 0013)**:
  - **Benchmark Sokola Venci**: Sokol Venca Česnek (20 HP, 1 Obrana, 10 % Rozlícení, 5 Verva, rotace Chladnutí 2–2–3, silná poziční kontrola) stanoven jako kanonický vyvažovací etalon hry.
  - **Asymetrická Verva (škála 4 až 7)**:
    - *Chasník Honza*: Verva **7** (ultimátní selský držák kompenzující 0 Obranu).
    - *Ponocný Bartoloměj*: Verva **6** (starý noční strážce ošlehaný lety ve službě).
    - *Kapsářka Káča*: Verva **6** (pouliční houževnatost jako záchranná síť pro nízkých 14 HP).
    - *Revident Ignác*: Verva **5** (úřední vytrvalost).
    - *Sokol Venca*: Verva **5** (zlatý střed a benchmark rovnováhy).
    - *Silák Gustav*: Verva **5** (cirkusový silák).
    - *Sir Arthur*: Verva **5** (koloniální veterán).
    - *Lady Gwendolyn*: Verva **4** (aristokratická dáma spoléhající na komorníka).
    - *Rittmeister Jaromír*: Verva **4** (důstojník spoléhající na výcvik a kryt čepelí).
  - **Odstranění hluchých tahů Ponocného**:
    - Destička *Půlnoční lucerna* zrychlena ze 4 na **Chladnutí 3** (poškození 2 DMG, zachováno Zmatení ❓ a −15 % Rozlícení nepřítele).
    - Manévr *Zarazení ratištěm* (Krok do nepřítele) zrychlen ze 4 na **Chladnutí 3**.
  - **Bojová renesance Revidenta Ignáce Šimla**:
    - Destička *Mosazné razítko „ZAMÍTNUTO“* posílena z 1 na **2 DMG** (s pasivkou a kolkem uděluje až 4 DMG).
    - Destička *Služební revolver Rast & Gasser* zkrácena z 5 na **Chladnutí 3**.
    - Základní zdraví navýšeno z 16 na **18 HP**.
  - **Zkrocení Rittmeistera Jaromíra Vraného**:
    - Základní zdraví sníženo z 24 na **20 HP** (vyrovnáno s Vencou a Honzou), čímž byl odstraněn přehnaný polštář životů.
  - **Zoufalý furiant (Chasník Honza)**:
    - Při prvním vstupu do stavu Zubatá ($HP \le 0$) získá Honza okamžitý jednorázový nouzový nával **+25 % Bojového rozlícení**.
  - **Správa a obnova Vervy v Hospodě U Svěcené pípy**:
    - Pivo a guláš v hospodě plně doplňuje degradovanou Vervu zpět do maxima lovce.

- **Prohloubení taktických rolí lovců a aktivní modulace Rozlícení (ADR 0012)**:
  - **9 unikátních pasivních signatur**:
    - *Chasník Honza (Selský furiant)*: +10 % Rozlícení při každém průrazu zranění do tělesného HP.
    - *Silák Gustav (Cirkusová dominance)*: +1 kolizní DMG při nárazu nepřítele o zeď/entitu a +2 Štít pro Gustava.
    - *Rittmeister Jaromír (Kavalírský nápřah)*: Po posunu vpřed uděluje útokem +2 DMG a ignoruje 1 bod nepřátelského Brnění.
    - *Sir Arthur (Lovec trofejí)*: Zásah na dálku (2+ pole) do krvácejícího cíle uděluje +2 DMG a snižuje Chladnutí destičky o 1.
    - *Ponocný Bartoloměj (Zákaz nočního vycházení)*: Na začátku kola získá +1 Štít za každého nepřítele v dosahu lucerny (1–2 pole).
    - *Revident Ignác (C. k. daňová kontrola)*: Zásah cíle se stavem [OKOLKOVÁNO] uděluje +1 DMG a Revident získává +1 Štít.
    - *Lady Gwendolyn (Noblesní sebeovládání)*: Destička *Královská etiketa* noblesně přetaví veškeré kladné Rozlícení na Štít (každých 5 % Rozlícení = +1 Štít).
    - *Kapsářka Káča (Zákeřný úder)*: Mistrovský bonus +100 % k poškození ze zálohy nebo proti zmateným cílům.
    - *Sokol Venca (Sokolský tělocvik)*: Akrobatické skoky, přitahování a Česnekový oblak pro definitivní dorážení upírů.
  - **Aktivní modulace Rozlícení a stav Zchlazení 🧊**:
    - Možnost dynamicky zvyšovat Rozlícení (*Nápřah* +20 %, *Zatnutí svalů* +10 %) i snižovat (*Povidlová buchta* −15 %, *Půlnoční lucerna* −15 % nepříteli).
    - Pokles pod 0 % aktivuje stav **Zchlazení 🧊** (až do limitu −50 %), snižující útočné poškození při garanci minimálně 1 DMG.
  - **Sjednocení a vymýcení nekanonických stavů**:
    - Nekanonický stav a pojem „Omráčení“ byl 100% vymýcen ve prospěch jednotného stavu **Zmatení (❓)**.
    - Startovní balíček Revidenta standardizován na 3 destičky (destička *Kontrola domovského listu* přesunuta do bazénu odměn).
    - Mechanika **Švunk** nově zkracuje i Chladnutí manévru Krok do nepřítele.

### Ověřeno (Verified)
- Všech 15 testovacích modulů v `scratch_tests/` prochází se 100% úspěšností.
- Kompletní produkční build Vite / TypeScript prošel bez chyb a varování za 920 ms.

## [1.8.0] - 2026-11-04

### Přidáno (Added)
- **Mechanika Zubatá a Verva (Persistence & Death's Door) (ADR 0011)**:
  - Zaveden permanentní run-level atribut **Verva** (`persistence: 5`, `maxPersistence: 5`), určující, jak hluboko do záporných životů může hrdina klesnout, než definitivně podlehne smrti.
  - Zaveden stav **Zubatá** (`isReaperActive: true`), který se aktivuje při poklesu hrdiny do záporných životů (`currentHP <= 0`).
  - Deterministický **Odpočet Zubaté** (`reaperCountdown = persistence + currentHP`):
    - Pokud `reaperCountdown <= 0`, hrdina okamžitě umírá a bitva končí porážkou.
    - Pokud `reaperCountdown > 0`, hrdina žije a pokračuje v boji.
  - **Okamžité vyklizení fronty akcí**: Při vstupu do Zubaté nebo při utrpění dalšího zásahu v Zubaté se všechny destičky z fronty okamžitě vrátí do ruky (`state.queue = []`, `tile.inQueue = false`) bez spuštění a bez spuštění chladnutí. Vykonávání komba se ihned přeruší.
  - **Úbytek Vervy na konci tahu**: Trvalý úbytek `persistence -= 1` nastává pouze tehdy, pokud hrdina v Zubaté své kolo zahájil i ukončil (`heroStartedTurnInReaper`). Zásah od nepřítele během nepřátelské fáze tak nesebere Vervu okamžitě – hrdina má vždy celý svůj tah na reakci a záchranu.
  - **Zahnání Zubaté a návrat ze záhrobí**:
    - *Léčení*: Přímé přičítání léčení k záporným HP. Při dosažení `HP >= 1` je Zubatá okamžitě zažehnána (`isReaperActive = false`), Verva zůstává na aktuální hodnotě.
    - *Vítězství v místnosti*: Porážka všech nepřátel automaticky stabilizuje přeživšího hrdinu na `1 HP`, zažene Zubatou a v daném kole nezpůsobí úbytek Vervy.
    - *Hospoda U Svěcené pípy*: Dát si pivo a guláš nyní kromě uzdravení +2 HP plně obnovuje Vervu zpět na `maxPersistence` (5).
  - **UI a vizuální zpětná vazba**:
    - Pulzující odznak `💀 [odpočet] ZUBATÁ` přímo nad postavou lovce na šachovnici.
    - Číslo odpočtu Zubaté v HP baru `${hp}/${maxHp} (💀 ${countdown})` a v HUDu lovce.
    - Plovoucí textové animace pro vstup do Zubaté, vyklizení fronty, úbytek Vervy i její zažehnání.
    - Zobrazení statistiky `🪦 5 Verva` v Síni lovců i v HUDu výpravy.

- **Prohloubení lovců a aktivní modulace Rozlícení (ADR 0012)**:
  - Unikátní pasivní signatury pro všech 9 lovců (Selský furiant, Kavalírský nápřah, Cirkusová dominance, Noblesní sebeovládání, Zákaz nočního vycházení, Lovec trofejí, C. k. daňová kontrola, Zákeřný úder, Sokolský tělocvik).
  - Aktivní modulace Bojového rozlícení a stav **Zchlazení** (`cold` / 🧊) až do -50 % poškození (s garancí minimálního zranění 1 DMG).
  - Mechanika **Švunk**: Eliminace upíra v kombu (2+ destičky) zkracuje Chladnutí otevírací destičky i manévru Krok do nepřítele.

### Ověřeno (Verified)
- Všech 8 testů mechaniky Zubaté v `scratch_tests/test_zubata_deaths_door.mjs` prochází na 100 %.
- Všechny regresní testovací sady (`test_all_fixes.mjs`, `test_all_seven_heroes.mjs`, `test_bojove_rozliceni.mjs`, `test_helsing_and_revident.mjs`, `test_hunter_refinement.mjs`, `test_ponocny_and_comic_bubbles.mjs`) prochází bez chyb.
- Produkční Vite build probíhá úspěšně.

## [1.7.0] - 2026-11-03

### Přidáno (Added)
- **Mechanika Bojové rozlícení (ADR 0008)**:
  - Každé kolo si každá postava na bojišti kumuluje procentuální bonus ke všemu zranění v boji (+X % za kolo podle své přirozenosti a temperamentu).
  - Distribuce rozlícení:
    - Podpůrné, střelecké a slabší jednotky (`fodder`, `ranged`, `support`): +5 % za kolo.
    - Běžní bojovníci a standardní lovci (Venca, Arthur, Ignác, Jaromír, Káča, Bartoloměj, Gwendolyn): +10 % za kolo.
    - Chasník Honza a Silák Gustav: +15 % za kolo (horkokrevní siláci).
    - Bossové (Sosák, Dagmar, Drákula), elity a brutové: +25 % za kolo.
  - Vzorec výpočtu poškození: `Math.round(baseDamage * (1 + currentFury / 100))` (hodnota 0,5 se zaokrouhluje nahoru).
  - Vztah k odhození a srážkám: Kinetická síla srážky o zeď či o jinou jednotku přejímá bonus rozlícení od odstrkujícího útočníka (zraněni jsou odstrčený i sekundární blokátor, útočník je chráněn).
  - UI zobrazení: Indikátor `🔥/💢 +X% Rozlícení` v HUDu lovce, na kartě v Síni lovců i na taktické desce.

- **Mechanika Zákeřný úder (ADR 0009)**:
  - Útok zasazený do zad protivníka (útočník i cíl se dívají stejným směrem, nebo útočník stojí za zády cíle) nebo na zmateného nepřítele (`confusion` / ❓) uděluje o **+50 % vyšší zranění**.
  - Mistrovský bonus pro Kapsářku Káču: Káča má jako rodilá zlodějka bonus **+100 % zranění** (dvojnásobné poškození).
  - Obě podmínky (záda i zmatení) se nesčítají multiplikativně – aplikuje se platný vyšší bonus jednou.
  - Platí obousměrně pro lovce i nepřátele.
  - UI zobrazení: Odznak `🗡️ +100 % Zákeřný úder` v kartě hrdiny, záznamy v bojovém deníku.

- **Mechanika Brnění a vrstvená ochrana (ADR 0010)**:
  - Pasivní redukce průrazového fyzického zranění.
  - Kánonické pořadí vrstvené obrany: **Útok ➔ Štít (aktivní krytí) ➔ Brnění (pasivní redukce tělem/pláty) ➔ Zdraví (HP)**.
  - Tlumí přímé údery, komba i nárazy do hradní zdi. Dokáže redukovat poškození až na 0 DMG.
  - Bypassy: Stavové efekty jako Krvácení (`bleed`) a environmentální/chemické vlivy (`garlic_cloud`, `pit`, `holy_water_puddle`) procházejí skrze Brnění bez redukce.
  - Sekundární efekty: Odhození (`push`), otočení (`flip`) a ochromení (`stun`) projdou i při redukci fyzického zranění na 0 DMG.
  - Distribuce:
    - Lovci: Silák Gustav (`armor: 1`), Chasník Honza (`armor: 1` jako vyvážení za 0 Obrany), Rittmeister Jaromír Vraný (`armor: 0` – látkový stejnokroj bez kyrysu), ostatní lovci `armor: 0`.
    - Nepřátelé: `armor: 2` pro `rytir_prizrak`, `drevo`, `prase_mutant`, `divocak`, `elite_drab`; `armor: 1` pro `drab`, `kyjovec`, `sedlak_stit`, `upirske_prase`, `boss_drakula`, `boss_dagmar`.
  - UI zobrazení: Smaragdový odznak `🦺X` na HP baru, plovoucí komiksový nápis `🦺 -X BRNĚNÍ`, štítek v HUD i na úvodní obrazovce.

- **Architektonické záznamy (ADR) a glosář**:
  - [ADR 0008](docs/adr/0008-mechanika-bojoveho-rozliceni.md): Mechanika Bojového rozlícení.
  - [ADR 0009](docs/adr/0009-mechanika-zakerneho-uderu.md): Mechanika Zákeřného úderu.
  - [ADR 0010](docs/adr/0010-mechanika-brneni-a-vrstvena-ochrana.md): Mechanika Brnění a vrstvená ochrana.
  - Aktualizován doménový slovník [GLOSSARY.md](GLOSSARY.md) o pojmy *Bojové rozlícení*, *Zákeřný úder*, *Brnění* a zpřesněn pojem *Obrana*.

- **Automatizované testy (scratch_tests)**:
  - Přidány testovací sady `test_bojove_rozliceni.mjs`, `test_zakerne_udery.mjs`, `test_brneni.mjs`.
  - Všech 13 testovacích sad v `scratch_tests/` plně prochází se 100% úspěšností.

## [1.6.0] - 2026-11-03

### Změněno (Changed)
- **Historická autenticita 19. století a odstranění anachronismů (ADR 0007)**:
  - *Kanálový poklop*: Letopočet vzniku litinového poklopu posunut z anachronického roku 1924 na dobový rok **1889** (období rozmachu pražských vodáren a c. k. sléváren).
  - *Oprava hřebíků*: Odstraněna narážka na „soudruhy památkáře“ u destičky *Dupnutí na prkno*, nahrazena dobovým „c. k. stavebním hejtmanstvím“.
  - *Šlechtická despocie místo korporace*: Hrabě Leopold von Nochtic zbaven manažersko-korporátního žargonu (holding, akcie, fúze, odstupné, lidské zdroje) a převeden do polohy arogantního c. k. tajného rady a feudálního vykořisťovatele (guberniální dekrety, panská robota, krevní desátek, nochtické dominium).
  - *Odstranění modernismů z hlášek*: Zlodějka Káča krade „zlaté pero“ namísto propisky; Upír-praktikant má tovaryšský list a čelední knížku namísto DPP a pracovní smlouvy; Revident Šiml účtuje přirážku k potravní dani (akcízu) namísto DPH.
  - *Výzbroj c. k. dragouna*: Zastaralá křesadlovka Rittmeistera Jaromíra nahrazena dobově věrným **Armádním revolverem Gasser M1870** ráže 11 mm (včetně vylepšení *Vyladěný revolver Gasser+* a *Důstojnický revolver Gasser++*).
  - *Vyčištění seedů a textů*: Relikt `DRACULA-007` nahrazen seedem `NOCHTIC-1899` a zástupný text `HRAD-1905` v nastavení opraven na `HRAD-1899`.
  - *Slovanský folklór v bestiáři*: Oživlý nebožtík Hynek přejmenován na autentického **Umrlce Hynka**; upíří trpaslík upraven na **Upířího skřítka Šmudlu**.
  - *Dokumentace domény*: Vytvořen architektonický záznam [ADR 0007](docs/adr/0007-historicka-autenticita-a-odstraneni-anachronismu.md) a do [GLOSSARY.md](GLOSSARY.md) zapsány kánonické termíny *Umrlec*, *Hrabě Leopold von Nochtic* a *Armádní revolver Gasser*.

## [1.5.0] - 2026-11-03

### Přidáno (Added)
- **Nový lovec: Profesor Gabriel van Helsing (Vědecký okultista)**:
  - Založen na stylu Van Helsinga (ikona 🏹, klávesa `8`, 18 HP, 1 Obrana).
  - Vyzbrojen opakovací rotační kuší (multishot crossbow), stříbrnou municí a balistickými tabulkami.
  - **Startovní destičky**:
    - *Rotační opakovací kuše* (typ střelba, dosah 4 pole, CD 3): Vypálí rotační dávku 2 stříbrných šipek v rychlém sledu (2x 2 DMG = 4 DMG celkem).
    - *Stříbrná salva šípů* (typ střelba, dosah 3 pole, CD 3): Způsobí 3 DMG a Krvácení (2) na 2 tahy.
    - *Odskok a natažení rumpálu* (typ nablízko / pohyb, CD 3): Udeří nepřítele za 2 DMG, odhodí o 1 pole, odskočí o 1 pole vzad a zkrátí Chladnutí střeleckých destiček o 1.
  - **Krok do nepřítele**: *Úder pažbou kuše* — udeří nepřítele okovanou pažbou za 2 DMG a odhodí ho o 1 pole vzad (Chladnutí 2).
  - **3-Kombo**: *Kruhový rotační rozptyl* — roztočí multishot mechanismus a zasáhne všechny nepřátele v linii dohledu za 4 DMG + Krvácení 2.
  - **Komiksové bubliny**: Vědecké, balistické a empirické hlášky („Hypotéza: vaše tkáň nesnese stříbro. Důkaz provedu za tři... dva... jedna...“).

- **Nový lovec: C. k. vrchní revident (Ignác Šiml)**:
  - Císařský daňový exekutor s přísnou byrokracií (ikona 📑, klávesa `9`).
  - **Životy (HP)**: Přesně 4 HP (střední výdrž – chráněn tvídovým převlečníkem a tlustým fasciklem spisů na hrudi reprezentovaným 2 Obranou = 2 Štít).
  - **Unikátní schopnost (Signature Action) — „Úřední předvolání“**:
    - Pokud se revident otočí čelem k nepříteli vzdálenému přesně 2 políčka, zdarma si ho přitáhne o 1 políčko k sobě a nalepí na něj stav `[OKOLKOVÁNO]` (Cooldown: 2 tahy).
  - **Nový stav `[OKOLKOVÁNO]`**: Další útok do tohoto cíle způsobí +1 poškození (daňová přirážka) a spotřebuje stav.
  - **4 Startovní destičky přesně dle zadání**:
    1. *Erární osikový kolík vz. 1884*: Útok nablízko (1 pole, 2 DMG, Cooldown: 2 tahy). Čistý úder. Pokud má cíl stav `[OKOLKOVÁNO]`, sníží se cooldown této destičky o 1.
    2. *Mosazné razítko „ZAMÍTNUTO“*: Nablízko / kontrola davu (1 pole, 1 DMG, Cooldown: 3 tahy). Odrazí nepřítele o 1 pole dozadu a odloží jeho naplánovaný útok o 1 tah (+1 tah do odpočtu akce).
    3. *Služební revolver Rast & Gasser (Stříbrná munice)*: Střelba v přímé linii (2 DMG, Cooldown: 5 tahů kvůli vyúčtování drahých kovů). Zpětný ráz posune revidenta o 1 políčko dozadu (skvělé na úhyb).
    4. *Kontrola domovského listu*: Pohyb / taktika (0 DMG, Cooldown: 2 tahy). Revident si prohodí místo se sousedním nepřítelem, otočí ho zády k sobě a aplikuje na něj stav `[OKOLKOVÁNO]`.
  - **Krok do nepřítele**: *Třísknutí deskami spisů* — vrazí do nepřítele fasciklem za 1 DMG, odhodí ho o 1 pole a nalepí `[OKOLKOVÁNO]` (Chladnutí 2).
  - **3-Kombo**: *Finanční exekuce* — získá +3 Štít, vyhlásí daňovou kontrolu (nalepí `[OKOLKOVÁNO]` na všechny nepřátele na bojišti a již okolkovaným udělí 3 DMG).
  - **Komiksové bubliny**: Byrokratické a daňové hlášky, výhrůžky zabavením rakve, zamítnutá odvolání a daňové výměry.

- **Rozšíření Síňě lovců na 9 hrdinů**:
  - Responzivní mřížka na hlavní obrazovce s podporou všech 9 lovců a rychlých kláves `1`–`9`.
  - Automatické dynamické zobrazení počtu startovních destiček na kartě lovce (3 nebo 4 dle výbavy).

## [1.4.0] - 2026-11-03

### Přidáno (Added)
- **Nový lovec: Ponocný Bartoloměj (Strážce půlnoční hodiny)**:
  - Nová hratelná postava v Síni lovců i Hradním archivu (ikona 🏮, klávesová zkratka `5`).
  - **Profil vlastností**: Silný a rozvážný noční hlídač (vysoké zdraví 26 HP, 2 Obrana generující 2 Štít). Pomalé chladnutí vyvažuje masivním zásahem a kontrolou bojiště.
  - **Dvoupolíčkový dosah halapartny**: Podpisová destička *Ponocenská halapartna* (CD 4) zasahuje dvě políčka přímo před sebou (1. pole za 5 DMG, 2. pole za 4 DMG a odhození o 1 pole).
  - **Startovní destičky**:
    - *Ponocenská halapartna*: Útok na dvě pole vpřed (5 DMG / 4 DMG + Push 1, Chladnutí 4).
    - *Půlnoční lucerna*: Oslepující žár posvěceného oleje na 1 pole vpřed za 3 DMG + Zmatení na 2 kola (Chladnutí 4).
    - *Ponocenský roh*: Mocné zatroubení na mosazný roh — přidá +5 Štít a odhodí sousední nepřátele před i za sebou o 2 pole za 2 DMG (Chladnutí 4).
  - **Krok do nepřítele**: *Zarazení ratištěm* — vrazí těžké ratiště do nepřítele za 3 DMG, odhodí ho o 1 pole a omráčí na 1 tah (Chladnutí 4).
  - **3-Kombo**: *Půlnoční vartování* — odbije dvanáctá hodina, získá +6 Štít, odtroubí půlnoc a zasáhne obě pole před sebou za 5 DMG.
- **Nový lovec: Silák Gustav (Cirkusový lamač podkov)**:
  - Cirkusový silák a vzpěrač (ikona 🏋️, klávesová zkratka `6`, 22 HP, 1 Obrana).
  - **Startovní destičky**: *Litinová činka* (5 DMG + Push 1, CD 3), *Vrhací závaží* (střela na 3 pole za 3 DMG + Push 1, CD 3) a *Zatnutí svalů* (+5 Štít a Zesílení +2 DMG, CD 3).
  - **Krok do nepřítele**: *Cirkusový přehoz* — popadne nepřítele za opasek, praští s ním o zem za 3 DMG a odhodí o 2 pole vzad (Chladnutí 3).
  - **3-Kombo**: *Litinové finále* — získá +5 Štít a mrští obří činku na prvního nepřítele v linii za 6 DMG + omráčení (Stun 1).
- **Nový lovec: Lady Gwendolyn (Viktoriánská dáma & lovkyně)**:
  - Stará anglická aristokratka a lovkyně upírů (ikona 🫖, klávesová zkratka `7`, 18 HP, 2 Obrana).
  - **Startovní destičky**: *Stříbrný slunečník* (šermířské bodnutí 4 DMG, 7 DMG do zad, CD 3), *Vařící Earl Grey* (vrh vroucího čaje na 2 pole za 3 DMG + Krvácení 2 a Zmatení 1, CD 3) a *Královská etiketa* (+5 Štít, vyléčení 2 HP, CD 3).
  - **Krok do nepřítele**: *Klepnutí slunečníkem* — klepne nevychovaného upíra přes prsty za 2 DMG a otočí ho zády k sobě (Chladnutí 2).
  - **3-Kombo**: *Čaj o páté* — dámský doušek čaje (+4 HP, +4 Štít) a vařící čaj opaří všechny nepřátele v linii za 3 DMG + Krvácení 2.
- **Komiksové bubliny (Comic Speech Bubbles)**:
  - Zaveden dynamický systém komiksových mluvících bublin na bojišti (`src/game/ui/comicBubbles.js` a `src/game/styles/animations.css`).
  - Bubliny mají komiksovou špičku (ocas) směřující přímo k ústům mluvící postavy s ohledem na její orientaci (`facing`).
  - Barevně i typograficky rozlišené varianty:
    - *Bojový pokřik (`battle_cry`)*: Zlato-oranžový explozivní gradient, tučné verzálky, pop-in pružná animace.
    - *Výhrůžka (`threat`)*: Temně rudý hradní gotický styl s krvavým lemem.
    - *Poslední slova (`last_words`)*: Šedavý rozklepaný bublinový styl s tečkami při skonu jednotky (0 HP).
    - *Hláška a vtip (`quip`)*: Čistý pergamenový komiksový styl.
  - **Chytré a tematické dialogy (`src/game/config/dialogues.js`)**:
    - Napsána bohatá sbírka českých parodických hlášek pro Ponocného, Vencu, Honzu, Jaromíra i Káču.
    - Specifické hlášky pro nepřátele: Upír-praktikant Ignác (stážista bez smlouvy), Kryptový písař Hubert (úřední formulář 8b), Drábová Božena (karbanátky na cibulce), Vrátný Lojza (zavřeno z technických důvodů), Halapartník Šebestián, Netopýr Pepík i bossové (Arcikníže Sosák, Hraběnka Dagmar, G. Ř. Drákula).
  - **Bojová interakce a spouštěče**:
    - *Zahájení bitvy*: Lovec vyhlásí svou přísahu a boss či elitní předák arogantně kontruje v komiksovém dialogu.
    - *Zabití jednotky*: Poražený nepřítel pronese svá tragikomická poslední slova.
    - *3-Kombo finišer*: Lovec zvolá svůj triumfální pokřik.
    - *Manévr a útok*: Při manévrech a těžkých výpadech padají břitké komiksové hlášky.
    - Bubliny lze kdykoliv kliknutím/dotykem okamžitě zavřít.

## [1.3.4] - 2026-11-03

### Opraveno (Fixed)
- **Hierarchie velikostí a proporce postav (Unit Scaling)**:
  - Vyřešena dlouhodobá disproporce dětských a drobných nepřátel (Upírka Cilka, Lojzíček, Šmudla) vůči lovci na všech typech zařízení. Děti nyní konzistentně tvoří ~41–42 % výšky hrdiny a ~50–53 % dospělého člověka.
  - Odstraněny konfliktní a přepisující responzivní bloky v `src/game/styles/ui.css`, které dříve přebíjely pravidla z `board.css` a způsobovaly nežádoucí zvětšování spritů na laptopech a mobilech.
  - Zavedena nová responzivní hladina v `src/game/styles/board.css` pro běžné obrazovky s omezenou výškou (`(min-width: 721px) and (max-height: 820px)`) a opraveny invertované hodnoty v media queries pro tablety a mobily.
  - Upraven maximální horizontální rozptyl lovce (`max-width: 215%`) v mřížce bojiště, čímž se zamezilo nechtěnému stlačování a vertikálnímu zmenšování širokého spritu lovce v úzkých buňkách.
  - Zavedena centralizovaná funkce `getEntityBodyScale(entity)` v `src/game/ui/renderer.js`, která spolehlivě detekuje dětské a drobné entity podle `id`, `kind`, `name` i `givenName` a brání jejich nesprávnému zařazení mezi dospělé lidi (`human`).
  - Proporcionálně sjednocen výchozí rozměr spritů v komponentě `UnitSprite.tsx` pro karty a náhledy jednotek.
  - Přidán automatizovaný regresní test `scratch_tests/test_scale_hierarchy.mjs` ověřující správné proporce pro všechny třídy a responzivní rozlišení.

## [1.3.3] - 2026-11-02

### Opraveno (Fixed)
- **Konfigurace a integrace ESLint 9**: Vytvořena plochá konfigurace `eslint.config.js` pro ESLint v9, TypeScript ESLint a React Hooks; odstraněny všechny syntaktické chyby, nepoužité proměnné a prázdné catch bloky v celém projektu (`npm run lint` prochází s 0 chybami a 0 varováními).
- **Kritická oprava startovního Štítu u nepřátel (`spawnEnemyEntity`)**: Odstraněn duplicitní klíč `statuses: {}` ve stavové továrně nepřátel, který při inicializaci přemazával vygenerovaný Štít z Obrany. Nepřátelé s Obranou (vrátný se štítem, úředník, boss Sosák) nyní začínají boj se svým plným Štítem dle pravidel v ADR 0003.
- **Životní cyklus a zranění posvěcené louže (`holy_water_puddle`)**: Opraveno nezapočítávání odpočtu trvání louže svěcené vody. Louže nyní na konci kola zraňuje stojící nemrtvé za 2 posvátné DMG a po 3 tazích korektně vyprchá.
- **Konzistence čísel v deníku a definicích terénu**: Sjednoceny texty hlášení při vstupu do svěcené louže (2 DMG) a při roztříštění kamenné kropenky (4 DMG do okolí), které dříve v deníku uváděly nesprávné hodnoty 1 a 2 DMG v rozporu se skutečným poškozením.
- **Taktický náhled komba pro 3-Komba (`simulateComboImpact`)**: Doplněno volání `resolveHunterCombo3Bonus` do simulačního enginu náhledu komba. Hráč nyní v náhledu přesně vidí poškození ze salv a rázových vln (Honza, Jaromír, Káča) i jejich smrtící dopady před odpálením.
- **Předávání Obrany mezi uzly mapy**: V `enterMapNode` v `main.js` se nyní do stavu bitvy korektně předává atribut `defense: run.defense`.
- **Deterministické RNG v rezonanci řemesla**: Náhodný výběr chladnoucí destičky v rezonanci řemesla nyní využívá seedované `state.rng` namísto `Math.random()`.
- **Terminologie dle GLOSSARY.md a oprava pravidel**:
  - Odstraněny výskyty zakázaných termínů „cooldown“, „CD“ a „nabíjení“ v talismanech, popiscích a hospodě ve prospěch jednotného pojmu *Chladnutí*.
  - Nahrazeno chybné hlášení „Manévr nárazu ještě chladne“ kanonickým pojmem *Krok do nepřítele*.
  - Nahrazena nevhodně natvrdo vepsaná jména „Venca“ v talismanech, rezonancích a schopnostech neutrálním či dynamickým označením lovce.
  - V modálu pravidel aktualizovány zastaralé hodnoty: kolize 2 DMG (namísto 1 DMG), rozbití sudu a propadnutí prknem/kůly 4 DMG (namísto 2 DMG), a doplněno vysvětlení *Kroku do nepřítele* a round-clearing cyklu *Štítu*.
- **Čistý Fast Refresh v komponentách**: Odděleny animační konfigurace do `unitSpriteConfig.ts`, opraveny chybějící závislosti v hooks (`useCallback` u `handleLaunch` v `TitleScreen.tsx` a synchronizace `gridPos` v `UnitSprite.tsx`).
- **Synchronizace `package-lock.json`**: Doplněna chybějící reference `framer-motion` v `package-lock.json`.

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
