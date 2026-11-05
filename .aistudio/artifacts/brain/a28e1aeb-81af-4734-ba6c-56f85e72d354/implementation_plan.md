# C. a k. Satirická redakce rozhraní: Rakousko-Uhersko stižené upíry (1899)

Citlivé a chytré přepracování herního UI a UX, které sjednocuje celou hru do nezaměnitelné atmosféry rakousko-uherské karikatury z přelomu 19. a 20. století — kombinace satirického tisku (*Humoristické listy*, *Šípy*), úředního šimla, kolkových známek, mosazného kování a zažloutlého c. k. pergamenu při plném zachování osvědčeného taktického rozvržení bojiště.

## User Review & Critical Decisions

> [!IMPORTANT]
> Níže jsou potvrzená rozhodnutí z úvodního dotazníku, která určují směr celé úpravy:

- **Potvrzený vizuální tón**: **Satirický c. k. tisk, pergamen, mosaz a razítka** — rozhraní využije estetiku císařsko-královských vyhlášek, dobových novinových rámů, červeno-černých úředních razítek, kolkových známek a mosazných plaket.
- **Potvrzený rozsah priorit**:
  1. **Sjednocení titulní Síně lovců a bitevní obrazovky** do jednoho soudržného vizuálního jazyka.
  2. **Přehlednější horní lišta, akční panel a čitelnější karty destiček** s dobovým rámováním a čistou hierarchií.
  3. **Mapa výpravy a události jako c. k. katastrální plány a vyhlášky** (c. k. okresní hejtmanství, úřední protokoly, hostinský výčepní lístek a cechovní dílna).
  4. **Výraznější komiksové bubliny, razítka stavů a bojový protokol** ve stylu novinové karikatury a četnické svodky.
- **Potvrzený přístup k rozvržení v boji**: **Zachovat stávající rozvržení a soustředit se na dobovou grafiku, čitelnost a textaci** — neměníme prostorové proporce 1D bojiště ani umístění klíčových ovládacích prvků, aby utrpěla svalová paměť či přehlednost na noteboocích a mobilech.

---

## 1. Overview & Core Concept

- **Co úprava přináší**: Hráč se od první vteřiny ocitá uprostřed groteskní c. k. monarchie roku 1899, kde proti upíří šlechtě Hraběte Leopolda von Nochtic stojí sokolové, ponocní, vysloužilí dragouni i daňoví revidenti vyzbrojení osikovými kolíky vzor 1884 a razítkem „ZAMÍTNUTO“.
- **Hlavní přínos pro UX**: Dosavadní rozhraní mělo výrazný stylový předěl mezi velmi tmavou titulní obrazovkou a světlým pergamenovým bojištěm. Sjednocením materiálů (ušlechtilý tiskový pergamen, litinově černé linky, císařská mosaz a pečetní červeň) a zpřehledněním karet destiček i horního panelu získá hra okamžitou čitelnost i silnější komediální atmosféru.

---

## 2. User Experience & Visual Design

### Klíčové uživatelské průchody (User Flows)

1. **Titulní Síň lovců (C. k. Evidenční list lovců a dobrovolníků)**:
   - Záhlaví ve stylu titulní hlavičky satirického oběžníku *„C. a k. Mimořádný věstník pro potírání vampýrismu v zemích Koruny české“*.
   - Pás 9 lovců stylizovaný jako dobové kabinetní portréty s mosazným číslováním `[1–9]` a čistými, nezahlcujícími statistikami.
   - Levá vitrína hrdiny připomíná **Osobní kmenový list a cechovní dekret** s pečetí pivovaru, citátem z dobové karikatury a přehlednými atributy.
   - Pravý panel funguje jako **Taktický spis a arzenál** s interaktivním detailem schopností a **Expediční podatelnou**, kde zadání seedu působí jako číslo jednací (`Č. j. CESNEK-1899`) a tlačítko startu jako potvrzený rozkaz k výpravě.

