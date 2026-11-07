# 15. Chytrý systém komnat a procedurální generování bojiště

Zavádíme dvouúrovňový integrovaný systém procedurálního generování běhu výpravy, který nahrazuje rigidní 6etapovou mřížku a 37 statických šablon místností. Nový systém propojuje makro vrstvu (deterministický acyklický graf Katastrální revírní mapy řízený seedem C. k. výpravního glejtu) s mikro vrstvou (dynamická procedurální syntéza 1D taktického Bojiště). Bojiště je sestavováno z bodového rozpočtu Hrozby podle Taktických archetypů se striktními zárukami férovosti terénu a postupným příchodem posil, doplněné o systém Panských rozkazů komnaty.

## Status
accepted

## Kontext a důvody rozhodnutí

Původní systém trpěl dvěma zásadními omezeními:
1. **Rigidní mapa**: Fixních 6 etap s předepsanými pozicemi (např. elita vždy v etapě IV, hospoda vždy v etapě V) zbavovalo hráče strategického plánování a pocitu skutečného průzkumu neznámého zámeckého panství.
2. **Statické šablony střetů**: Všech 37 předpřipravených soubojů mělo neměnné pozice nepřátel a rekvizit; zrcadlení nebylo zapojeno a generátor terénu se téměř nespouštěl. Hra tak postrádala procedurální znovuhratelnost typickou pro moderní taktické roguelite hry.

Rozhodli jsme se pro **hybridní procedurální syntézu řízenou archetypy**, nikoliv pro divokou náhodnost bez mantinelů, protože čistě náhodné generování v 1D prostoru často vede k neřešitelným situacím nebo nezáživným kombinacím.

---

## Pravidla a specifikace systému

### 1. Katastrální revírní mapa (Makro DAG)
- **Délka a šířka aktu**: Každý Akt má 7 až 8 procedurálních etap se šířkou 2 až 3 komnaty vedle sebe.
- **Tři Katastrální revíry**:
  - *Severní výspa* (vysoké riziko, Elitní drábi, výskyt Panských rozkazů, štědrá kořist +dukátový bonus).
  - *Císařská silnice* (vyvážený průzkum, kolářské dílny, taktické střety).
  - *Jižní hradební úvoz* (zásobovací stezka, nižší hrozba, hospody a podivná setkání).
- **Záruky tempa (Pacing invariants)**:
  1. Žádné dvě totožné obslužné komnaty bezprostředně po sobě (např. Hospoda -> Hospoda).
  2. Každá cesta od vstupu k bossovi garantuje alespoň 3–4 šarvátky.
  3. Minimálně jedna zřetelná volba mezi riskantní větví (Severní výspa / Elita) a bezpečnější zásobovací větví.
  4. **Před-bossovská příprava (Etapa 7)**: Všechny cesty se před finálním bossem (Etapa 8) sbíhají do přípravného rozcestí s volbou mezi Hospodou U Svěcené pípy (léčení, proviant) a Kolářskou dílnou mistra Hanuše (kování, vylepšení destiček).

### 2. Taktické Bojiště (Mikro procedurální syntéza)
- **Taktické role a bodové ohodnocení nepřátel**:
  - *Roj / Hlodavci* (Krysa, Netopýr, Bažinný sliz): **1 bod**
  - *Úderník / Šarvátkář* (Srpák, Kyjovec, Fabian, Upíří trpaslík): **2 body**
  - *Předvoj / Štít* (Sedlák se štítem, Prase mutant, Dráb): **3 body**
  - *Střelec / Podpora* (Kluk s kamenem, Čarodějnice, Morový felčar): **3 body**
  - *Elitní dráb / Inkvizitor*: **5 bodů**
- **Rozpočet Hrozby komnaty (💀)**:
  - Hrozba 1 = 3 body | Hrozba 2 = 5 bodů | Hrozba 3 = 7 bodů | Hrozba 4 (Elita) = 9 bodů | Hrozba 5 = 12 bodů.
- **Strop startovních nepřátel na ose**:
  - Na začátku šarvátky smí na Bojišti stát **nejvýše 2 nepřátelé v Aktu 1** a **nejvýše 3 v Aktu 2–3**.
  - Zbytek bodů rozpočtu je rozdělen do 1–2 vln posil přicházejících z bran (1. vlna v tahu 3–4, 2. vlna v tahu 6–7).
  - Při předčasném vyčištění bojiště (board-clear) se časovač posil automaticky zkracuje na 1 tah (mechanika z `combat.js`).

### 3. Taktické záruky férovosti terénu a pastí (Invarianty)
1. **Zóna bezpečného nápřahu**: Pole lovce a bezprostřední sousedé vlevo i vpravo (`heroCell ± 1`) nesmí nikdy obsahovat propast (`pit`) ani naostřené kůly (`spikes`).
2. **Limit hustoty překážek**: Pasti a překážky smí pokrývat maximálně **25 % celkové délky bojiště**.
3. **Zákaz neprostupných zdí**: Mezi lovcem a nepřáteli nesmí vzniknout nepřekonatelná bariéra z nerozbitných překážek.

### 4. Panský rozkaz komnaty
Anomálie se generují výhradně v rizikových komnatách Severní výspy, u Elitních drábů a při aktivní Kletbě (Curse 1+). Jsou plně předem telegrafovány na revírní mapě.
- 🪵 *Ztrouchnivělá podlaha*: 2–3 pole začínají jako načatá prkna (`plank_cracked`).
- 🧄 *Česnekový průvan z kuchyní*: Každé 3 tahy se u bran na 2 kola utvoří česnekový oblak.
- 📜 *C. k. zákaz ústupu*: Krok vzad spotřebovává o +1 tah chladnutí navíc.
- 🧱 *Úzká hradební římsa*: Bojiště má jen 6 polí a na obou krajích jsou propasti (`pit`).
- ⛪ *Posvěcená kaple*: Uprostřed stojí kropenka (`holy_font`) a nemrtví začínají se Zchlazením (−25 % Bojové rozlícení).
- 🕯️ *Zámecké šero a průvan*: Dostřel střelců je omezen na max 3 pole.

### 5. Datová kompatibilita
Funkce `generateActMap(run, act)` zachovává tvar `{ act, nodes: [...] }`. Při vstupu do komnaty funkce `synthesizeEncounter(node, rng, curseLevel)` vygeneruje kompletní dynamický stav střetu, čímž zajišťuje hladkou integraci do stávajícího UI a herní smyčky.
