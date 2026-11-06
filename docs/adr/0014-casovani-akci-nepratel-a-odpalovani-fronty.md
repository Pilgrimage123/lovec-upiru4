# 14. Časování akcí nepřátel, odpalování fronty a dynamické přesměrování útoků

Zavádíme jasná pravidla pro životní cyklus nepřátelských akcí a odpalování fronty, která se vědomě odchylují od vzoru Shogun Showdown: nepřátelé nepoužívají číselné odpočty, nýbrž sestavují vlastní vícepoložkovou frontu destiček. Samotné nabíjení fronty se nijak neindikuje, telegrafovaný pohyb či otočení dává prostor na reakci stejně jako stav Příprava k odpálení (🚨). Odpálení fronty lovce i vložení standardní destičky spotřebovává 1 tah, zatímco vyjmutí či přerovnání je zdarma. Přežije-li nepřítel útok hráče, jeho připravená fronta se neruší, nýbrž se dynamicky přepočítá z jeho nové pozice a směru (umožňuje Přátelskou palbu i promáchnutí do prázdna), přičemž stav Zmatení (❓) útok nemaže, ale pouze zdrží o jedno kolo a nevyžaduje indikaci nápřahu.

## Status
accepted

## Rozhodnutí a pravidla

1. **Fáze a indikace nepřátel bez číselného odpočtu**:
   - `Pohyb a otáčení jako prostor k reakci`: Telegrafovaný záměr `👣 Krok` nebo `🔄 Otočení` dává hráči přesně 1 tah na reakci stejně jako stav Příprava k odpálení.
   - `Nabíjení fronty bez indikace`: Vkládání destiček do fronty nepřítele (kapacita 1–3 dle archetypu) není nijak vizuálně indikováno žádným stavovým nápisem ani odznakem. Hráč vidí pouze samotné destičky ve slotech; bezprostřední útok v tomto stavu nehrozí. Pokud hráč ustoupí, nepřítel ho pronásleduje krokem a rozpracované destičky si ve frontě ponechává.
   - `Příprava k odpálení (🚨)`: Nastává v momentě, kdy je fronta plná nebo nelze přidat další kartu. Nepřítel zčervená (🚨) a hráč má garantován přesně 1 tah na reakci před odpalem.
2. **Kiting a Odpálení do prázdna**:
   - Je-li nepřítel v `🚨` a hráč ustoupí mimo dosah, nepřítel své kombo odpálí do prázdného prostoru, fronta se vyprázdní a destičky začnou chladnout.
3. **Dynamický přepočet a Přátelská palba**:
   - Odhozený nebo otočený nepřítel v `🚨`, který přežije hráčovo kombo, odpálí útok ze své nové pozice a nového směru pohledu. Zranění i vedlejší efekty zasáhnou libovolného spojence stojícího v nové dráze.
4. **Zdržení Zmatením (❓)**:
   - Zmatení nemaže nepřátelskou frontu; posouvá připravený odpal o 1 tah. U zmateného nepřítele se neindikuje stav `🚨` – zobrazuje se čistě standardní otazník (❓) stavu Zmatení, zatímco fronta čeká na pozadí.
5. **Ekonomika tahů lovce**:
   - Vložení standardní destičky do fronty = 1 tah (rychlovky = 0 tahů).
   - Odpálení fronty = 1 tah (všechny zařazené destičky vyletí v nepřerušené sérii před nepřátelskou fází).
   - Vyjmutí a přerovnání destiček ve frontě = 0 tahů (zdarma).