2. **Horní c. k. velitelská lišta (HUD) a Fronta komba**:
   - Horní lišta sjednocená jako **C. k. polní hlášení**: vlevo lokace a akt v podobě katastrální hlavičky + přehledné vitální ukazatele (Zdraví, Verva/Zubatá, Obrana/Štít, Brnění, Rozlícení, Zlaté dukáty a Upíří tesáky s číselným zarovnáním `tabular-nums`), uprostřed sbírka talismanů jako připnuté medaile a kolky, vpravo čistá sada úředních tlačítek.
   - **Fronta komba (Bojový rozvrh)** nad bojištěm má podobu kolkované telegrafní pásky / taktického rozkazu se zřetelným číslováním slotů `#1 – #3`, zvýrazněnou rezonancí a okamžitou vizuální odezvou při připraveném 3-kombu.

3. **Akční lišta a Karty destiček (C. k. Polní příručka a kolkované karty)**:
   - Ovládací tlačítka (`Krok vlevo [A]`, `Otočit [W]`, `Čekat [S]`, `Krok vpravo [D]`, `Náhled` a `ODPÁLIT KOMBO [Space]`) zachovávají své přesné místo, ale dostávají charakter **mosazných a tiskových štítků** s výrazným stavem manévru kroku do nepřítele.
   - **Karty destiček v ruce** jsou přepracovány jako **dobové ilustrované kolkované lístky**:
     - Horní roh: klávesa `[1–4]` v tiskařském rámečku a zřetelná doba chladnutí.
     - Střed: čistý ilustrovaný medailon s výrazným razítkem stavu při chladnutí (`⏳ CHLADNE`) nebo zařazení (`✓ VE FRONTĚ #1`).
     - Spodní část: čitelný název v patkovém písmu `Fraunces`, oddělený řádek s okamžitým přepočtem poškození (včetně bonusu z Rozlícení) a dosahu bez vizuálního šumu.

4. **Mapa výpravy, Hospoda, Dílna a Události**:
   - **Mapa výpravy**: Stylizována jako **C. k. katastrální a vojenská mapa revíru** s dvojitou tiskařskou obrubou, označením pater jako *„Etapa I–VI“*, červeným razítkem `✓ VYŘÍZENO` u splněných uzlů a pečetí dostupných míst.
   - **Hospoda „U Svěcené pípy“**: Vypadá jako **dobový hostinský jídelní a výčepní lístek** (1. Erární guláš a ležák na kuráž, 2. Promazání výzbroje sádlem, 3. Podpultový šmelc od štamgastů).
   - **Kolářská a kovářská dílna**: Stylizována jako **cechovní zakázkový list** s přehledným porovnáním stavu *„Před úpravou“* a *„Mistrovské kování“*.
   - **Příběhové události, Bojový protokol a Archiv**: Události jako **C. k. četnické hlášení a místní vyhláška**, Bojový deník jako **Četnický protokol šarvátky** a Hradní archiv jako **C. k. Kabinet kuriozit a zbrojnice**.

5. **Komiksové bubliny a razítka na bojišti**:
   - Komiksové bubliny nad postavami dostávají autentickou kreslenou linku z humoristických listů (dvojitý inkoustový obrys, špičatý zobáček mířící k mluvčímu, rozlišení tónu pro bojový pokřik sokola vs. aristokratickou hrozbu upíra).
   - Stavy jako `[OKOLKOVÁNO]`, `🚨 1 AKCE`, `❓ ZMATENÍ` či `💀 ZUBATÁ` působí jako ostrá tiskařská razítka.

### Vizuální identita a paleta

- **Dominantní povrchy (60 %)**:
  - `--bg-parchment` (`#f5ebd6`) a `--bg-parchment-card` (`#fff9ec`) — teplý rakousko-uherský novinový a listovní pergamen s jemnou kresbou a inkoustovým stínem.
  - Noční pozadí scény (`#0d1522` s teplým jantarovým odleskem pouličních luceren).
