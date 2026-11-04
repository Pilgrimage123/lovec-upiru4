# Lovec upírů

Tahová taktická roguelite hra zasazená do parodického rakousko-uherského českého venkova a sídla Hraběte Leopolda von Nochtic na sklonku 19. století.

## Language

**Lovec**:
Hratelná postava se specifickým taktickým zaměřením, výchozím zdravím, podpisovou zbraní a manévry.
_Avoid_: Hrdina, Šampion, Třída, Bojovník

**Síň lovců**:
Úvodní obrazovka výběru lovce a přípravy výpravy do hradu před zahájením běhu.
_Avoid_: Hlavní menu, Lobby, Dashboard, Úvodní stránka

**Destička**:
Fyzická destička s taktickou akcí (útok, obrana, manévr nebo předmět) zařazovaná do fronty tahů.
_Avoid_: Karta, Skill, Schopnost, Kouzlo

**Krok do nepřítele**:
Unikátní fyzický manévr specifický pro daného lovce, který se aktivuje vstoupením do pole obsazeného nepřítelem.
_Avoid_: Bump attack, Náraz, Obyčejný útok, Šťouch

**Komorník**:
Distingovaný britský sluha přivolaný manévrem Lady Gwendolyn, který po dobu 2 kol stojí na bojišti jako neprostupný živý štít, absorbuje veškeré nepřátelské útoky (nesmrtelný) a poté s úklonou mizí v oblaku prachu.
_Avoid_: Minion, Pet, Vyvolávač, Summon

**Zmatení**:
Stav označený otazníkem (❓) nad hlavou, během něhož postava jeden celý tah nic nedělá a jen zmateně stojí na místě. Na konci tohoto tahu otazník vyprchá.
_Avoid_: Omráčení, Stun, Zmatenost, Motolice

**Odstrčení a srážka**:
Silový posun postavy o určenou vzdálenost. Pokud se pohyb zastaví předčasně o zeď, překážku nebo jinou entitu, obdrží obě strany přesně 1 DMG za každé neprojité políčko.
_Avoid_: Knockback, Odhoz, Kolizní bonus, Crash

**3-Kombo**:
Mocný pasivní efekt nebo salva spuštěná při úspěšném zřetězení tří destiček v jedné frontě.
_Avoid_: Ultimate, Finisher, Superútok

**Lovecký arch**:
Reprezentativní vývěska v Síni lovců představující jednoho lovce, jeho erb, podpisovou zbraň, hlášku a startovní destičky.
_Avoid_: Karta postavy, Hero card, Panel

**C. k. výpravní glejt**:
Úřední expediční povolení k výpravě na hrad Hraběte von Nochtic obsahující číslo spisu (seed), hejtmanskou pečeť a rozkaz k zahájení honu.
_Avoid_: Startovací formulář, Launcher, Panel spuštění

**Chladnutí**:
Počet odehraných tahů spotřebovávajících čas, po které musí destička nebo manévr odpočívat na opasku, než je lze znovu zařadit do fronty či provést.
_Avoid_: Cooldown, CD, Nabíjení, Přebíjení, Odpočinek

**Švunk**:
Bojová hybnost získaná při usmrcení nepřítele kombem, která okamžitě zkrátí Chladnutí první destičce tohoto komba a manévru Krok do nepřítele o počet destiček v něm zařazených.
_Avoid_: Momentum, Druhý dech, Reset, Tempo

**Obrana**:
Trvalá vlastnost postavy vyjadřující schopnost aktivního krytí, šermu a úhybů, která na začátku každého kola vygeneruje stejné množství dočasného Štítu.
_Avoid_: Defenziva, Blok

**Štít**:
Dočasná vrstva ochrany vygenerovaná Obranou či destičkami, která pohlcuje příchozí zranění jako první vrstva obrany před zásahem do těla a na konci kola zcela vyprchá.
_Avoid_: Blok, Absorpce, Bariéra

**Brnění**:
Trvalá fyzická vlastnost postavy (silný oděv, pláty, masivní vrstva svalů či tuku), která pasivně snižuje zranění z fyzických úderů prorážejících skrze Štít až na nulu. Periodické stavy (Krvácení) a plyny Brnění ignorují.
_Avoid_: Armor, Damage Reduction, Odolnost

**Ochromený upír**:
Stav upíra, kterému klesly životy na nulu. Upír neleží mrtvý, nýbrž leží nehybně na svém poli po dobu 2 kol (blokuje průchod), načež vstane s polovinou životů. Lze jej definitivně zničit pouze doražením kolíkem nebo dorážecí zbraní.
_Avoid_: Mrtvola, K.O., Omráčený, Incapacitated

**Doražení kolíkem**:
Definitivní poprava ležícího ochromeného upíra provedená krokem lovce do jeho pole (vrazí mu kolík do srdce, aniž by se spustil běžný Krok do nepřítele, a obsadí jeho pole) nebo zásahem posvěcené, dřevěné, česnekové či stříbrné dorážecí zbraně.
_Avoid_: Finisher, Execution, Fatality, Dorážka

**Česnekový oblak**:
Štiplavá mlha o poloměru 1 pole (3 pole celkem), trvající 2 kola. Každý, kdo v oblaku začíná svůj tah, utrpí 1 zranění (upíři dvojnásobek, tedy 2 zranění). Dokáže spálit a definitivně dorazit ochromeného upíra.
_Avoid_: Plyn, Kouřová clona, Jedový oblak

