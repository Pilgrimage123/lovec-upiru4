import React, { useState, useEffect, useCallback } from "react";
import { getHeroTileDefinition, TILE_TAGS } from "@/game/config/tiles.js";
import { SFX, setSoundEnabled } from "@/game/ui/audio.js";
import { showTooltip, hideTooltip } from "@/game/ui/tooltips.js";
import { toggleFullscreen, isFullscreenActive } from "@/game/ui/fullscreen.js";
import {
  Heart,
  Shield,
  Swords,
  Dice5,
  BookOpen,
  Castle,
  Volume2,
  VolumeX,
  Clapperboard,
  Sparkles,
  ScrollText,
  Zap,
  Info,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

export interface TitleScreenProps {
  onStartHunt: (hunterId: string, seed: string) => void;
  onOpenRules: () => void;
  onOpenArchive: () => void;
  initialHunterId?: string;
  initialSeed?: string;
}

/**
 * Centrální konfigurace portrétů lovců s novými vyčištěnými PNG bez artefaktů.
 */
const HUNTER_PORTRAITS: Record<string, string> = {
  classic: "/assets/aistudio/Venca__esnek_06bdb1af.png",
  honza: "/assets/aistudio/Vesel__Honza_s_rane_kem_na_cest__2d2284c3.png",
  dragoun: "/assets/aistudio/dragoun_3c7cb780.png",
  zlodejka: "/assets/aistudio/Zlatovlas__zlod_jka_s_d_kou_96361a6e.png",
  ponocny: "/assets/aistudio/ponocn__6449a1bd.png",
  silak: "/assets/aistudio/Vintage_sil_k_s_kotvou_a_medail__86a24e4c.png",
  anglicanka: "/assets/aistudio/Barevn__viktori_nsk__lovkyn__s_de_tn_kem_e96488c5.png",
  helsing: "/assets/aistudio/Karikatura_Van_Helsinga_s_rota_n__ku___4ad7e475.png",
  revident: "/assets/aistudio/Ornate_c_sa_sk__boty_star_ho___edn_ka_8f8df6f3.png",
};

interface HunterDeed {
  id: string;
  shortName: string;
  name: string;
  epithet: string;
  role: string;
  tag: string;
  beerBadge: string;
  maxHp: number;
  defense: number;
  fury: number;
  armor?: number;
  persistence?: number;
  backstabBonus?: number;
  icon: string;
  heraldicColor: string;
  heraldicBorder: string;
  portraitUrl: string;
  quote: string;
  signatureWeapon: string;
  passiveName?: string;
  passiveDesc?: string;
  bumpName: string;
  bumpDesc: string;
  comboName: string;
  comboDesc: string;
  deck: Array<{ id: string; upgradeLevel?: number }>;
}

const HUNTERS_DATA: Record<string, HunterDeed> = {
  classic: {
    id: "classic",
    shortName: "Sokol Venca",
    name: "Sokol Venca Česnek",
    epithet: "Sokolský cvičenec a pěstitel česneku",
    role: "Vlastenecký sokol & pěstitel česneku",
    tag: "Sokolský tělocvik · Česneková třaskavina & Přitažení",
    beerBadge: "Sokolský paličák",
    maxHp: 20,
    defense: 1,
    fury: 10,
    persistence: 5,
    passiveName: "Sokolský tělocvik",
    passiveDesc: "Skoky přes překážky a Česnekový oblak (otáčení zdarma, 2 DMG upírům a jejich dorážení).",
    icon: "🦅",
    heraldicColor: "from-emerald-950 via-stone-900 to-amber-950",
    heraldicBorder: "border-emerald-500",
    portraitUrl: HUNTER_PORTRAITS.classic,
    quote: "„Tužme se, bratři! V zdravém těle zdravý duch a poctivý moravský česnek!“",
    signatureWeapon: "Sokolská cvičební tyč & Moravský paličák",
    bumpName: "Sokolský náraz",
    bumpDesc:
      "Krok do nepřítele: 1 DMG, odhodí cíl o 1 pole a zanechá Česnekový oblak (CD 3).",
    comboName: "Sokolská prostná",
    comboDesc:
      "3-kombo: +4 Štít a všem nepřátelům v dosahu 1–2 pole udělí 3 DMG a Zmatení (❓).",
    deck: [
      { id: "falcon_claw", upgradeLevel: 0 },
      { id: "garlic_grenade", upgradeLevel: 0 },
      { id: "skok_pres_kozu", upgradeLevel: 0 },
    ],
  },
  honza: {
    id: "honza",
    shortName: "Chasník Honza",
    name: "Chasník Honza Buchta",
    epithet: "Selský silák & polní furiant",
    role: "Polní furiant & selská síla",
    tag: "Polní furiant (+25 % Rozlícení) · 1 Brnění · Drtivé rány",
    beerBadge: "Selský ležák",
    maxHp: 20,
    defense: 0,
    fury: 25,
    armor: 1,
    persistence: 7,
    passiveName: "Selský furiant",
    passiveDesc: "Při zásahu do těla (HP) získá +10 % Rozlícení. Při vstupu do Zubaté (HP ≤ 0) získá okamžitě +25 % Rozlícení.",
    icon: "🥖",
    heraldicColor: "from-amber-950 via-stone-900 to-yellow-950",
    heraldicBorder: "border-amber-500",
    portraitUrl: HUNTER_PORTRAITS.honza,
    quote: "„Babička napekla povidlové buchty a děda okoval cep. Jde se na pány z krypty!“",
    signatureWeapon: "Okovaný husitský cep & Pekáč povidlových buchet",
    bumpName: "Selský beran",
    bumpDesc:
      "Krok do nepřítele: Odhodí cíl, obsadí jeho pole a udělí 2 DMG (CD 3).",
    comboName: "Selský hněv",
    comboDesc:
      "3-kombo: +6 Štít a rázová vlna zasáhne okolní nepřátele za 4 DMG.",
    deck: [
      { id: "flail_sweep", upgradeLevel: 0 },
      { id: "plum_bun", upgradeLevel: 0 },
      { id: "heavy_windup", upgradeLevel: 0 },
    ],
  },
  dragoun: {
    id: "dragoun",
    shortName: "Rittmeister Jaromír",
    name: "Rittmeister Jaromír Vraný",
    epithet: "Vysloužilý c. k. dragoun",
    role: "Císařský kavalerista",
    tag: "Kavalírský nápřah (20 HP, 2 Obrana) · Kartáčová salva · Průraz brnění",
    beerBadge: "C. k. speciál",
    maxHp: 20,
    defense: 2,
    fury: 10,
    persistence: 4,
    passiveName: "Kavalírský nápřah",
    passiveDesc: "Po posunu vpřed (krokem či výpadem šavle) získá příští útok destičkou +2 DMG a ignoruje 1 Brnění.",
    icon: "⚔️",
    heraldicColor: "from-blue-950 via-stone-900 to-slate-950",
    heraldicBorder: "border-blue-400",
    portraitUrl: HUNTER_PORTRAITS.dragoun,
    quote: "„Dle c. k. polního řádu § 14 se na noční havěť tasí šavle bez úředního vyzvání!“",
    signatureWeapon: "Důstojnická šavle vzor 1877 & Armádní revolver Gasser",
    bumpName: "Úder těžkým jílcem",
    bumpDesc:
      "Krok do nepřítele: 2 DMG, odhodí cíl a uvrhne ho do Zmatení (❓) (CD 3).",
    comboName: "Kavaleristická salva",
    comboDesc:
      "3-kombo: Kartáčová salva (4 DMG všem v linii pohledu) a CD −1 všem destičkám.",
    deck: [
      { id: "dragoon_sabre", upgradeLevel: 0 },
      { id: "dragoon_pistol", upgradeLevel: 0 },
      { id: "cavalry_parry", upgradeLevel: 0 },
    ],
  },
  zlodejka: {
    id: "zlodejka",
    shortName: "Kapsářka Káča",
    name: "Kapsářka Káča Pavučina",
    epithet: "Úskočná zlodějka",
    role: "Pražská stínová akrobatka",
    tag: "Vysoké riziko (14 HP) · Zničujících 8 DMG do zad",
    beerBadge: "Noční ležák",
    maxHp: 14,
    defense: 2,
    fury: 10,
    persistence: 6,
    backstabBonus: 100,
    passiveName: "Zákeřný úder",
    passiveDesc: "Bonus +100 % k poškození při úderu do zad nebo proti zmatenému cíli (❓).",
    icon: "🗡️",
    heraldicColor: "from-purple-950 via-stone-900 to-rose-950",
    heraldicBorder: "border-purple-400",
    portraitUrl: HUNTER_PORTRAITS.zlodejka,
    quote: "„Co upír v noci neuhlídá, to pražská chasa do rána zpeněží a propije.“",
    signatureWeapon: "Italské stiletto & Křemenné střepy z Malé Strany",
    bumpName: "Kapsářská záměna",
    bumpDesc:
      "Krok do nepřítele: Prohodí si s ním pozici a otočí ho zády k sobě (CD 2).",
    comboName: "Pavučinový únik",
    comboDesc:
      "3-kombo: +4 Štít a okamžitě obnoví připravenost Kapsářské záměny.",
    deck: [
      { id: "stiletto_stab", upgradeLevel: 0 },
      { id: "glass_shards", upgradeLevel: 0 },
      { id: "shadow_slip", upgradeLevel: 0 },
    ],
  },
  ponocny: {
    id: "ponocny",
    shortName: "Ponocný Bartoloměj",
    name: "Ponocný Bartoloměj Klika",
    epithet: "Strážce půlnoční hodiny",
    role: "Noční hlídka & těžká halapartna",
    tag: "Zákaz nočního vycházení (26 HP, 2 Obrana) · Dosah 2 pole",
    beerBadge: "Půlnoční ležák 13°",
    maxHp: 26,
    defense: 2,
    fury: 5,
    persistence: 6,
    passiveName: "Zákaz nočního vycházení",
    passiveDesc: "Na začátku kola získá +1 Štít za každého nepřítele v dosahu 1–2 pole před sebou.",
    icon: "🏮",
    heraldicColor: "from-indigo-950 via-stone-900 to-slate-950",
    heraldicBorder: "border-indigo-400",
    portraitUrl: HUNTER_PORTRAITS.ponocny,
    quote: "„Chval každý duch Hospodina! A vy upíři táhněte spát, nebo vás vezmu halapartnou přes hnáty!“",
    signatureWeapon: "Kovaná dvoubřitá halapartna & Půlnoční mosazný roh",
    bumpName: "Zarazení ratištěm",
    bumpDesc:
      "Krok do nepřítele: 3 DMG, odhodí cíl o 1 pole a uvrhne do Zmatení (❓) (CD 3).",
    comboName: "Půlnoční vartování",
    comboDesc:
      "3-kombo: +6 Štít a zasáhne obě pole před sebou za 5 DMG.",
    deck: [
      { id: "halberd_sweep", upgradeLevel: 0 },
      { id: "watchman_lantern", upgradeLevel: 0 },
      { id: "watchman_horn", upgradeLevel: 0 },
    ],
  },
  silak: {
    id: "silak",
    shortName: "Silák Gustav",
    name: "Silák Gustav Železný",
    epithet: "Cirkusový lamač podkov",
    role: "Cirkusová dominance & litinová břemena",
    tag: "Cirkusová dominance (22 HP, 1 Brnění) · Vrhání závaží · Přehoz",
    beerBadge: "Cirkusový ležák",
    maxHp: 22,
    defense: 1,
    fury: 10,
    armor: 1,
    persistence: 5,
    passiveName: "Cirkusová dominance",
    passiveDesc: "Každá srážka nepřítele z odhození udělí +1 kolizní DMG navíc a Gustav získá +2 Štít.",
    icon: "🏋️",
    heraldicColor: "from-red-950 via-stone-900 to-amber-950",
    heraldicBorder: "border-red-500",
    portraitUrl: HUNTER_PORTRAITS.silak,
    quote: "„Podkovu zlomím dvěma prsty, panáčku. Zlomení upíří páteře je jen lehká rozcvička!“",
    signatureWeapon: "Dvousférická litinová činka & Kované závaží",
    bumpName: "Cirkusový přehoz",
    bumpDesc:
      "Krok do nepřítele: 3 DMG a odhodí cíl o 2 pole vzad (CD 3).",
    comboName: "Litinové finále",
    comboDesc:
      "3-kombo: +5 Štít a vrhne činku na prvního v linii za 6 DMG + Zmatení (❓).",
    deck: [
      { id: "barbell_slam", upgradeLevel: 0 },
      { id: "kettlebell_toss", upgradeLevel: 0 },
      { id: "iron_flex", upgradeLevel: 0 },
    ],
  },
  anglicanka: {
    id: "anglicanka",
    shortName: "Lady Gwendolyn",
    name: "Lady Gwendolyn Sterling",
    epithet: "Viktoriánská dáma & lovkyně",
    role: "Britská etiketa & stříbrný slunečník",
    tag: "Noblesní sebeovládání (18 HP, 2 Obrana) · Komorník Archibald · Earl Grey",
    beerBadge: "Imperial Stout 18°",
    maxHp: 18,
    defense: 2,
    fury: 5,
    persistence: 4,
    passiveName: "Noblesní sebeovládání",
    passiveDesc: "Královská etiketa přetaví kladné Rozlícení na Štít (každých 5 % Rozlícení = +1 Štít).",
    icon: "🫖",
    heraldicColor: "from-slate-950 via-stone-900 to-emerald-950",
    heraldicBorder: "border-slate-400",
    portraitUrl: HUNTER_PORTRAITS.anglicanka,
    quote: "„Upíři jsou nanejvýš nevychovaná stvoření. Čaj o páté ignorují docela!“",
    signatureWeapon: "Stříbrem kovaný slunečník & Porcelánová konvice",
    bumpName: "Čas na čaj, milady!",
    bumpDesc:
      "Krok do nepřítele (je-li za ním volno): Povolaný komorník (štít na 2 kola) odkopne cíl o 3 pole vzad se Zmatením (❓) (CD 3).",
    comboName: "Čaj o páté",
    comboDesc:
      "3-kombo: +4 HP, +4 Štít a vařící čaj opaří všechny v linii pohledu za 3 DMG + Krvácení (2).",
    deck: [
      { id: "silver_parasol", upgradeLevel: 0 },
      { id: "boiling_tea", upgradeLevel: 0 },
      { id: "royal_etiquette", upgradeLevel: 0 },
    ],
  },
  helsing: {
    id: "helsing",
    shortName: "Sir Arthur",
    name: "Sir Arthur Featherstone",
    epithet: "Britský lovec trofejí",
    role: "Britská lovecká expedice & rotační kuše",
    tag: "Lovec trofejí (18 HP, 1 Obrana) · Rotační kuše · Kritický zásah krvácejících",
    beerBadge: "Oktogonální ležák 14°",
    maxHp: 18,
    defense: 1,
    fury: 10,
    persistence: 5,
    passiveName: "Lovec trofejí",
    passiveDesc: "Zásah na dálku (2+ pole) do krvácejícího cíle udělí +2 DMG a zkrátí CD destičky o 1.",
    icon: "🏹",
    heraldicColor: "from-stone-950 via-zinc-900 to-amber-950",
    heraldicBorder: "border-stone-400",
    portraitUrl: HUNTER_PORTRAITS.helsing,
    quote: "„Tito čeští vampýři jsou poněkud pomalejší než bengálský tygr, ale zuby mají úctyhodné!“",
    signatureWeapon: "Gatlingova rotační kuše vz. 1888 & Rumpálový napínák",
    bumpName: "Úder pažbou kuše",
    bumpDesc:
      "Krok do nepřítele: 2 DMG a odhodí cíl o 1 pole vzad (CD 2).",
    comboName: "Kruhový rotační rozptyl",
    comboDesc:
      "3-kombo: Kruhová salva (360°) udělí 4 DMG + Krvácení (2) VŠEM nepřátelům na bojišti.",
    deck: [
      { id: "repeating_crossbow", upgradeLevel: 0 },
      { id: "silver_bolt_salvo", upgradeLevel: 0 },
      { id: "winch_reload_kick", upgradeLevel: 0 },
    ],
  },
  revident: {
    id: "revident",
    shortName: "Revident Šiml",
    name: "Revident Ignác Šiml",
    epithet: "Císařský daňový exekutor",
    role: "Úřední předvolání & razítka",
    tag: "C. k. daňová kontrola (18 HP, 2 Obrana) · Razítko ZAMÍTNUTO · Stav [OKOLKOVÁNO]",
    beerBadge: "Erární ležák 11°",
    maxHp: 18,
    defense: 2,
    fury: 5,
    persistence: 5,
    passiveName: "C. k. daňová kontrola",
    passiveDesc: "Při otočení (W) čelem k nepříteli na 2 pole jej přitáhne a okolkuje (CD 2). Útok do cíle se stavem [OKOLKOVÁNO] udělí +1 DMG a přidá +1 Štít.",
    icon: "📑",
    heraldicColor: "from-yellow-950 via-stone-900 to-amber-950",
    heraldicBorder: "border-amber-600",
    portraitUrl: HUNTER_PORTRAITS.revident,
    quote: "„Nemáte zaplacenou daň ze záhrobního pobytu! Předložte domovský list, nebo přistoupíme k exekuci!“",
    signatureWeapon: "Erární osikový kolík vz. 1884 & Mosazné razítko „ZAMÍTNUTO“",
    bumpName: "Třísknutí deskami spisů",
    bumpDesc:
      "Krok do nepřítele: 1 DMG, odhodí cíl o 1 pole a nalepí [OKOLKOVÁNO] (CD 2).",
    comboName: "Finanční exekuce",
    comboDesc:
      "3-kombo: +3 Štít, nalepí [OKOLKOVÁNO] na všechny nepřátele a již okolkovaným udělí 3 DMG!",
    deck: [
      { id: "gov_stake_1884", upgradeLevel: 0 },
      { id: "brass_stamp_denied", upgradeLevel: 0 },
      { id: "rast_gasser_revolver", upgradeLevel: 0 },
    ],
  },
};

const THEMATIC_FOLK_SEEDS = [
  "ARTHUR-1888",
  "REVIDENT-1884",
  "CIRKUS-1899",
  "EARL-GREY-1899",
  "PULNOC-1899",
  "PONOCNY-1899",
  "CESNEK-1899",
  "POVIDLA-1420",
  "C-K-DRAGOUN-1848",
  "KACA-1900",
  "SVECENA-PIPA-77",
  "ZNOJMO-1899",
  "BUCHTA-666",
  "SLIVOVICE-1848",
  "KORBEL-99",
  "NOCHTIC-1899",
  "ROZMARNICE-13",
  "CERNY-KRIZ-1899",
];

const HUNTER_KEYS = Object.keys(HUNTERS_DATA);

type InspectKey =
  | "stat:hp"
  | "stat:defense"
  | "stat:fury"
  | "stat:armor"
  | "stat:backstab"
  | "stat:persistence"
  | "ability:passive"
  | "ability:bump"
  | "ability:combo"
  | "tile:0"
  | "tile:1"
  | "tile:2";

interface SmartUpgradeInfo {
  level: number;
  name: string;
  badge: string;
  cooldown: number;
  description: string;
}

interface SmartInspectData {
  key: InspectKey;
  category: string;
  icon: string;
  title: string;
  badges: string[];
  mechanics: string;
  tacticalTip: string;
  synergy: string;
  flavor?: string;
  upgrades?: SmartUpgradeInfo[];
}

function formatTileRangeLabel(tile: any): string {
  if (!tile) return "Na místě";
  if (tile.id === "domicile_inspection") return "Prohození (1 pole)";
  if (tile.isLobbed) return `Hod na ${tile.lobDistance || 3} pole (okolí ±1)`;
  if (tile.stepBackward) return `Úskok o ${tile.stepBackward} pole vzad`;
  if (tile.leapDistance) return `Skok o ${tile.leapDistance} pole vpřed`;
  if (tile.projectileRange) return `Střela 1–${tile.projectileRange} pole`;
  if (!tile.pattern || tile.pattern.length === 0) return "Na místě (Sebe-efekt)";
  const offsets = tile.pattern.map((p: any) => p.offset).sort((a: number, b: number) => a - b);
  if (offsets.length === 1) {
    return offsets[0] > 0 ? `Vpřed ${offsets[0]} pole` : `Vzad ${Math.abs(offsets[0])} pole`;
  }
  if (offsets.length === 2 && offsets[0] === -1 && offsets[1] === 1) {
    return "Kolem sebe (±1 pole)";
  }
  if (offsets.every((o: number) => o > 0)) {
    return `Vpřed ${Math.min(...offsets)}–${Math.max(...offsets)} pole`;
  }
  return `Pole ${offsets.map((o: number) => (o > 0 ? `+${o}` : `${o}`)).join(", ")}`;
}

function formatTileMetricBadge(tile: any): string {
  if (!tile) return "✨ Efekt";
  if (tile.dmg && tile.dmg > 0) {
    return tile.burstHits && tile.burstHits > 1
      ? `⚔️ ${tile.burstHits}×${tile.dmg} DMG`
      : `⚔️ ${tile.dmg} DMG`;
  }
  if (tile.shieldAmount) return `🛡️ +${tile.shieldAmount} Štít`;
  if (tile.healAmount) return `❤️ +${tile.healAmount} HP`;
  if (tile.type === "move") return "🏃 Pohyb";
  return "✨ Taktický efekt";
}

const HUNTER_ABILITY_TIPS: Record<
  string,
  {
    passiveMechanics: string;
    passiveTip: string;
    bumpMechanics: string;
    bumpTip: string;
    comboMechanics: string;
    comboTip: string;
    tileTips: [string, string, string];
  }
> = {
  classic: {
    passiveMechanics:
      "V Česnekovém oblaku se Venca otáčí klávesou W za 0 tahů (zdarma). Každý nepřítel, který v oblaku začíná svůj tah, utrpí 1 DMG (upíři 2 DMG) a oblak dokáže definitivně dorazit upíra v Ochromení (💤) i bez kolíku.",
    passiveTip:
      "Vytvoř pod sebou Česnekový oblak (nárazem nebo Skokem přes kozu) — získáš bezplatné otáčení čelem vzad na obě strany chodby a pasivní dorážení upírů.",
    bumpMechanics:
      "Aktivuje se krokem (A / D) do sousedního nepřítele. Způsobí 1 DMG, odhodí cíl o 1 pole vzad a na jeho původním poli zanechá Česnekový oblak na 2 kola. Chladnutí: 3 tahy.",
    bumpTip:
      "Pokud za nepřítelem stojí další monstrum nebo sud, Sokolský náraz vyvolá okamžitou kolizi (+1 DMG oběma) a nechá nepřítele stát přímo v česneku!",
    comboMechanics:
      "Spustí se automaticky po odpálení 3 destiček ve frontě Mezerníkem. Přidá +4 Štít a všem nepřátelům v dosahu 1–2 pole před Vencou i za ním udělí 3 DMG a Zmatení (❓).",
    comboTip:
      "Zařaď jako první destičku Skok přes kozu doprostřed nepřátel — finální Sokolská prostná pak omráčí obě strany chodby najednou!",
    tileTips: [
      "Proti lidským přisluhovačům (drábové, kultisté, felčaři) dává Sokolí spár hned 6 DMG a přitáhne je přímo do Česnekového oblaku.",
      "Hoď granát na skupinu nepřátel nebo na upíra v Ochromení (💤): Zmatení (❓) jim zruší příští akci a česnek upíra spolehlivě dorazí.",
      "Skok přeskočí sud i nepřítele bez kolize, nechá za tebou 3 pole česneku a díky Rezonanci zkrátí Chladnutí následující destičce ve frontě o 1!",
    ],
  },
  honza: {
    passiveMechanics:
      "Honza nemá základní Obranu (0), ale nosí 1 Brnění a každou směnu získá +25 % Rozlícení. Kdykoliv mu nepřítel zasáhne přímo HP (přes Štít a Brnění), získá okamžitě +10 % Rozlícení. Při pádu na 0 HP a méně (Zubatá) získá jednorázově +25 % Rozlícení navíc.",
    passiveTip:
      "Neboj se ustát lehký zásah do těla — 1 Brnění jej ztlumí a Selský furiant ti vystřelí Rozlícení vzhůru pro drtivý protiúder cepem!",
    bumpMechanics:
      "Krokem (A / D) do sousedního nepřítele jej Honza odhodí o 1 pole, sám postoupí na jeho uvolněné pole a udělí mu 2 DMG (škálované Rozlícením). Chladnutí: 3 tahy.",
    bumpTip:
      "Při vysokém Rozlícení (+50 % a více) dává samotný Selský beran 3–4 DMG plus kolizní zranění, pokud cíl přirazíš ke zdi.",
    comboMechanics:
      "Při odpálení 3 destiček získá Honza masivní +6 Štít a rázová vlna zasáhne sousední pole (±1) za 4 DMG (navýšené o Rozlícení).",
    comboTip:
      "Protože Honza nemá pasivní Obranu, 3-kombo (+6 Štít) je tvůj nejlepší způsob, jak vykrýt připravený červený útok (🚨 1 AKCE) bosse!",
    tileTips: [
      "Cep zasahuje pole před tebou i za tebou současně — obklíčení dvěma upíry je pro Honzu výhoda.",
      "Buchta je Rychlovka (vložení stojí 0 tahů!), vyléčí +2 HP a přidá +2 Štít. Sníží sice Rozlícení o 15 %, ale v kritické chvíli zachrání krk.",
      "Selský nápřah (+20 % Rozlícení a Zesílení) vlož na začátek fronty před Máchání cepem pro maximální násobič poškození.",
    ],
  },
  dragoun: {
    passiveMechanics:
      "Pokud se Jaromír v daném kole pohnul vpřed (krokem, výpadem šavle nebo přesunem), jeho příští útočná destička získá +2 DMG a ignoruje 1 bod nepřátelského Brnění.",
    passiveTip:
      "Před odpálením komba udělej krok vpřed nebo zahaj kombo výpadem šavle — bonus +2 DMG a průraz brnění rozdrtí i obrněné dráby!",
    bumpMechanics:
      "Krok do nepřítele udělí 2 DMG, odhodí cíl o 1 pole vzad a uvrhne jej do Zmatení (❓). Chladnutí: 3 tahy.",
    bumpTip:
      "Zmatený nepřítel (❓) má nad hlavou otazník, vynechá svůj příští tah a každý tvůj následující útok do něj má +50 % bonus ze Zákeřného úderu!",
    comboMechanics:
      "Odpálení 3 destiček vypálí kartáčovou salvu (4 DMG všem nepřátelům v linii pohledu) a zkrátí Chladnutí všech tvých destiček o 1 tah.",
    comboTip:
      "Srovnej nepřátele do jednoho směru a odpal 3-kombo: salva zasáhne celou řadu a díky zkrácení CD můžeš v dalším kole pálit znovu.",
    tileTips: [
      "Šavle tě nejprve posune o 1 pole vpřed (čímž sama aktivuje Kavalírský nápřah!) a pak sekne za 6 DMG.",
      "Revolver Gasser má dosah 3 pole — po kroku vpřed pálí s bonusem +2 DMG z Kavalírského nápřahu.",
      "Jezdecký kryt ti dá okamžitě +5 Štít a připraví Zesílení na další jezdecký výpad.",
    ],
  },
  zlodejka: {
    passiveMechanics:
      "Běžní lovci dávají +50 % poškození do zad nebo do zmateného cíle (❓). Kapsářka Káča má tento bonus zvýšený na +100 % (dvojnásobné poškození)!",
    passiveTip:
      "Nikdy neútoč čelně do připraveného nepřítele: nejprve si s ním prohoď místo Kapsářskou záměnou nebo ho zmať střepy!",
    bumpMechanics:
      "Krok do sousedního nepřítele s ním prohodí pozici a otočí ho zády k tobě. Chladnutí: pouze 2 tahy!",
    bumpTip:
      "Když má nepřítel 🚨 1 AKCE, prohoď se s ním Kapsářskou záměnou: vystřelí naprázdno (nebo do vlastního druha) a ty mu do zad zasadíš dvojnásobnou ránu!",
    comboMechanics:
      "Odpálení 3 destiček přidá +4 Štít a okamžitě vynuluje Chladnutí manévru Kapsářská záměna.",
    comboTip:
      "Můžeš udělat Kapsářskou záměnu, odpálit 3-kombo do zad a díky obnovené záměně v dalším tahu okamžitě uniknout!",
    tileTips: [
      "Základní 4 DMG stiletta se při úderu do zad nebo do zmateného cíle mění na smrtících 8 DMG (a na 2. úrovni až 12 DMG!).",
      "Střepy do očí zasáhnou na 2 pole a způsobí Zmatení (❓) — tím si i zepředu okamžitě odemkneš +100 % Zákeřný úder!",
      "Stínový přemet přeskočí nepřítele za jeho záda a připraví tě na bodnutí stilettem zezadu.",
    ],
  },
  ponocny: {
    passiveMechanics:
      "Na začátku každého kola získá Bartoloměj ke své Obraně (+2 Štít) dalších +1 Štít za každého živého nepřítele ve vzdálenosti 1–2 pole před sebou.",
    passiveTip:
      "Udržuj nepřátele před sebou v kuželu lucerny (1–2 pole): se dvěma upíry před sebou začínáš každé kolo se 4 Štíty zdarma!",
    bumpMechanics:
      "Krok do nepřítele vrazí cíli ratištěm za 3 DMG, odhodí jej o 1 pole vzad a způsobí Zmatení (❓). Chladnutí: 3 tahy.",
    bumpTip:
      "Ideální, když se ti nepřítel dostane přímo na tělo — odhodíš ho na 2. pole (stále v dosahu halapartny i pasivky) a zmateš ho.",
    comboMechanics:
      "Odpálení 3 destiček přidá +6 Štít a současně zasáhne obě pole před ponocným (+1 a +2) za 5 DMG.",
    comboTip:
      "Ponocný v 3-kombu spojuje neprostupnou obranu (+6 Štít) s plošným úderem přes dvě pole.",
    tileTips: [
      "Halapartna seká obě pole před tebou (+1 i +2) najednou za 6 DMG — seřaď si dva upíry za sebe!",
      "Lucerna zchladí Rozlícení nepřátel o 15 % a uvrhne je do Zmatení (❓), čímž zastaví jejich útok.",
      "Půlnoční roh ti dodá Štít a přitáhne či postraší noční chásku, aby zůstala v dosahu halapartny.",
    ],
  },
  silak: {
    passiveMechanics:
      "Kdykoliv Gustav odhodí nepřítele (Push) a ten narazí do zdi, sudu nebo jiné postavy, kolize způsobí o +1 DMG navíc a Gustav okamžitě získá +2 Štít.",
    passiveTip:
      "Snaž se bojovat u okrajů bojiště nebo u sudů: každé odhození do zdi ti automaticky generuje Štít a násobí kolizní škody!",
    bumpMechanics:
      "Krok do nepřítele udělí 3 DMG a odhodí cíl o 2 pole vzad. Chladnutí: 3 tahy.",
    bumpTip:
      "Odhodit nepřítele o 2 pole přímo do zdi znamená 3 DMG z přehozu + 2 DMG za neprojitá pole + 1 DMG z Cirkusové dominance = 6 DMG a +2 Štít za jediný krok!",
    comboMechanics:
      "Odpálení 3 destiček přidá +5 Štít a vrhne činku na prvního nepřítele v linii pohledu za 6 DMG + Zmatení (❓).",
    comboTip:
      "Skvělé pro dorážení vzdálených střelců nebo bossů, na které jsi předtím odhodil přední řadu.",
    tileTips: [
      "Úder činkou dává vysoké poškození a odhazuje cíl o 2 pole vzad — spolehlivý spouštěč Cirkusové dominance.",
      "Vrh závažím zasáhne na dálku a odhodí cíl ještě blíž ke zdi.",
      "Zatnutí svalů ti dá +5 Štít, +10 % Rozlícení a Zesílení (+1 DMG k příštímu útoku).",
    ],
  },
  anglicanka: {
    passiveMechanics:
      "Destička Královská etiketa přetaví veškeré kladné Bojové rozlícení na Štít (každých 5 % Rozlícení = +1 Štít navíc) a přebytek léčení nad max HP rovněž převede na Štít.",
    passiveTip:
      "Nech Rozlícení pár kol narůst (nebo vypij Vařící čaj) a pak zahraj Královskou etiketu pro obří porci Štítu!",
    bumpMechanics:
      "Krok do nepřítele (pokud je za ním volné pole) povolá na jeho pole Komorníka Archibalda (nesmrtelný živý štít na 2 kola) a odkopne nepřítele o 3 pole vzad se Zmatením (❓). Chladnutí: 3 tahy.",
    bumpTip:
      "Komorník blokuje nepřátelům cestu i střely po dobu 2 kol, zatímco ty přes něj můžeš bezpečně pálit čajem a slunečníkem!",
    comboMechanics:
      "Odpálení 3 destiček vyléčí +4 HP, přidá +4 Štít a opaří všechny nepřátele v linii pohledu za 3 DMG + Krvácení (2).",
    comboTip:
      "Pokud máš plné zdraví, Čaj o páté ti udrží neprostupnou linii za zády komorníka a oslabí celou chodbu krvácením.",
    tileTips: [
      "Stříbrný slunečník bodá přes 1–2 pole (dosáhne i přes políčko s Komorníkem Archibaldem!) a odhazuje nepřítele.",
      "Vařící čaj opaří cíl na dálku, způsobí Krvácení a zvedne tvé Rozlícení pro pozdější přeměnu na Štít.",
      "Královská etiketa tě vyléčí, dá Štít a aktivuje Noblesní sebeovládání (konverzi Rozlícení na Štít).",
    ],
  },
  helsing: {
    passiveMechanics:
      "Každý střelecký zásah na vzdálenost 2 a více polí do nepřítele s Krvácením (🩸) způsobí o +2 DMG více a okamžitě zkrátí Chladnutí této destičky o 1 tah.",
    passiveTip:
      "Nejprve cíl rozkrvav Stříbrnou salvou (nebo 3-kombem) a udržuj si odstup aspoň 2 pole — Rotační kuše pak ze dvou šipek udělí +4 DMG navíc a zkrátí si CD o 2!",
    bumpMechanics:
      "Krok do nepřítele udělí 2 DMG okovanou pažbou a odhodí cíl o 1 pole vzad. Chladnutí: 2 tahy.",
    bumpTip:
      "Když se ti krvácející upír přiblíží na sousední pole (vzdálenost 1), pažbou ho odkopneš na vzdálenost 2 pole, kde už opět platí bonus Lovce trofejí!",
    comboMechanics:
      "Odpálení 3 destiček vystřelí kruhovou salvu (360°) na všechny nepřátele na bojišti za 4 DMG a každému aplikuje Krvácení (2).",
    comboTip:
      "Po 3-kombu krvácejí všichni nepřátelé na bojišti — každá tvá další střela na 2+ pole tak získá +2 DMG a zkrácení CD!",
    tileTips: [
      "Rotační kuše vystřelí 2 šipky po 2 DMG. Do krvácejícího cíle na 2+ pole dá každá šipka 4 DMG (celkem 8 DMG) a CD kuše klesne o 2!",
      "Stříbrná salva šípů spolehlivě nahodí Krvácení (2) až na 3 pole daleko pro aktivaci pasivky Lovec trofejí.",
      "Odskok a natažení rumpálu odkopne nepřítele o 1 pole vpřed, tebe posune o 1 pole vzad a sníží CD střeleckých destiček o 1.",
    ],
  },
  revident: {
    passiveMechanics:
      "1) Úřední předvolání: Otočíš-li se (W) čelem k nepříteli vzdálenému přesně 2 pole, přitáhneš ho o 1 pole blíž a nalepíš mu [OKOLKOVÁNO] (CD 2 tahy). 2) Daňová kontrola: Útok do cíle s [OKOLKOVÁNO] dá +1 DMG z kolku, +1 DMG z pasivky a přidá revidentovi +1 Štít.",
    passiveTip:
      "Využívej otočení (W) jako bezplatný taktický nástroj k přitažení a okolkování nepřítele ze vzdálenosti 2 polí!",
    bumpMechanics:
      "Krok do nepřítele udělí 1 DMG deskami spisů, odhodí cíl o 1 pole vzad a nalepí na něj stav [OKOLKOVÁNO]. Chladnutí: 2 tahy.",
    bumpTip:
      "Po Třísknutí deskami spisů je nepřítel odhozen o 1 pole a okolkován — okamžitě na něj navážeš revolverem nebo předvoláním!",
    comboMechanics:
      "Odpálení 3 destiček přidá +3 Štít, nalepí [OKOLKOVÁNO] na všechny nepřátele a těm, kteří už okolkovaní byli, udělí 3 DMG (+ daňovou přirážku)!",
    comboTip:
      "Pokud před odpálením 3-komba cíl okolkuješ (otočením nebo krokem), Finanční exekuce mu udělí plný daňový výměr a hned mu nalepí nový kolek!",
    tileTips: [
      "Erární kolík dává do okolkovaného cíle celkem 4 DMG (+1 Štít revidentovi) a navíc si sám zkrátí Chladnutí o 1 tah!",
      "Mosazné razítko „ZAMÍTNUTO“ odhodí nepřítele o 1 pole a posune jeho odpočet/záměr o 1 tah zpět.",
      "Revolver Rast & Gasser střílí přes 5 polí a zpětným rázem tě posune o 1 pole vzad — ideální pro udržení odstupu 2 polí na Úřední předvolání!",
    ],
  },
};

function buildSmartInspectData(
  hunter: HunterDeed,
  starterTiles: any[],
  key: InspectKey
): SmartInspectData {
  const tips = HUNTER_ABILITY_TIPS[hunter.id] || HUNTER_ABILITY_TIPS.classic;

  switch (key) {
    case "stat:hp":
      return {
        key,
        category: "ATRIBUT LOVCE",
        icon: "❤️",
        title: `Zdraví lovce (${hunter.maxHp} HP)`,
        badges: [`Max ${hunter.maxHp} HP`, "Hospoda: +2 HP zdarma", `Verva: ${hunter.persistence ?? 5}`],
        mechanics:
          "Určuje výdrž lovce před pádem do stavu Zubatá na krku (HP ≤ 0). Zranění prochází nejprve přes dočasný Štít a případné Brnění, teprve zbytek snižuje HP.",
        tacticalTip:
          hunter.maxHp <= 14
            ? `${hunter.shortName} má nízké zdraví (${hunter.maxHp} HP) — vyhýbej se přímé výměně úderů a využívej prohození pozic, Zmatení (❓) a Štít.`
            : hunter.maxHp >= 22
            ? `${hunter.shortName} patří k nejodolnějším bijcům (${hunter.maxHp} HP) a dokáže bezpečně kontrolovat střed chodby.`
            : `Vyvážená hladina zdraví (${hunter.maxHp} HP). V Hospodě U Svěcené pípy si vždy zdarma doplníš +2 HP a plnou Vervu.`,
        synergy: `Při poklesu HP na 0 lovec neumírá ihned — aktivuje se Verva (${hunter.persistence ?? 5}) a boj pokračuje v režimu Zubatá na krku!`,
      };

    case "stat:defense":
      return {
        key,
        category: "ATRIBUT LOVCE",
        icon: "🛡️",
        title: `Základní obrana (${hunter.defense})`,
        badges: [`+${hunter.defense} Štít každé kolo`, "Odráží Krvácení & Zmatení"],
        mechanics:
          "Na začátku každého kola získá lovec automaticky Štít ve výši své Základní obrany. Štít pohlcuje poškození bod po bodu před HP. Pokud Štít pohltí celý útok (0 DMG do HP), zcela odrazí i vedlejší efekty útoku (Krvácení 🩸, Zmatení ❓). Na konci kola nevyužitý Štít vyprchá.",
        tacticalTip:
          hunter.defense === 0
            ? `${hunter.shortName} nemá pasivní Obranu (0 Štítu na začátku kola), ale kompenzuje to 1 Brněním, povidlovými buchtami a +6 Štítem ze 3-komba!`
            : `Každé kolo ti zdarma vykryje první ${hunter.defense} DMG a ochrání tě před otravným Krvácením ze slabších útoků.`,
        synergy:
          "Dočasný Štít z Obrany se sčítá se Štítem z destiček, 3-komba i pasivních schopností v daném kole.",
      };

    case "stat:fury":
      return {
        key,
        category: "ATRIBUT LOVCE",
        icon: "💢",
        title: `Bojové rozlícení (+${hunter.fury} % za kolo)`,
        badges: [`Start bitvy: +${hunter.fury} %`, `+${hunter.fury} % každé další kolo`, "Limit Zchlazení: −50 %"],
        mechanics:
          "Horká krev v boji! Na začátku bitvy i na začátku každého dalšího kola vzroste tvé Rozlícení o tuto hodnotu. Procentuálně zvyšuje veškeré poškození tvých útočných destiček i kolizí z odhození (zaokrouhleno na celá čísla). Pokud klesne pod 0 % (Zchlazení 🧊), útoky slábnou, ale nenulový útok dá vždy aspoň 1 DMG.",
        tacticalTip:
          hunter.fury >= 20
            ? `${hunter.shortName} se rozpaluje extrémně rychle (+${hunter.fury} % za kolo) — už ve 2. a 3. kole mají jeho údery drtivý násobič!`
            : `Postupně stupňuje tvou útočnou sílu v delších bitvách a proti elitním drábům či bossům.`,
        synergy:
          hunter.id === "anglicanka"
            ? "Lady Gwendolyn umí nakumulované Rozlícení přetavit na Štít pomocí destičky Královská etiketa (5 % = +1 Štít)!"
            : hunter.id === "honza"
            ? "Honza získává dalších +10 % Rozlícení za každý přímý zásah do HP a +25 % při vstupu do Zubaté!"
            : "Kombinuj vysoké Rozlícení s vícenásobnými zásahy a odhazováním do zdí.",
      };

    case "stat:armor":
      return {
        key,
        category: "ATRIBUT LOVCE",
        icon: "🦺",
        title: `Brnění (${hunter.armor || 0})`,
        badges: [`−${hunter.armor || 0} DMG z každého průrazu do HP`, "Trvalá redukce"],
        mechanics:
          "Pevná zbroj, která snižuje každé fyzické zranění pronikající přes Štít do zdraví (HP) o hodnotu Brnění (minimálně však na 1 DMG, pokud útok nebyl plně zastaven Štítem).",
        tacticalTip:
          "Brnění je obzvlášť silné proti skupinám nepřátel a vícenásobným útokům v jednom kole, protože tlumí každou ránu zvlášť!",
        synergy:
          hunter.id === "honza"
            ? "Ztlumený zásah do těla za 1 DMG ti vezme minimum zdraví, ale přesto naplno spustí pasivku Selský furiant (+10 % Rozlícení)!"
            : "V kombinaci se Štítem z Cirkusové dominance dělá z Gustava nezdolného rváče.",
      };

    case "stat:backstab":
      return {
        key,
        category: "ATRIBUT LOVCE",
        icon: "🗡️",
        title: `Mistrovský Zákeřný úder (+${hunter.backstabBonus || 100} %)`,
        badges: [`+${hunter.backstabBonus || 100} % DMG do zad`, `+${hunter.backstabBonus || 100} % DMG do Zmatení (❓)`],
        mechanics:
          "Kdykoliv zasáhneš nepřítele zezadu (stojíš za jeho zády) NEBO má nepřítel nad hlavou otazník Zmatení (❓), tvůj útok způsobí dvojnásobné poškození (+100 % místo běžných +50 %).",
        tacticalTip:
          "Prohoď se s nepřítelem Kapsářskou záměnou nebo mu hoď Střepy do očí (❓) a teprve pak odpal Stiletto do ledvin!",
        synergy:
          "Bonus za úder do zad a za Zmatení se uplatní spolehlivě na každou útočnou destičku v kombu.",
      };

    case "stat:persistence":
      return {
        key,
        category: "ATRIBUT LOVCE",
        icon: "🪦",
        title: `Verva (${hunter.persistence ?? 5}) · Odolnost proti Zubaté`,
        badges: [`Limit záporných HP: −${(hunter.persistence ?? 5) - 1}`, "Při 0 HP vyprázdní frontu"],
        mechanics:
          "Když tvé životy klesnou na 0 nebo méně, nezemřeš ihned — vstoupíš do stavu Zubatá na krku (💀) a tvá fronta komba se vyprázdní. Dokud je součet (Verva + aktuální záporné HP) větší než 0, zůstáváš v boji! Každé celé kolo zakončené v Zubaté sníží Vervu o 1.",
        tacticalTip:
          "Pokud skončíš bitvu v záporných životech, po vítězství se automaticky oklepeš na 1 HP. V Hospodě U Svěcené pípy se Verva obnoví na maximum.",
        synergy:
          hunter.id === "honza"
            ? "Honza má nejvyšší Vervu (7) a při pádu do Zubaté okamžitě získá +25 % Rozlícení (Zoufalý furiant)!"
            : "V Zubaté tě jakýkoliv přímý zásah znovu vyhodí ze soustředění (vyprázdní frontu), proto se rychle vyleč nebo doraz posledního upíra.",
      };

    case "ability:passive":
      return {
        key,
        category: "PASIVNÍ SIGNATURA",
        icon: "✨",
        title: hunter.passiveName || "Pasivní schopnost",
        badges: ["Trvalý efekt", hunter.shortName],
        mechanics: tips.passiveMechanics,
        tacticalTip: tips.passiveTip,
        synergy: `Tato schopnost je aktivní po celou výpravu od prvního kola každé bitvy.`,
      };

    case "ability:bump":
      return {
        key,
        category: "MANÉVR KROKU DO NEPŘÍTELE",
        icon: "💥",
        title: hunter.bumpName,
        badges: ["Klávesa A / D do nepřítele", "Zkracuje se Švunkem"],
        mechanics: tips.bumpMechanics,
        tacticalTip: tips.bumpTip,
        synergy:
          "Švunk: Pokud zabiješ nepřítele kombem 2 nebo více destiček, zkrátí se Chladnutí i tomuto manévru o počet destiček v kombu!",
      };

    case "ability:combo":
      return {
        key,
        category: "3-KOMBO FINIŠER",
        icon: "🌌",
        title: hunter.comboName,
        badges: ["Vyžaduje 3 destičky ve frontě", "Odpal Mezerníkem (0 tahů navíc)"],
        mechanics: tips.comboMechanics,
        tacticalTip: tips.comboTip,
        synergy:
          "Provede se automaticky jako čtvrtý finální úder ihned po odehrání všech 3 destiček ve frontě.",
      };

    case "tile:0":
    case "tile:1":
    case "tile:2": {
      const idx = Number(key.split(":")[1]) || 0;
      const tile = starterTiles[idx] || starterTiles[0];
      const tagNames = (tile?.tags || [])
        .map((tId: string) => (TILE_TAGS[tId] ? `${TILE_TAGS[tId].icon} ${TILE_TAGS[tId].name}` : ""))
        .filter(Boolean);
      const upgrades: SmartUpgradeInfo[] = (tile?.upgrades || []).map((u: any) => ({
        level: u.level,
        name: u.name,
        badge: formatTileMetricBadge({ ...tile, ...u }),
        cooldown: u.cooldown ?? tile.cooldown,
        description: u.description,
      }));

      return {
        key,
        category: `STARTOVNÍ DESTIČKA #${idx + 1}`,
        icon: "🃏",
        title: tile?.name || "Destička",
        badges: [
          formatTileMetricBadge(tile),
          `⏳ Chladnutí ${tile?.cooldown ?? 2}t`,
          `📏 ${formatTileRangeLabel(tile)}`,
          ...(tile?.quick ? ["⚡ Rychlovka (0t vložení)"] : []),
          ...tagNames,
        ],
        mechanics: tile?.description || "",
        tacticalTip: tips.tileTips[idx] || tips.passiveTip,
        synergy: tile?.resonance
          ? `✨ ${tile.resonance.description}`
          : "V Kolářské a kovářské dílně lze tuto destičku dvakrát vylepšit (+ a ++) a v Hospodě jí trvale snížit Chladnutí o 1 tah.",
        flavor: tile?.flavor,
        upgrades,
      };
    }
  }
}

function buildTooltipHtmlFromInspect(data: SmartInspectData): string {
  const badgesHtml = data.badges
    .map(
      (b) =>
        `<span style="display:inline-block;padding:2px 7px;margin:2px 4px 2px 0;border-radius:5px;background:#451a03;border:1.5px solid #fbbf24;font-size:0.8em;font-weight:800;color:#fffbeb;">${b}</span>`
    )
    .join("");

  const upgradesHtml =
    data.upgrades && data.upgrades.length > 0
      ? `<div style="margin-top:7px;padding:6px 8px;border-radius:7px;background:#23140c;border:1.5px solid #b45309;font-size:0.86em;">
          <div style="color:#fde047;font-weight:900;margin-bottom:3px;">⚒️ Kovářská vylepšení v dílně:</div>
          ${data.upgrades
            .map(
              (u) =>
                `<div style="margin-bottom:3px;color:#ffffff;line-height:1.38;"><strong style="color:#fde68a;">${u.name}</strong> <span style="color:#fcd34d;font-weight:700;">(${u.badge}, ⏳ ${u.cooldown}t)</span>: ${u.description}</div>`
            )
            .join("")}
        </div>`
      : "";

  return `
    <div style="font-size:0.72em;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#fbbf24;margin-bottom:2px;">${data.category}</div>
    <div class="tt-title">${data.icon} ${data.title}</div>
    <div class="tt-stat-row" style="margin-bottom:6px;">${badgesHtml}</div>
    <div class="tt-desc" style="margin-bottom:6px;padding:6px 8px;border-radius:7px;background:#1c120c;border:1px solid #78350f;color:#ffffff;font-weight:500;">${data.mechanics}</div>
    <div class="tt-bonus" style="margin-bottom:6px;">💡 <strong style="color:#fde047;">Taktický tip:</strong> ${data.tacticalTip}</div>
    <div style="padding:5px 8px;border-radius:7px;background:#0c4a6e;border:1.5px solid #38bdf8;font-size:0.84em;color:#f0f9ff;line-height:1.4;">🔗 <strong style="color:#7dd3fc;">Synergie:</strong> ${data.synergy}</div>
    ${upgradesHtml}
    ${data.flavor ? `<div class="tt-flavor" style="margin-top:6px;">${data.flavor}</div>` : ""}
    <div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(251,191,36,0.28);font-size:0.78em;font-weight:800;color:#fde047;">🔍 Kliknutím zobrazíš / připneš kartu na panelu</div>
  `;
}

export function TitleScreen({
  onStartHunt,
  onOpenRules,
  onOpenArchive,
  initialHunterId = "classic",
  initialSeed = "CESNEK-1899",
}: TitleScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(initialHunterId);
  const [seed, setSeed] = useState<string>(initialSeed);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [inspectedKey, setInspectedKey] = useState<InspectKey | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isFullscreenActive());

  useEffect(() => {
    if (initialHunterId && HUNTERS_DATA[initialHunterId]) {
      setSelectedId(initialHunterId);
    }
  }, [initialHunterId]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
      hideTooltip();
    };
  }, []);

  const handleSelectHunter = useCallback((id: string) => {
    setSelectedId(id);
    const nextHunter = HUNTERS_DATA[id] || HUNTERS_DATA.classic;
    setInspectedKey((prev) => {
      if (prev === "stat:armor" && !nextHunter.armor) {
        return "stat:defense";
      }
      if (prev === "stat:backstab" && (!nextHunter.backstabBonus || nextHunter.backstabBonus <= 50)) {
        return "ability:passive";
      }
      return prev;
    });
    try {
      SFX.swap?.();
    } catch {
      // Audio fallback
    }
  }, []);

  const handleRandomSeed = () => {
    const randomPick =
      THEMATIC_FOLK_SEEDS[Math.floor(Math.random() * THEMATIC_FOLK_SEEDS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const newSeed = `${randomPick.split("-")[0]}-${num}`;
    setSeed(newSeed);
    try {
      SFX.queueInsert?.();
    } catch {
      // Audio fallback
    }
  };

  const handleLaunch = useCallback(() => {
    try {
      SFX.bell?.();
    } catch {
      // Audio fallback
    }
    onStartHunt(selectedId, seed.trim() || "CESNEK-1899");
  }, [onStartHunt, selectedId, seed]);

  // Klávesové zkratky: 1-9 výběr lovce, R náhodný seed, Enter start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modalRoot = document.getElementById("modal-root");
      if (modalRoot && !modalRoot.classList.contains("hidden")) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const targetHunter = HUNTER_KEYS[num - 1];
        if (targetHunter) handleSelectHunter(targetHunter);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRandomSeed();
      } else if (e.key === "Enter" || e.key === " ") {
        if (activeTag === "BUTTON" || activeTag === "A") return;
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleLaunch, handleSelectHunter]);

  const activeHunter = HUNTERS_DATA[selectedId] || HUNTERS_DATA.classic;
  const activeStarterTiles = (activeHunter.deck || []).map((card) =>
    getHeroTileDefinition(card.id, card.upgradeLevel || 0)
  );

  const activeInspectData = inspectedKey
    ? buildSmartInspectData(activeHunter, activeStarterTiles, inspectedKey)
    : null;

  const handleSmartHover = (key: InspectKey, e: React.MouseEvent) => {
    const data = buildSmartInspectData(activeHunter, activeStarterTiles, key);
    showTooltip(buildTooltipHtmlFromInspect(data), e.clientX, e.clientY);
  };

  const handleSmartLeave = () => {
    hideTooltip();
  };

  const handleSmartClick = (key: InspectKey, e: React.MouseEvent) => {
    e.stopPropagation();
    hideTooltip();
    setInspectedKey((prev) => (prev === key ? null : key));
    try {
      SFX.queueInsert?.();
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0a0705] text-[#f8fafc] flex flex-col justify-between overflow-x-hidden font-sans antialiased select-none">
      {/* 1. Atmosférické pozadí */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-25 filter blur-[1px] saturate-150"
        style={{
          backgroundImage: "url('/assets/terrain/village_night.svg')",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(217,119,6,0.25),transparent_75%),radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(159,18,57,0.32),transparent_75%),linear-gradient(to_bottom,rgba(10,7,5,0.88)_0%,rgba(16,10,7,0.96)_50%,rgba(7,4,3,0.98)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-15 bg-[radial-gradient(#fde047_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden="true"
      />

      {/* 2. C. a k. Mimořádný věstník - Úřední záhlaví pro potírání vampýrismu */}
      <header className="relative z-10 w-full pt-2.5 pb-2 px-3 sm:px-6 border-b-4 border-[#2b1b11] bg-gradient-to-b from-[#2a170d] via-[#1d1008] to-[#140b06] shadow-[0_6px_22px_rgba(0,0,0,0.9)]">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-sm border-2 border-[#b89552] bg-[#221309] text-[#f4d99c] font-serif text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] shadow-md mb-1">
            <span className="text-[#d4af37]">⚜️</span>
            <span>C. a k. Mimořádný věstník pro potírání vampýrismu v Království českém · L. P. 1899</span>
            <span className="text-[#d4af37]">⚜️</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-black tracking-wider text-[#fae094] drop-shadow-[0_4px_16px_rgba(212,175,55,0.65)] my-0 leading-tight">
            🧄 LOVEC UPÍRŮ
          </h1>

          <p className="text-[11px] sm:text-xs text-[#f5eedb] font-serif font-medium italic max-w-2xl leading-snug mt-0.5">
            „Povolení c. k. místodržitelství: Česnek ze Znojma, kůly z dubového jádra a 9 prověřených bijců proti Hraběti von Nochtic!“
          </p>
        </div>
      </header>

      {/* 3. HLAVNÍ OBSAH: MASTER-DETAIL HERO SHOWCASE */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-2 flex flex-col justify-between gap-2.5">
        
        {/* HORNÍ LIŠTA: VÝBĚR LOVCE (9 HRDINŮ V PŘEHLEDNÉM PÁSU S HOTKEY [1-9]) */}
        <section aria-label="Výběr hrdiny" className="w-full">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[#d4af37] text-sm">📜</span>
              <h2 className="text-xs sm:text-sm uppercase tracking-wider text-[#fae094] font-serif font-black flex items-center gap-1.5">
                <span>C. k. Kmenový registr lovců: Zvol svého bijce</span>
                <span className="text-[11px] text-[#e8c878] font-mono font-bold">
                  (Klávesy 1–9)
                </span>
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#ebd8a7] font-mono font-bold">
              <span className="bg-[#2a170d] border border-[#8b6534] px-1.5 py-0.5 rounded text-[#fae094]">
                [1–9] Výběr bijce
              </span>
              <span>·</span>
              <span className="bg-[#2a170d] border border-[#8b6534] px-1.5 py-0.5 rounded text-[#fae094]">
                [R] Nový expediční spis
              </span>
              <span>·</span>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="bg-[#2a170d] hover:bg-[#3b2012] border border-[#8b6534] hover:border-[#d4af37] px-1.5 py-0.5 rounded text-[#fae094] cursor-pointer transition-colors"
                title="Přepnout celou obrazovku (Klávesa F)"
              >
                [F] {isFullscreen ? "Okno" : "Celá obrazovka"}
              </button>
              <span>·</span>
              <span className="bg-[#d4af37] text-[#1c1208] font-black px-1.5 py-0.5 rounded shadow-sm">
                [ENTER] K výpravě
              </span>
            </div>
          </div>

          {/* Roster 9 karet: 9-sloupcový na desktopu, stylizovaný jako kabinetní fotografie s kolkem */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 sm:gap-2">
            {HUNTER_KEYS.map((hKey, index) => {
              const hunter = HUNTERS_DATA[hKey];
              const isSelected = hunter.id === selectedId;

              return (
                <button
                  key={hunter.id}
                  data-hunter-id={hunter.id}
                  type="button"
                  onClick={() => handleSelectHunter(hunter.id)}
                  className={`group relative px-1 py-1 sm:px-1.5 sm:py-1.5 rounded-lg border-2 transition-all duration-150 flex flex-col items-center justify-between cursor-pointer overflow-hidden ${
                    isSelected
                      ? "border-[#d4af37] bg-gradient-to-b from-[#f9f2e3] via-[#f1e4c7] to-[#e4d1aa] shadow-[0_0_18px_rgba(212,175,55,0.7),2px_3px_0_#1c1208] ring-2 ring-[#d4af37] scale-[1.03] z-20 text-[#25150a]"
                      : "border-[#523722] bg-gradient-to-b from-[#22140c] via-[#1a0e08] to-[#120905] hover:border-[#b89552] hover:bg-[#2c190f] text-[#ded2be] hover:text-[#fffbeb]"
                  }`}
                >
                  {/* Číslo v kroužku / c. k. evidenční známka [1-9] */}
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-black border z-10 ${
                      isSelected
                        ? "bg-[#87201c] text-[#fffbeb] border-[#4a0d0b] shadow-sm"
                        : "bg-[#1d1209] text-[#d4af37] border-[#6b4724]"
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Portrétní miniatura v kabinetním rámečku */}
                  <div className="relative w-full h-20 sm:h-24 flex items-end justify-center mb-0.5 overflow-hidden">
                    <img
                      src={hunter.portraitUrl}
                      alt={hunter.name}
                      className={`h-full w-full object-contain object-bottom drop-shadow-[0_0_2px_rgba(255,255,255,0.7)] drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)] transition-transform duration-150 ${
                        isSelected ? "scale-110" : "scale-105 group-hover:scale-110 opacity-95 group-hover:opacity-100"
                      }`}
                    />
                  </div>

                  {/* Jméno */}
                  <span
                    className={`text-[11px] sm:text-xs font-serif font-black truncate max-w-full text-center leading-tight ${
                      isSelected ? "text-[#3c1e0e]" : "text-[#f5ebd7] group-hover:text-[#fae094]"
                    }`}
                  >
                    {hunter.shortName}
                  </span>

                  {/* Miniaturní statistiky s patkovým a pečetním nádechem */}
                  <div className="flex items-center gap-1 text-[9px] font-mono font-bold mt-0.5">
                    <span className={isSelected ? "text-[#991b1b]" : "text-red-300"}>{hunter.maxHp} HP</span>
                    <span className={isSelected ? "text-[#8b6f4e]" : "text-stone-500"}>·</span>
                    <span className={isSelected ? "text-[#1e40af]" : "text-blue-300"}>🛡️{hunter.defense}</span>
                    {hunter.armor && hunter.armor > 0 ? (
                      <>
                        <span className={isSelected ? "text-[#8b6f4e]" : "text-stone-500"}>·</span>
                        <span className={isSelected ? "text-[#166534]" : "text-emerald-400"}>🦺{hunter.armor}</span>
                      </>
                    ) : null}
                    <span className={isSelected ? "text-[#8b6f4e]" : "text-stone-500"}>·</span>
                    <span className={isSelected ? "text-[#b45309]" : "text-amber-400"}>💢{hunter.fury}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* GRAND SHOWCASE: VELKÝ HRDINA NA LEVÉM PODSTAVCI BEZ PLÝTVÁNÍ MÍSTEM + TAKTICKÝ DOSSIER VPRAVO */}
        <section className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch">
          
          {/* LEVÝ SLOUPEC: C. a k. ÚŘEDNÍ KMENOVÝ LIST BIJCE */}
          <div
            className={`lg:col-span-4 rounded-xl border-2 p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 overflow-hidden relative shadow-2xl ${activeHunter.heraldicBorder} bg-gradient-to-b from-[#26150c] via-[#1a0d07] to-[#100704]`}
          >
            {/* Ozdobné rohové kování */}
            <div className="absolute top-1.5 left-2 text-xs text-[#d4af37] font-serif pointer-events-none">
              ❖
            </div>
            <div className="absolute top-1.5 right-2 text-xs text-[#d4af37] font-serif pointer-events-none">
              ❖
            </div>

            {/* Horní hlavička hrdiny: Jméno, role, pivní známka */}
            <div>
              <div className="flex items-center justify-between text-xs font-serif font-bold uppercase tracking-wider text-[#fae094] mb-0.5 px-2">
                <span className="truncate">{activeHunter.role}</span>
                <span className="text-[10px] font-mono font-bold text-[#fae094] bg-[#3b1e0f] px-2 py-0.5 rounded border border-[#8b6534] whitespace-nowrap ml-1 shadow-sm">
                  🍺 {activeHunter.beerBadge}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#fff4d6] tracking-wide leading-tight drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)]">
                {activeHunter.name}
              </h3>
              <div className="text-xs text-[#ebd8a7] font-serif font-bold italic">
                „{activeHunter.epithet}“
              </div>

              {/* Interaktivní stat pills (Hover + Kliknutí) jako úřední pečetě */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <button
                  type="button"
                  data-smart-info="stat:hp"
                  onMouseEnter={(e) => handleSmartHover("stat:hp", e)}
                  onMouseLeave={handleSmartLeave}
                  onClick={(e) => handleSmartClick("stat:hp", e)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-md cursor-pointer transition-all ${
                    inspectedKey === "stat:hp"
                      ? "border-[#fae094] bg-[#991b1b] text-white ring-2 ring-[#fae094] scale-105"
                      : "border-[#7f1d1d] bg-[#450a0a] hover:border-[#fae094] text-red-100"
                  }`}
                >
                  <Heart className="w-3 h-3 fill-red-500 text-red-300" />
                  <span>{activeHunter.maxHp} Životů (HP)</span>
                </button>

                <button
                  type="button"
                  data-smart-info="stat:defense"
                  onMouseEnter={(e) => handleSmartHover("stat:defense", e)}
                  onMouseLeave={handleSmartLeave}
                  onClick={(e) => handleSmartClick("stat:defense", e)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-md cursor-pointer transition-all ${
                    inspectedKey === "stat:defense"
                      ? "border-[#fae094] bg-[#1e40af] text-white ring-2 ring-[#fae094] scale-105"
                      : "border-[#1e3a8a] bg-[#0c214d] hover:border-[#fae094] text-blue-100"
                  }`}
                >
                  <Shield className="w-3 h-3 fill-blue-500 text-blue-300" />
                  <span>{activeHunter.defense} Základní obrana</span>
                </button>

                <button
                  type="button"
                  data-smart-info="stat:fury"
                  onMouseEnter={(e) => handleSmartHover("stat:fury", e)}
                  onMouseLeave={handleSmartLeave}
                  onClick={(e) => handleSmartClick("stat:fury", e)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-md cursor-pointer transition-all ${
                    inspectedKey === "stat:fury"
                      ? "border-[#fae094] bg-[#c2410c] text-white ring-2 ring-[#fae094] scale-105"
                      : "border-[#9a3412] bg-[#431407] hover:border-[#fae094] text-orange-100"
                  }`}
                >
                  <span>💢 +{activeHunter.fury} % Rozlícení</span>
                </button>

                {activeHunter.armor && activeHunter.armor > 0 ? (
                  <button
                    type="button"
                    data-smart-info="stat:armor"
                    onMouseEnter={(e) => handleSmartHover("stat:armor", e)}
                    onMouseLeave={handleSmartLeave}
                    onClick={(e) => handleSmartClick("stat:armor", e)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-md cursor-pointer transition-all ${
                      inspectedKey === "stat:armor"
                        ? "border-[#fae094] bg-[#15803d] text-white ring-2 ring-[#fae094] scale-105"
                        : "border-[#166534] bg-[#052e16] hover:border-[#fae094] text-emerald-100"
                    }`}
                  >
                    <span>🦺 {activeHunter.armor} Brnění</span>
                  </button>
                ) : null}

                {activeHunter.backstabBonus && activeHunter.backstabBonus > 50 ? (
                  <button
                    type="button"
                    data-smart-info="stat:backstab"
                    onMouseEnter={(e) => handleSmartHover("stat:backstab", e)}
                    onMouseLeave={handleSmartLeave}
                    onClick={(e) => handleSmartClick("stat:backstab", e)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-md cursor-pointer transition-all ${
                      inspectedKey === "stat:backstab"
                        ? "border-[#fae094] bg-[#6b21a8] text-white ring-2 ring-[#fae094] scale-105"
                        : "border-[#581c87] bg-[#2e1065] hover:border-[#fae094] text-purple-100"
                    }`}
                  >
                    <span>🗡️ +{activeHunter.backstabBonus} % Zákeřný úder</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  data-smart-info="stat:persistence"
                  onMouseEnter={(e) => handleSmartHover("stat:persistence", e)}
                  onMouseLeave={handleSmartLeave}
                  onClick={(e) => handleSmartClick("stat:persistence", e)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-black shadow-md cursor-pointer transition-all ${
                    inspectedKey === "stat:persistence"
                      ? "border-[#fae094] bg-[#3f3f46] text-white ring-2 ring-[#fae094] scale-105"
                      : "border-[#52525b] bg-[#18181b] hover:border-[#fae094] text-zinc-100"
                  }`}
                >
                  <span>🪦 {activeHunter.persistence ?? 5} Verva</span>
                </button>
              </div>
            </div>

            {/* STŘEDOVÁ SCÉNA: KABINETNÍ PORTRÉT NA KAMENNÉM PODSTAVCI */}
            <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] lg:min-h-[340px] w-full rounded-lg border-2 border-[#523722] bg-gradient-to-b from-[#180f08] via-[#100804] to-[#070302] flex items-center justify-center p-1 overflow-hidden shadow-inner">
              {/* Atmosférické světlo za postavou */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(212,175,55,0.28),transparent_72%)] pointer-events-none" />
              
              {/* Kamenný podstavec a stín */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-48 sm:w-56 h-3.5 rounded-full bg-black/90 blur-[3px] pointer-events-none" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-44 sm:w-52 h-1.5 rounded-full bg-[#d4af37]/25 blur-[1px] pointer-events-none" />

              {!failedImages[activeHunter.id] ? (
                <img
                  src={activeHunter.portraitUrl}
                  alt={activeHunter.name}
                  className="relative z-10 h-full w-full max-h-[370px] object-contain object-center scale-[1.06] drop-shadow-[0_0_3px_rgba(255,255,255,0.75)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.98)] transition-transform duration-200"
                  onError={() => {
                    setFailedImages((prev) => ({
                      ...prev,
                      [activeHunter.id]: true,
                    }));
                  }}
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <span className="text-7xl drop-shadow-md">{activeHunter.icon}</span>
                </div>
              )}
            </div>

            {/* Citát hrdiny ve stylových uvozovkách */}
            <blockquote className="px-1 text-center text-xs text-[#f5ebd7] font-serif font-medium italic leading-snug border-t border-[#6b4724]/60 pt-1.5">
              {activeHunter.quote}
            </blockquote>
          </div>

          {/* PRAVÝ SLOUPEC: TAKTICKÝ DOSSIER, SCHOPNOSTI, DECK & EXPEDIČNÍ CTA */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-2 sm:gap-3">
            
            {/* Taktická karta schopností a arzenálu */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[#8b6534] bg-gradient-to-b from-[#26150c] via-[#1b0e08] to-[#120804] shadow-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#523722] pb-2">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-[#fae094]">
                  <Zap className="w-4 h-4 text-[#d4af37]" />
                  <span>C. k. Taktický spis & Bojový styl</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#ebd8a7]/80 font-mono flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#d4af37]" />
                    <span>Najeď myší nebo rozklikni položku</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#fae094] bg-[#331c0e] px-2 py-0.5 rounded border border-[#8b6534]">
                    {activeHunter.tag}
                  </span>
                </div>
              </div>

              {/* 0. Pasivní signatura */}
              {activeHunter.passiveName && (
                <div
                  role="button"
                  tabIndex={0}
                  data-smart-info="ability:passive"
                  onMouseEnter={(e) => handleSmartHover("ability:passive", e)}
                  onMouseLeave={handleSmartLeave}
                  onClick={(e) => handleSmartClick("ability:passive", e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSmartClick("ability:passive", e as unknown as React.MouseEvent);
                    }
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl bg-stone-950/90 border shadow-sm flex items-start justify-between gap-2 cursor-pointer transition-all ${
                    inspectedKey === "ability:passive"
                      ? "border-amber-400 ring-2 ring-amber-400/80 bg-[#22120c]"
                      : "border-rose-900/50 hover:border-rose-500/80 hover:bg-stone-900/90"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-rose-950 border border-rose-700 text-rose-300 mt-0.5 shrink-0 text-sm">
                      ✨
                    </div>
                    <div>
                      <div className="text-xs font-serif font-black text-rose-300 flex items-center gap-1.5">
                        <span>Pasivní signatura: {activeHunter.passiveName}</span>
                      </div>
                      <div className="text-xs text-stone-200 leading-snug">
                        {activeHunter.passiveDesc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-rose-300/80 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60 shrink-0">
                    {inspectedKey === "ability:passive" ? "▼ Detail" : "🔍 Info"}
                  </span>
                </div>
              )}

              {/* 2. Krok do nepřítele (Bump manévr) */}
              <div
                role="button"
                tabIndex={0}
                data-smart-info="ability:bump"
                onMouseEnter={(e) => handleSmartHover("ability:bump", e)}
                onMouseLeave={handleSmartLeave}
                onClick={(e) => handleSmartClick("ability:bump", e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSmartClick("ability:bump", e as unknown as React.MouseEvent);
                  }
                }}
                className={`p-2 sm:p-2.5 rounded-xl bg-stone-950/90 border shadow-sm flex items-start justify-between gap-2 cursor-pointer transition-all ${
                  inspectedKey === "ability:bump"
                    ? "border-amber-400 ring-2 ring-amber-400/80 bg-[#22120c]"
                    : "border-stone-800 hover:border-amber-500/80 hover:bg-stone-900/90"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-amber-950 border border-amber-700 text-amber-400 mt-0.5 shrink-0 text-sm">
                    💥
                  </div>
                  <div>
                    <div className="text-xs font-serif font-black text-amber-300">
                      Krok do nepřítele: {activeHunter.bumpName}
                    </div>
                    <div className="text-xs text-stone-200 leading-snug">
                      {activeHunter.bumpDesc}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 shrink-0">
                  {inspectedKey === "ability:bump" ? "▼ Detail" : "🔍 Info"}
                </span>
              </div>

              {/* 3. 3-Kombo finišer */}
              <div
                role="button"
                tabIndex={0}
                data-smart-info="ability:combo"
                onMouseEnter={(e) => handleSmartHover("ability:combo", e)}
                onMouseLeave={handleSmartLeave}
                onClick={(e) => handleSmartClick("ability:combo", e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSmartClick("ability:combo", e as unknown as React.MouseEvent);
                  }
                }}
                className={`p-2 sm:p-2.5 rounded-xl bg-stone-950/90 border shadow-sm flex items-start justify-between gap-2 cursor-pointer transition-all ${
                  inspectedKey === "ability:combo"
                    ? "border-amber-400 ring-2 ring-amber-400/80 bg-[#22120c]"
                    : "border-stone-800 hover:border-sky-500/80 hover:bg-stone-900/90"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-sky-950 border border-sky-700 text-sky-400 mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-serif font-black text-sky-300">
                      3-Kombo Finišer: {activeHunter.comboName}
                    </div>
                    <div className="text-xs text-stone-200 leading-snug">
                      {activeHunter.comboDesc}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-sky-300/80 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60 shrink-0">
                  {inspectedKey === "ability:combo" ? "▼ Detail" : "🔍 Info"}
                </span>
              </div>

              {/* 4. Startovní destičky */}
              <div className="pt-1">
                <div className="text-xs font-serif font-black uppercase tracking-wider text-amber-300 mb-1.5 flex items-center justify-between">
                  <span>Startovní destičky ({activeStarterTiles.length}):</span>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                    {activeHunter.signatureWeapon}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {activeStarterTiles.map((tile, tIdx) => {
                    const tileKey = `tile:${tIdx}` as InspectKey;
                    const isTileSelected = inspectedKey === tileKey;
                    return (
                      <div
                        key={`${tile?.id || tIdx}_${tIdx}`}
                        role="button"
                        tabIndex={0}
                        data-smart-info={tileKey}
                        onMouseEnter={(e) => handleSmartHover(tileKey, e)}
                        onMouseLeave={handleSmartLeave}
                        onClick={(e) => handleSmartClick(tileKey, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSmartClick(tileKey, e as unknown as React.MouseEvent);
                          }
                        }}
                        className={`p-2 rounded-xl bg-stone-950 border flex flex-col justify-between shadow-sm cursor-pointer transition-all ${
                          isTileSelected
                            ? "border-amber-400 ring-2 ring-amber-400/80 bg-[#22120c]"
                            : "border-stone-800 hover:border-amber-500/80 hover:bg-stone-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-white truncate">
                            {tile?.name}
                          </span>
                          <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                            <span className="text-red-300 font-black bg-red-950/80 px-1 rounded border border-red-800">
                              {tile?.dmg
                                ? `⚔️ ${tile.dmg}`
                                : tile?.shieldAmount
                                ? `🛡️ +${tile.shieldAmount}`
                                : tile?.healAmount
                                ? `❤️ +${tile.healAmount}`
                                : tile?.type === "move"
                                ? "🏃 Pohyb"
                                : "✨ Efekt"}
                            </span>
                            <span className="text-amber-300 font-bold bg-amber-950/80 px-1 rounded border border-amber-800">
                              ⏳ {tile?.cooldown}t
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-300 leading-tight line-clamp-2">
                          {tile?.description}
                        </p>
                        <div className="mt-1.5 pt-1 border-t border-stone-800/80 flex items-center justify-between text-[9px] font-mono text-amber-300/90">
                          <span>📏 {formatTileRangeLabel(tile)}</span>
                          <span className="text-amber-400 font-bold">
                            {isTileSelected ? "▼ Detail & Vylepšení" : "🔍 Rozklikni"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. ROZKLIKNUTÝ CHYTRÝ DETAIL (Zobrazí se po kliknutí na libovolný stat, schopnost nebo destičku) */}
              {activeInspectData && (
                <div className="mt-2 p-3 rounded-xl border-2 border-amber-500/90 bg-gradient-to-b from-[#26150c] via-[#1b0f09] to-[#120a06] shadow-[0_0_25px_rgba(245,158,11,0.3)] space-y-2 animate-fadeIn">
                  <div className="flex items-start justify-between gap-2 border-b border-amber-800/50 pb-1.5">
                    <div>
                      <div className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400">
                        {activeInspectData.category}
                      </div>
                      <h4 className="text-sm sm:text-base font-serif font-black text-amber-100 flex items-center gap-1.5">
                        <span>{activeInspectData.icon}</span>
                        <span>{activeInspectData.title}</span>
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedKey(null)}
                      className="px-2 py-0.5 rounded border border-amber-700 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      title="Zavřít detail"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Zavřít</span>
                    </button>
                  </div>

                  {/* Přehledové štítky */}
                  <div className="flex flex-wrap gap-1.5">
                    {activeInspectData.badges.map((b, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700/80 text-[11px] font-mono font-bold text-amber-200"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Přesná mechanika */}
                  <div className="text-xs text-stone-100 leading-relaxed bg-black/40 p-2 rounded-lg border border-stone-800">
                    <strong className="text-amber-300 font-serif">⚙️ Jak to funguje: </strong>
                    {activeInspectData.mechanics}
                  </div>

                  {/* Taktický tip a synergie */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-100 leading-snug">
                      <strong className="text-emerald-300 font-serif block mb-0.5">
                        💡 Taktický tip pro {activeHunter.shortName}:
                      </strong>
                      {activeInspectData.tacticalTip}
                    </div>
                    <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-800/60 text-sky-100 leading-snug">
                      <strong className="text-sky-300 font-serif block mb-0.5">
                        🔗 Synergie & Pokročilé pravidlo:
                      </strong>
                      {activeInspectData.synergy}
                    </div>
                  </div>

                  {/* Kovářská vylepšení (pokud jde o destičku) */}
                  {activeInspectData.upgrades && activeInspectData.upgrades.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[11px] font-serif font-black uppercase tracking-wider text-amber-300 mb-1">
                        ⚒️ Kovářská vylepšení této destičky v dílně:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {activeInspectData.upgrades.map((u) => (
                          <div
                            key={u.level}
                            className="p-2 rounded-lg bg-stone-950/95 border border-amber-800/60 text-xs"
                          >
                            <div className="flex items-center justify-between gap-1 font-bold text-amber-200 mb-0.5">
                              <span>
                                Úroveň {u.level}: {u.name}
                              </span>
                              <span className="font-mono text-[10px] text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
                                {u.badge} · ⏳ {u.cooldown}t
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-300 leading-snug">
                              {u.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeInspectData.flavor && (
                    <div className="text-[11px] italic text-amber-200/80 font-serif pt-0.5">
                      {activeInspectData.flavor}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* C. a k. EXPEDIČNÍ REGISTRAČNÍ STANICE SE SEEDEM A PEČETNÍM TLAČÍTKEM */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[#b89552] bg-gradient-to-r from-[#28150c] via-[#351c10] to-[#28150c] shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Zadání seedu */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#fae094] font-serif text-xs font-black uppercase tracking-wider">
                  <ScrollText className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Č. j. výpravy (Expediční seed):</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    id="expedition-seed-input"
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLaunch();
                      }
                    }}
                    className="w-36 sm:w-44 px-3 py-1.5 bg-[#140b06] border-2 border-[#b89552] rounded-lg text-xs font-mono font-black text-[#fae094] tracking-wider focus:outline-none focus:border-[#fae094] transition-colors uppercase shadow-inner"
                    placeholder="CESNEK-1899"
                    title="Sem můžete zadat libovolný expediční seed"
                  />
                  <button
                    type="button"
                    onClick={handleRandomSeed}
                    className="px-2.5 py-1.5 rounded-lg border-2 border-[#8b6534] bg-[#221209] hover:bg-[#381e0f] text-[#fae094] hover:text-[#fffbeb] text-xs font-serif font-black transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    title="Vygenerovat náhodný tematický seed (Klávesa R)"
                  >
                    <Dice5 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>[R] Spis</span>
                  </button>
                </div>
              </div>

              {/* Tlačítko startu výpravy - C. k. císařská pečeť */}
              <button
                type="button"
                onClick={handleLaunch}
                className="group px-6 sm:px-8 py-3 rounded-xl border-2 border-[#fae094] bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fbbf24] active:scale-[0.98] text-[#1a0e07] font-serif font-black text-base sm:text-lg tracking-wider shadow-[0_0_26px_rgba(217,119,6,0.7),2px_3px_0_#120803] flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-150 shrink-0"
              >
                <Swords className="w-5 h-5 text-[#1a0e07] group-hover:rotate-12 transition-transform shrink-0" />
                <span>VYRAZIT NA NOCHTICE</span>
                <span className="text-[11px] font-mono font-black text-[#1a0e07] bg-[#fef08a] px-2 py-0.5 rounded border border-[#b45309]">
                  ENTER
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 4. C. k. HOSPODSKÁ A CECHOVNÍ LIŠTA: PRAVIDLA, ARCHIV, ZVUK */}
      <footer className="relative z-10 w-full py-1.5 px-3 sm:px-6 border-t-2 border-[#523722] bg-gradient-to-r from-[#1a0e08] via-[#24130a] to-[#1a0e08]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 sm:gap-6 font-serif">
            <button
              type="button"
              onClick={onOpenRules}
              className="text-[#ebd8a7] hover:text-[#fffbeb] underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span>C. k. Vyhláška a pravidla cechu</span>
            </button>
            <button
              type="button"
              onClick={onOpenArchive}
              className="text-[#ebd8a7] hover:text-[#fffbeb] underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Castle className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span>Zemský archiv & Trofeje</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-animation-lab"))}
              className="text-[#ebd8a7] hover:text-[#fffbeb] underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Clapperboard className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span>Animační laboratoř</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="px-2.5 py-0.5 rounded-md border-2 border-[#8b6534] bg-[#221209] hover:bg-[#381e0f] hover:border-[#d4af37] text-[#fae094] hover:text-[#fffbeb] transition-colors cursor-pointer text-xs font-serif font-black flex items-center gap-1.5 shadow-sm"
              title="Přepnout celou obrazovku (Klávesa F)"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>[F] Okno</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>[F] Celá obrazovka</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
                try {
                  if (next) SFX.turn?.();
                } catch {
                  // ignore
                }
              }}
              className="px-2.5 py-0.5 rounded-md border-2 border-[#8b6534] bg-[#221209] hover:border-[#d4af37] text-[#fae094] hover:text-[#fffbeb] transition-colors cursor-pointer text-xs font-serif font-black flex items-center gap-1.5 shadow-sm"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>Muzika: Hraje</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>Muzika: Ticho</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}