- **Strukturální prvky a typografické rámování (30 %)**:
  - `--ink-dark` (`#1b130d`) — hluboká tiskařská čerň pro dvojité linky, novinové obruby a patkové nadpisy.
  - `--wood-deep` (`#422814`) a `--brass-border` (`#b88938`) — patinovaná mosaz a tmavé dřevo hostince.
- **Akcentní barvy a pečetě (10 %)**:
  - `--brick-red` (`#9e2424`) — c. k. pečetní a razítková červeň pro primární akce (`ODPÁLIT KOMBO`), hrozby a pečetě.
  - `--garlic-yellow` (`#e8be3e`) — císařská žluť a mosaz pro aktivní výběr, rezonance a nasvícené sloty.
- **Typografie**:
  - **Display / Titulky**: `Fraunces` (výrazná charakterová antikva evokující rakousko-uherský tisk a vyhlášky roku 1899).
  - **Body / Popisy**: `Nunito` (čisté, výborně čitelné písmo pro mechanické popisy a deník).
  - **Čísla a zkratky**: `tabular-nums` pro všechny počty HP, dukátů, tesáků, chladnutí a procenta Rozlícení.

---

## 3. Key Product Decisions & Trade-Offs

- **Rozhodnutí 1: Sjednocení Síně lovců s herním pergamenem a mosazí**
  - *Zvolený přístup*: Nahradit generické černé boxy na titulní obrazovce kombinací tmavého nočního rámu, mosazně kovaných karet s pergamenovými štítky, c. k. novinového záhlaví a evidenčního listu lovce.
  - *Proč*: Odstraní se vizuální propast mezi výběrem postavy a samotnou hrou; hráč si už při výběru lovce čte skutečný dobový kmenový list.
- **Rozhodnutí 2: Zachování přesné geometrie 1D bojiště a akčního panelu**
  - *Zvolený přístup*: Ponechat stávající rozvržení `#hud-root`, `#center-stage`, `#bottom-root` a `#log-root` i výšky kamenných polí a postav, a veškeré úpravy provést formou dobové grafiky, tiskařských linek, přehlednějších karet a satirické textace.
  - *Proč*: Stávající rozvržení je pečlivě odladěné pro nulové poskakování prvků při hoveru i pro obrazovky notebooků a mobilů.

---

## 4. Technical Architecture & Data Strategy

### Architektura zobrazení a tok stavu

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        Kořen aplikace (React + Herní jádro)               │
│  ┌───────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │   Titulní obrazovka (Síň lovců)   │  │     Bitevní a mapový rám     │  │
│  │  • C. k. Věstník (Záhlaví)        │  │  • C. k. Polní HUD lišta     │  │
│  │  • 9 kabinetních karet [1–9]      │  │  • Bojový rozvrh (Fronta)    │  │
│  │  • Osobní kmenový list hrdiny     │  │  • 1D Bojiště + Bubliny      │  │
│  │  • Taktický spis & Podatelna      │  │  • Kolkované destičky & Akce │  │
│  └─────────────────┬─────────────────┘  └──────────────┬───────────────┘  │
│                    │                                   │                  │
│                    ▼                                   ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │            C. k. Úřední modály, Katastrální mapa a Protokol         │  │
│  │  • Katastrální mapa revíru (Etapy I–VI, razítka VYŘÍZENO)           │  │
│  │  • Výčepní lístek „U Svěcené pípy“ & Cechovní list kolářské dílny   │  │
│  │  • Četnická hlášení (Události, Odměny, Bojový protokol, Archiv)     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mapování interaktivních prvků a zachování funkčnosti

- **Titulní Síň lovců**:
  - Zachovává klávesové zkratky `1–9` pro výběr lovce, `R` pro náhodné číslo jednací (seed), `F` pro celou obrazovku a `Enter` / `Space` pro okamžité zahájení výpravy.
  - Každý atribut (`HP`, `Obrana`, `Rozlícení`, `Brnění`, `Zákeřný úder`, `Verva`), schopnost (`Pasivní signatura`, `Krok do nepřítele`, `3-Kombo Finišer`) i startovní destička mají plně funkční hover tooltip i rozklikávací c. k. detailní kartu s kovářskými vylepšeními.
