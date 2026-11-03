import React, { useState, useEffect, useCallback } from "react";
import { getHeroTileDefinition } from "@/game/config/tiles.js";
import { SFX, setSoundEnabled } from "@/game/ui/audio.js";
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
  CheckCircle2,
  Zap,
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
  icon: string;
  heraldicColor: string;
  heraldicBorder: string;
  portraitUrl: string;
  quote: string;
  signatureWeapon: string;
  bumpName: string;
  bumpDesc: string;
  comboName: string;
  comboDesc: string;
  deck: Array<{ id: string; upgradeLevel?: number }>;
}

const HUNTERS_DATA: Record<string, HunterDeed> = {
  classic: {
    id: "classic",
    shortName: "Štamgast Venca",
    name: "Štamgast Venca Česnek",
    epithet: "Dub a česnek",
    role: "Hospodský lidový bijec",
    tag: "Vyvážený taktik · Odhazování & Dým",
    beerBadge: "Paličák 12°",
    maxHp: 20,
    defense: 1,
    icon: "🧄",
    heraldicColor: "from-emerald-950 via-stone-900 to-amber-950",
    heraldicBorder: "border-emerald-500",
    portraitUrl: HUNTER_PORTRAITS.classic,
    quote: "„Kdo se bojí upíra, ať do krku česnek vráží a stříkačku maže!“",
    signatureWeapon: "Dubový kolík & Svěcená hasičská stříkačka",
    bumpName: "Česnekové žduchnutí",
    bumpDesc:
      "Krok do nepřítele: Odhodí cíl o 1 pole a zanechá Česnekový oblak (Chladnutí 3). V dýmu je otočení čelem vzad ZDARMA!",
    comboName: "Česneková aura",
    comboDesc:
      "3-kombo: Získá +4 Štít a omámí okolní upíry (Zmatení — vrávorají náhodným směrem).",
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
    epithet: "Selský silák",
    role: "Selská síla & husitský cep",
    tag: "Drtivá síla · Kolize & Beraní průraz",
    beerBadge: "Selský ležák",
    maxHp: 20,
    defense: 0,
    icon: "🥖",
    heraldicColor: "from-amber-950 via-stone-900 to-yellow-950",
    heraldicBorder: "border-amber-500",
    portraitUrl: HUNTER_PORTRAITS.honza,
    quote: "„Babička napekla povidlové buchty a děda okoval cep. Jde se na pány z krypty!“",
    signatureWeapon: "Okovaný husitský cep & Pekáč povidlových buchet",
    bumpName: "Selský beran",
    bumpDesc:
      "Krok do nepřítele: Odhodí cíl, sám obsadí jeho pole a způsobí mu 2 drtivé DMG (Chladnutí 3)!",
    comboName: "Selský hněv",
    comboDesc:
      "3-kombo: Získá +6 Štít a mocná rázová vlna zasáhne všechny okolní nepřátele za 4 DMG.",
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
    tag: "Vysoké zdraví (24 HP) · Kartáčová salva & Pevný kryt",
    beerBadge: "C. k. speciál",
    maxHp: 24,
    defense: 2,
    icon: "⚔️",
    heraldicColor: "from-blue-950 via-stone-900 to-slate-950",
    heraldicBorder: "border-blue-400",
    portraitUrl: HUNTER_PORTRAITS.dragoun,
    quote: "„Dle c. k. polního řádu § 14 se na noční havěť tasí šavle bez úředního vyzvání!“",
    signatureWeapon: "Důstojnická šavle vzor 1877 & Armádní revolver Gasser",
    bumpName: "Úder těžkým jílcem",
    bumpDesc:
      "Krok do nepřítele: Praští ho mosazným jílcem za 2 DMG, odhodí ho a na 1 tah omráčí (Chladnutí 3).",
    comboName: "Kavaleristická salva",
    comboDesc:
      "3-kombo: Vypálí kartáčovou salvu (4 DMG všem v linii pohledu) a zkrátí Chladnutí všech destiček o 1.",
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
    icon: "🗡️",
    heraldicColor: "from-purple-950 via-stone-900 to-rose-950",
    heraldicBorder: "border-purple-400",
    portraitUrl: HUNTER_PORTRAITS.zlodejka,
    quote: "„Co upír v noci neuhlídá, to pražská chasa do rána zpeněží a propije.“",
    signatureWeapon: "Italské stiletto & Křemenné střepy z Malé Strany",
    bumpName: "Kapsářská záměna",
    bumpDesc:
      "Krok do nepřítele: Prohodí si s ním pozici a otočí ho zády k sobě (Chladnutí 2) pro okamžitý úder do zad!",
    comboName: "Pavučinový únik",
    comboDesc:
      "3-kombo: Získá +4 Štít a okamžitě obnoví připravenost manévru Kapsářské záměny.",
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
    tag: "Silný & Pomalý (26 HP) · Dvoupolíčkový dosah halapartny",
    beerBadge: "Půlnoční ležák 13°",
    maxHp: 26,
    defense: 2,
    icon: "🏮",
    heraldicColor: "from-indigo-950 via-stone-900 to-slate-950",
    heraldicBorder: "border-indigo-400",
    portraitUrl: HUNTER_PORTRAITS.ponocny,
    quote: "„Chval každý duch Hospodina! A vy upíři táhněte spát, nebo vás vezmu halapartnou přes hnáty!“",
    signatureWeapon: "Kovaná dvoubřitá halapartna & Půlnoční mosazný roh",
    bumpName: "Zarazení ratištěm",
    bumpDesc:
      "Krok do nepřítele: Vrazí do nepřítele těžké ratiště za 3 DMG, odhodí ho o 1 pole a na 1 tah omráčí (Chladnutí 4)!",
    comboName: "Půlnoční vartování",
    comboDesc:
      "3-kombo: Získá +6 Štít, odtroubí půlnoc a zasáhne obě pole před sebou za 5 DMG.",
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
    role: "Cirkusová síla & litinová břemena",
    tag: "Vysoká síla (22 HP) · Vrhání závaží · Přehoz",
    beerBadge: "Cirkusový ležák",
    maxHp: 22,
    defense: 1,
    icon: "🏋️",
    heraldicColor: "from-red-950 via-stone-900 to-amber-950",
    heraldicBorder: "border-red-500",
    portraitUrl: HUNTER_PORTRAITS.silak,
    quote: "„Podkovu zlomím dvěma prsty, panáčku. Zlomení upíří páteře je jen lehká rozcvička!“",
    signatureWeapon: "Dvousférická litinová činka & Kované závaží",
    bumpName: "Cirkusový přehoz",
    bumpDesc:
      "Krok do nepřítele: Praští s nepřítelem o zem za 3 DMG a odhodí ho o 2 pole vzad (Chladnutí 3)!",
    comboName: "Litinové finále",
    comboDesc:
      "3-kombo: Získá +5 Štít a vrhne obří činku na prvního nepřítele v linii pohledu za 6 DMG + omráčení.",
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
    tag: "Vysoká Obrana (2) · Horký Earl Grey · Bodnutí ze zálohy",
    beerBadge: "Imperial Stout 18°",
    maxHp: 18,
    defense: 2,
    icon: "🫖",
    heraldicColor: "from-slate-950 via-stone-900 to-emerald-950",
    heraldicBorder: "border-slate-400",
    portraitUrl: HUNTER_PORTRAITS.anglicanka,
    quote: "„Upíři jsou nanejvýš nevychovaná stvoření. Čaj o páté ignorují docela!“",
    signatureWeapon: "Stříbrem kovaný slunečník & Porcelánová konvice",
    bumpName: "Čas na čaj, milady!",
    bumpDesc:
      "Krok do nepřítele: V obláčku prachu se na místě nepřítele zhmotní komorník (nesmrtelný živý štít na 2 kola), posune nepřítele o 1 pole vzad a pak jej odkopne o další 2 pole. Nepřítel i cíl srážky získají Zmatení (❓). Nelze použít bez volného pole za nepřítelem (Chladnutí 3).",
    comboName: "Čaj o páté",
    comboDesc:
      "3-kombo: Vychutná si doušek čaje (+4 HP, +4 Štít) a vařící čaj opaří všechny nepřátele v linii za 3 DMG.",
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
    tag: "Dálkový útok (18 HP) · Rotační opakovací kuše · Balistická salva",
    beerBadge: "Oktogonální ležák 14°",
    maxHp: 18,
    defense: 1,
    icon: "🏹",
    heraldicColor: "from-stone-950 via-zinc-900 to-amber-950",
    heraldicBorder: "border-stone-400",
    portraitUrl: HUNTER_PORTRAITS.helsing,
    quote: "„Tito čeští vampýři jsou poněkud pomalejší než bengálský tygr, ale zuby mají úctyhodné!“",
    signatureWeapon: "Gatlingova rotační kuše vz. 1888 & Rumpálový napínák",
    bumpName: "Úder pažbou kuše",
    bumpDesc:
      "Krok do nepřítele: Udeří nepřítele okovanou pažbou za 2 DMG a odhodí ho o 1 pole vzad (Chladnutí 2).",
    comboName: "Kruhový rotační rozptyl",
    comboDesc:
      "3-kombo: Vypálí rotační salvu všemi směry: 4 DMG + Krvácení (2) všem nepřátelům v linii dohledu.",
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
    tag: "Vysoká odolnost (16 HP, 2 Obrana) · Úřední předvolání · Stav [OKOLKOVÁNO]",
    beerBadge: "Erární ležák 11°",
    maxHp: 16,
    defense: 2,
    icon: "📑",
    heraldicColor: "from-yellow-950 via-stone-900 to-amber-950",
    heraldicBorder: "border-amber-600",
    portraitUrl: HUNTER_PORTRAITS.revident,
    quote: "„Nemáte zaplacenou daň ze záhrobního pobytu! Předložte domovský list, nebo přistoupíme k exekuci!“",
    signatureWeapon: "Erární osikový kolík vz. 1884 & Mosazné razítko „ZAMÍTNUTO“",
    bumpName: "Třísknutí deskami spisů",
    bumpDesc:
      "Krok do nepřítele: Vrazí do nepřítele fasciklem za 1 DMG, odhodí ho o 1 pole a nalepí [OKOLKOVÁNO] (Chladnutí 2).",
    comboName: "Finanční exekuce",
    comboDesc:
      "3-kombo: Získá +3 Štít, nalepí [OKOLKOVÁNO] na všechny noční netvory a již okolkovaným udělí 3 DMG!",
    deck: [
      { id: "gov_stake_1884", upgradeLevel: 0 },
      { id: "brass_stamp_denied", upgradeLevel: 0 },
      { id: "rast_gasser_revolver", upgradeLevel: 0 },
      { id: "domicile_inspection", upgradeLevel: 0 },
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

  useEffect(() => {
    if (initialHunterId && HUNTERS_DATA[initialHunterId]) {
      setSelectedId(initialHunterId);
    }
  }, [initialHunterId]);

  const handleSelectHunter = (id: string) => {
    setSelectedId(id);
    try {
      SFX.swap?.();
    } catch {
      // Audio fallback
    }
  };

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
  }, [handleLaunch]);

  const activeHunter = HUNTERS_DATA[selectedId] || HUNTERS_DATA.classic;
  const activeStarterTiles = (activeHunter.deck || []).map((card) =>
    getHeroTileDefinition(card.id, card.upgradeLevel || 0)
  );

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

      {/* 2. Goticko-hospodské záhlaví */}
      <header className="relative z-10 w-full pt-2.5 pb-2 px-3 sm:px-6 border-b-2 border-[#542106] bg-gradient-to-b from-[#1c1009] via-[#160d07] to-[#100805] shadow-[0_6px_20px_rgba(0,0,0,0.85)]">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-amber-400 bg-amber-950/90 text-amber-200 font-serif text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-md mb-1">
            <span>🍺</span>
            <span>Hostinec „U Svěcené pípy“ & C. k. zbrojnice</span>
            <span>🧄</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-black tracking-wider text-amber-300 drop-shadow-[0_4px_16px_rgba(245,158,11,0.7)] my-0 leading-tight">
            🧄 LOVEC UPÍRŮ
          </h1>

          <p className="text-[11px] sm:text-xs text-amber-100 font-serif font-medium italic max-w-3xl leading-snug mt-0.5">
            „Pivo točené ze svěceného sudu · Česnek ze Znojma · Kůly z dubového jádra ·
            Rázné vyčištění sídla Hraběte von Nochtic léta Páně 1899!“
          </p>
        </div>
      </header>

      {/* 3. HLAVNÍ OBSAH: MASTER-DETAIL HERO SHOWCASE */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-2 flex flex-col justify-between gap-2.5">
        
        {/* HORNÍ LIŠTA: VÝBĚR LOVCE (9 HRDINŮ V PŘEHLEDNÉM PÁSU S HOTKEY [1-9]) */}
        <section aria-label="Výběr hrdiny" className="w-full">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-sm">⚜️</span>
              <h2 className="text-xs sm:text-sm uppercase tracking-wider text-amber-300 font-serif font-black flex items-center gap-1.5">
                <span>Síň lovců: Zvol svého bijce</span>
                <span className="text-[11px] text-amber-200 font-mono font-bold">
                  (Klávesy 1–9)
                </span>
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-amber-200 font-mono font-bold">
              <span className="bg-stone-900 border border-amber-800/80 px-1.5 py-0.5 rounded text-amber-300">
                [1–9] Výběr
              </span>
              <span>·</span>
              <span className="bg-stone-900 border border-amber-800/80 px-1.5 py-0.5 rounded text-amber-300">
                [R] Náhodný seed
              </span>
              <span>·</span>
              <span className="bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded">
                [ENTER] Bojovat
              </span>
            </div>
          </div>

          {/* Roster 9 karet: 9-sloupcový na desktopu, čisté mřížkování na tabletu/mobilu */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 sm:gap-2">
            {HUNTER_KEYS.map((hKey, idx) => {
              const hunter = HUNTERS_DATA[hKey];
              const isSelected = hunter.id === selectedId;

              return (
                <button
                  key={hunter.id}
                  data-hunter-id={hunter.id}
                  type="button"
                  onClick={() => handleSelectHunter(hunter.id)}
                  className={`group relative p-1.5 sm:p-2 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-between cursor-pointer overflow-hidden ${
                    isSelected
                      ? "border-amber-400 bg-gradient-to-b from-[#3a2012] via-[#24130b] to-[#160c07] shadow-[0_0_20px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/90 scale-[1.03] z-20"
                      : "border-stone-700 bg-gradient-to-b from-[#180f0a] via-[#120a06] to-[#0c0604] hover:border-amber-500 hover:bg-[#22140d] text-stone-300 hover:text-white"
                  }`}
                >
                  {/* Horní řádek: klávesa [idx+1] a aktivní fajfka */}
                  <div className="w-full flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-black px-1 py-0.2 rounded border ${
                        isSelected
                          ? "border-amber-400 bg-amber-950 text-amber-200"
                          : "border-stone-700 bg-stone-900 text-stone-400 group-hover:border-stone-500"
                      }`}
                    >
                      [{idx + 1}]
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 fill-amber-950" />
                    )}
                  </div>

                  {/* Portrétní miniatura */}
                  <div className="relative w-full h-14 sm:h-16 flex items-end justify-center mb-1">
                    <img
                      src={hunter.portraitUrl}
                      alt={hunter.name}
                      className={`h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_0_2px_rgba(255,255,255,0.7)] drop-shadow-[0_0_2px_rgba(255,255,255,0.7)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] transition-transform duration-150 ${
                        isSelected ? "scale-110" : "group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      }`}
                    />
                  </div>

                  {/* Jméno */}
                  <span
                    className={`text-[11px] sm:text-xs font-serif font-black truncate max-w-full text-center ${
                      isSelected ? "text-amber-200" : "text-stone-200 group-hover:text-amber-100"
                    }`}
                  >
                    {hunter.shortName}
                  </span>

                  {/* Miniaturní statistiky */}
                  <div className="flex items-center gap-1 text-[9px] font-mono font-bold mt-0.5">
                    <span className="text-red-300">{hunter.maxHp} HP</span>
                    <span className="text-stone-500">·</span>
                    <span className="text-blue-300">🛡️{hunter.defense}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* GRAND SHOWCASE: 2,5× VELKÝ HRDINA NA LEVÉM PODSTAVCI + TAKTICKÝ DOSSIER VPRAVO */}
        <section className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          
          {/* LEVÝ SLOUPEC: VITRÍNA AKTIVNÍHO LOVCE NA PODSTAVCI (2,5× větší, bez rohové ikony) */}
          <div
            className={`lg:col-span-5 rounded-2xl border-2 p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative shadow-2xl ${activeHunter.heraldicBorder} bg-gradient-to-b from-[#22130b] via-[#160c07] to-[#0e0704]`}
          >
            {/* Ozdobné rohové kování */}
            <div className="absolute top-2 left-2.5 text-xs text-amber-500 font-serif pointer-events-none">
              ❖
            </div>
            <div className="absolute top-2 right-2.5 text-xs text-amber-500 font-serif pointer-events-none">
              ❖
            </div>

            {/* Horní hlavička hrdiny: Jméno, role, pivní známka */}
            <div>
              <div className="flex items-center justify-between text-xs font-serif font-bold uppercase tracking-wider text-amber-400 mb-1">
                <span className="truncate">{activeHunter.role}</span>
                <span className="text-[11px] font-mono font-bold text-amber-200 bg-amber-950 px-2 py-0.5 rounded border border-amber-700 whitespace-nowrap ml-1 shadow-sm">
                  🍺 {activeHunter.beerBadge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-100 tracking-wide leading-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                {activeHunter.name}
              </h3>
              <div className="text-xs sm:text-sm text-amber-300 font-serif font-bold italic">
                „{activeHunter.epithet}“
              </div>

              {/* Velké stat pills */}
              <div className="flex items-center gap-2 mt-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-red-600 bg-red-950 text-red-100 text-xs font-black shadow-md">
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-300" />
                  <span>{activeHunter.maxHp} Životů (HP)</span>
                </div>
                <div
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-blue-600 bg-blue-950 text-blue-100 text-xs font-black shadow-md"
                  title={`Základní obrana ${activeHunter.defense}: dává +${activeHunter.defense} Štít na začátku každého tahu`}
                >
                  <Shield className="w-3.5 h-3.5 fill-blue-500 text-blue-300" />
                  <span>{activeHunter.defense} Základní obrana</span>
                </div>
              </div>
            </div>

            {/* STŘEDOVÁ SCÉNA: 2,5× VELIKÝ SPRITE NA SVĚTELNÉM PODSTAVCI (BEZ ROHOVÉHO SYMBOLU) */}
            <div className="relative my-2 sm:my-3 w-full h-64 sm:h-72 md:h-80 rounded-xl border border-stone-800/90 bg-gradient-to-b from-stone-950/80 via-black to-[#130b07] flex items-end justify-center px-4 pt-3 pb-2 overflow-hidden shadow-inner">
              {/* Atmosférické světlo za postavou */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(245,158,11,0.32),transparent_72%)] pointer-events-none" />
              
              {/* Kamenný podstavec a stín */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 sm:w-56 h-4 rounded-full bg-black/90 blur-[3px] pointer-events-none" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-44 sm:w-52 h-1.5 rounded-full bg-amber-500/25 blur-[1px] pointer-events-none" />

              {!failedImages[activeHunter.id] ? (
                <img
                  src={activeHunter.portraitUrl}
                  alt={activeHunter.name}
                  className="relative z-10 h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_0_3px_rgba(255,255,255,0.75)] drop-shadow-[0_0_3px_rgba(255,255,255,0.75)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.98)] transition-transform duration-200"
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
            <blockquote className="px-2 text-center text-xs sm:text-sm text-amber-100/90 font-serif font-medium italic leading-relaxed border-t border-amber-900/40 pt-2">
              {activeHunter.quote}
            </blockquote>
          </div>

          {/* PRAVÝ SLOUPEC: TAKTICKÝ DOSSIER, SCHOPNOSTI, DECK & EXPEDIČNÍ CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-2 sm:gap-3">
            
            {/* Taktická karta schopností a arzenálu */}
            <div className="p-3 sm:p-4 rounded-2xl border-2 border-stone-700 bg-gradient-to-b from-[#1a100a] via-[#140b07] to-[#0d0704] shadow-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Taktický spis & Bojový styl</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                  {activeHunter.tag}
                </span>
              </div>

              {/* 1. Podpisová zbraň */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 shadow-sm flex items-start gap-2">
                <div className="p-1 rounded bg-amber-950 border border-amber-700 text-amber-400 mt-0.5 shrink-0">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-serif font-black text-amber-200">
                    Podpisová zbraň & Arzenál
                  </div>
                  <div className="text-xs text-white font-medium">
                    {activeHunter.signatureWeapon}
                  </div>
                </div>
              </div>

              {/* 2. Krok do nepřítele (Bump manévr) */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 shadow-sm flex items-start gap-2">
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

              {/* 3. 3-Kombo finišer */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 shadow-sm flex items-start gap-2">
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

              {/* 4. Startovní destičky */}
              <div className="pt-1">
                <div className="text-xs font-serif font-black uppercase tracking-wider text-amber-300 mb-1.5 flex items-center justify-between">
                  <span>Startovní destičky ({activeStarterTiles.length}):</span>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                    PŘIPRAVENO V ARZENÁLU
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeStarterTiles.map((tile, tIdx) => (
                    <div
                      key={`${tile?.id || tIdx}_${tIdx}`}
                      className="p-2 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between shadow-sm hover:border-amber-800/80 transition-colors"
                      title={tile?.description || ""}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-white truncate">
                          {tile?.name}
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                          <span className="text-red-300 font-black bg-red-950/80 px-1 rounded border border-red-800">
                            {tile?.dmg ? `⚔️ ${tile.dmg}` : "🛡️ Štít"}
                          </span>
                          <span className="text-amber-300 font-bold bg-amber-950/80 px-1 rounded border border-amber-800">
                            ⏳ {tile?.cooldown}t
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-300 leading-tight line-clamp-2">
                        {tile?.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPEDIČNÍ STANICE SE SEEDEM A VELKÝM TLAČÍTKEM VYRAZIT NA NOCHTICE */}
            <div className="p-3 sm:p-4 rounded-2xl border-2 border-[#542106] bg-gradient-to-r from-[#1c1009] via-[#24130b] to-[#1c1009] shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Zadání seedu */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-serif text-xs font-black uppercase tracking-wider">
                  <ScrollText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Expediční spis (Seed):</span>
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
                    className="w-36 sm:w-44 px-3 py-1.5 bg-black border-2 border-amber-600 rounded-lg text-xs font-mono font-black text-amber-200 tracking-wider focus:outline-none focus:border-amber-400 transition-colors uppercase shadow-inner"
                    placeholder="CESNEK-1899"
                    title="Sem můžete zadat libovolný expediční seed"
                  />
                  <button
                    type="button"
                    onClick={handleRandomSeed}
                    className="px-2.5 py-1.5 rounded-lg border-2 border-amber-500 bg-amber-950 hover:bg-amber-900 text-amber-200 hover:text-white text-xs font-serif font-black transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    title="Vygenerovat náhodný tematický seed (Klávesa R)"
                  >
                    <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                    <span>[R] Spis</span>
                  </button>
                </div>
              </div>

              {/* Tlačítko startu výpravy */}
              <button
                type="button"
                onClick={handleLaunch}
                className="group px-6 sm:px-8 py-3 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 active:scale-[0.98] text-stone-950 font-serif font-black text-base sm:text-lg tracking-wider shadow-[0_0_28px_rgba(245,158,11,0.65)] flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-150 shrink-0"
              >
                <Swords className="w-5 h-5 text-stone-950 group-hover:rotate-12 transition-transform shrink-0" />
                <span>VYRAZIT NA NOCHTICE</span>
                <span className="text-[11px] font-mono font-black text-stone-900 bg-amber-200 px-2 py-0.5 rounded border border-amber-500">
                  ENTER
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 4. HOSPODSKÁ LIŠTA: PRAVIDLA, ARCHIV, ZVUK */}
      <footer className="relative z-10 w-full py-1.5 px-3 sm:px-6 border-t-2 border-stone-800 bg-[#0a0604]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 sm:gap-6 font-serif">
            <button
              type="button"
              onClick={onOpenRules}
              className="text-amber-200 hover:text-amber-100 underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Pravidla cechu</span>
            </button>
            <button
              type="button"
              onClick={onOpenArchive}
              className="text-amber-200 hover:text-amber-100 underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Castle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Hradní archiv & Trofeje</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-animation-lab"))}
              className="text-amber-200 hover:text-amber-100 underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Clapperboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Animační laboratoř</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
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
              className="px-2.5 py-0.5 rounded-md border-2 border-stone-600 bg-stone-900 hover:border-amber-400 text-stone-100 hover:text-white transition-colors cursor-pointer text-xs font-serif font-black flex items-center gap-1.5 shadow-sm"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Muzika: Hraje</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                  <span>Muzika: Ticho</span>
                </>
              )}
            </button>
            <span className="font-mono text-[11px] font-bold text-amber-300 hidden sm:inline">
              Lovec Upírů v1.4 · C. k. patentováno
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}