**Umrlec**:
Dobové označení pro oživlého nebožtíka z hrobu vstávajícího v rubáši; těžkopádná nemrtvá bytost slovanské tradice.
_Avoid_: Zombie, Oživlá mrtvola, Ghúl, Revenant

**Hrabě Leopold von Nochtic**:
C. k. tajný rada a veleupír, ústřední padouch výpravy vystupující jako arogantní představitel staré šlechty a feudální despocie.
_Avoid_: Drákula, CEO, Ředitel holdingu, Generální ředitel

**Armádní revolver Gasser**:
Těžký služební revolver c. k. dragounů ráže 11 mm zavedený do výzbroje rakousko-uherského jezdectva v roce 1870.
_Avoid_: Křesadlovka, Bambitka, Křesadlová bambitka

**Sokol Venca Česnek**:
Hrdý vlastenecký cvičenec jednoty Sokol, atlet a nadšený pěstitel moravského paličáku. Bojuje sokolským tělocvikem, nářadím a česnekovými třaskavinami.
_Avoid_: Štamgast Venca, Opilec, Hospodský rváč

**Sokolský náraz**:
Vencův Krok do nepřítele: vypne hruď, vrazí do nepřítele (1 DMG), odhodí ho o 1 pole a na cílovém poli zanechá Česnekový oblak na 2 kola.
_Avoid_: Česnekové žduchnutí, Pupík, Bump

**Sokolská prostná**:
Vencovo zakončovací 3-kombo: předvede bezchybnou sokolskou sestavu s tyčí zcela bez česneku, získá +4 Štít a všem nepřátelům na vzdálenost 1–2 pole před sebou i za sebou udělí 3 DMG a Zmatení (❓).
_Avoid_: Česneková aura, Pivní dech, Slet

**Bojové rozlícení**:
Bojová vlastnost postavy vyjadřující její temperament a kumulující se procentuální modifikátor zranění, který narůstá na začátku každého kola dané postavy. Může být dynamicky zvyšován nebo snižován konkrétními destičkami a manévry a může klesnout i do záporných hodnot (reprezentuje nasycení, letargii, omámenost či stoický klid, kdy útočné poškození klesá pod základ). Posiluje (nebo v záporu tlumí) přímé útoky destičkami, manévry (Krok do nepřítele) a kinetické poškození ze srážky při Odstrčení.
_Avoid_: Rage, Fury, Zuřivost, Berserk, Enrage

**Polní furiant**:
Bojový archetyp či postava s extrémně vysokým Bojovým rozlícením (např. 25–35 % za kolo), která se v boji chová cholericky, vzdorovitě a rychle nekontrolovatelně nabírá na drtivé síle.
_Avoid_: Berserker, Barbarian, Šílenec, Zuřivec

**Zákeřný úder**:
Bojový úder vedený zezadu do zad protivníka nebo proti cíli pod vlivem Zmatení (❓), který uděluje o 50 % vyšší poškození (Kapsářka Káča má díky své profesi mistrovský bonus +100 %). Platí oboustranně pro lovce i nepřátele.
_Avoid_: Backstab, Sneak Attack, Útok ze zálohy, Bodnutí do zad

**Zchlazení**:
Stav vyvolaný poklesem Bojového rozlícení pod 0 % (až do limitu −50 %), označovaný modrou ikonou (🧊). Reprezentuje nasycení, rozvahu, letargii či ztlumení běsnění, při němž je udělené zranění sníženo (vždy však garantuje minimálně 1 DMG u útoků s nenulovým základem).
_Avoid_: Chill, Debuff, Zmrazení, Otupělost

**Zubatá**:
Kritický stav lovce, jemuž kleslo Zdraví na nulu či do záporných hodnot (`HP <= 0`), signalizovaný temným symbolem lebky s kosou (💀) a Odpočtem Zubaté nad hlavou. Při vstupu do tohoto stavu nebo při dalším obdrženém zásahu lovec v šoku okamžitě vyprázdní svou frontu akcí a vrátí destičky do ruky. Pokud lovec v tomto stavu zahájí i ukončí svůj tah bez vyléčení, klesne jeho Verva o 1. Vítězství v místnosti či vyléčení nad nulu (`HP >= 1`) Zubatou zažene.
_Avoid_: Death's Door, Grim Reaper, Kmotra Smrt, Na prahu smrti, Agónie

**Verva**:
Trvalá expediční vlastnost lovce udávající maximální hloubku záporných životů, kterou lovec unese, než definitivně zhasne a zemře. Zbývající rezerva vyjadřuje Odpočet Zubaté (`Verva + HP`). Je asymetricky rozdělena v rozsahu 4 až 7 bodů podle tělesné konstituce a archetypu lovce (referenční středobodem je Sokol Venca s 5 body). Při dlouhém prodlévání v záporných životech Verva trvale degraduje, lze ji však vyspravit poctivým odpočinkem a občerstvením v Hospodě U Svěcené pípy.
_Avoid_: Persistence, Willpower, Houževnatost, Vytrvalost, Odolnost, Životní síla

**Benchmark Sokola Venci**:
Kanonický etalon herní dynamiky, tempa a rovnováhy lovce (20 HP, 1 Obrana, 10 % Bojové rozlícení, 5 Verva, rotace Chladnutí 2–2–3). Všechny útočné, obranné i manévrovací schopnosti ostatních lovců jsou kalibrovány a poměřovány vůči této vyvážené šabloně.
_Avoid_: Power level, Baseline, Referenční hrdina, Standardní postava