- **Bitevní HUD, Fronta komba a Karty destiček**:
  - Zachovává všechny ovládací handlery (`onStep`, `onTurn`, `onWait`, `onExecuteQueue`, `onToggleComboPreview`, drag-and-drop i šipkové řazení ve frontě komba).
  - Karty destiček jasně odlišují připravený stav, zařazení do fronty (`#1–#3`) a chladnutí pomocí nepřehlédnutelných dobových razítek.
- **Mapa, Modály a Komiksové bubliny**:
  - Všechny modály (Pravidla cechu, Celý protokol, Nastavení, Odměny po bitvě, Hospoda, Dílna, Události, Pokladnice, Konec výpravy, Hradní archiv) dostávají jednotnou c. k. hlavičku s dvojitou tiskařskou linkou, dobovou sazbou a okamžitou odezvou tlačítek.

---

## 5. Audit schopností lovců (Soulad popisů s herním enginem)

Byl proveden detailní křížový audit všech 9 lovců (`classic/venca`, `sedlak`, `dragoun`, `zlodejka`, `ponocny`, `silak`, `anglicanka`, `helsing`, `revident`) mezi texty v rozhraní (`src/game/config/loadouts.js`, `src/components/TitleScreen.tsx`, `src/game/config/tiles.js`) a reálným enginem (`src/game/engine/combat.js`, `src/game/engine/state.js`, `src/game/engine/combo.js`):

1. **Rittmeister Jaromír Vraný (Dragoun) – Kavalírský nápřah & Důstojnická šavle**:
   - *Nález*: Pasivka vyžadovala pohyb v tahu (`hero.movedThisTurn`), ale krok ukončoval tah a resetoval příznak dříve, než hráč mohl zahrát útočnou kartu; šavle navíc neměla implementován deklarovaný výpad.
   - *Oprava v enginu*: Krok vpřed (`stepHero`) nově ukládá stav `kavalirsky_naprah` trvající do příštího úderu. Šavle (`dragoon_sabre`) dostala parametr `lungeForward: 1`, který provede reálný posun o 1 pole vpřed a aktivuje pasivku. Popisy sjednoceny.
2. **Lady Gwendolyn Sterling – Čaj o páté**:
   - *Nález*: 3-kombo v enginu udělovalo 3 DMG a navíc aplikovalo Krvácení (2) (`addStatus(e, 'bleed', 2)`), v popisu `loadouts.js` však krvácení chybělo.
   - *Oprava*: Popis doplněn na: *„3-kombo: +4 HP, +4 Štít a vařící čaj opaří všechny v linii pohledu za 3 DMG + Krvácení (2)“*.
3. **Sir Arthur Featherstone – Kruhový rotační rozptyl**:
   - *Nález*: V enginu rotační salva zasahuje všechny nepřátele na celém bojišti (360°), zatímco text uváděl „v linii dohledu“.
   - *Oprava*: Popis upřesněn na: *„3-kombo: Kruhová salva (360°) udělí 4 DMG + Krvácení (2) VŠEM nepřátelům na bojišti“*.
4. **Revident Ignác Šiml – C. k. daňová kontrola & Úřední předvolání**:
   - *Nález*: V popisu v `loadouts.js` chyběla zmínka o stěžejní mechanice přitažení nepřítele na 2 pole při otočení (W).
   - *Oprava*: Popis rozšířen o obě fáze: *„Při otočení (W) čelem k nepříteli na 2 pole jej přitáhne a okolkuje (CD 2). Útok do cíle se stavem [OKOLKOVÁNO] udělí +1 DMG a přidá +1 Štít“*.
5. **Ostatní lovci (Venca, Honza, Káča, Bartoloměj, Gustav)**:
   - Zkontrolováni a ověřeni: Sokolský oblak, Selský beran a škálování Rozlícením, Zákeřný úder +100 % a záměna Káči, Zákaz nočního vycházení ponocného, Cirkusová dominance a kolizní bonusy siláka přesně odpovídají herním vzorcům.
