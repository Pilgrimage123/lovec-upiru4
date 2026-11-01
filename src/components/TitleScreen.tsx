import React, { useState, useEffect } from "react";
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
  BadgeCheck,
} from "lucide-react";

export interface TitleScreenProps {
  onStartHunt: (hunterId: string, seed: string) => void;
  onOpenRules: () => void;
  onOpenArchive: () => void;
  initialHunterId?: string;
  initialSeed?: string;
}

/**
 * Centrální konfigurace portrétů lovců pro snadnou výměnu obrázků.
 * Až budete mít finální ilustrace, stačí je nakopírovat a upravit tyto cesty.
 */
export const HUNTER_PORTRAITS: Record<string, string> = {
  classic: "/assets/characters/venca_idle.png",
  honza: "/assets/enemies/sedlak_stit.png",
  dragoun: "/assets/enemies/halapartnik.png",
  zlodejka: "/assets/enemies/vrhac_nozu.png",
};

export interface HunterDeed {
  id: string;
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

export const HUNTERS_DATA: Record<string, HunterDeed> = {
  classic: {
    id: "classic",
    name: "Venca Česnekáč",
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
      { id: "oak_stake", upgradeLevel: 0 },
      { id: "garlic_belch", upgradeLevel: 0 },
      { id: "holy_syringe", upgradeLevel: 0 },
    ],
  },
  honza: {
    id: "honza",
    name: "Hloupý Honza",
    epithet: "Selský silák",
    role: "Selská síla & cep",
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
    name: "Rittmeister Jaromír",
    epithet: "Vysloužilý c. k. dragoun",
    role: "Císařský kavalerista",
    tag: "Vysoké zdraví (24 HP) · Kartáčová salva & Pevný kryt",
    beerBadge: "C. k. speciál",
    maxHp: 24,
    icon: "⚔️",
    heraldicColor: "from-blue-950 via-stone-900 to-slate-950",
    heraldicBorder: "border-blue-400",
    portraitUrl: HUNTER_PORTRAITS.dragoun,
    quote: "„Dle c. k. polního řádu § 14 se na noční havěť tasí šavle bez úředního vyzvání!“",
    signatureWeapon: "Důstojnická šavle vzor 1877 & Křesadlová bambitka",
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
    name: "Káča Pavučina",
    epithet: "Úskočná zlodějka",
    role: "Pražská stínová akrobatka",
    tag: "Vysoké riziko (14 HP) · Zničujících 8 DMG do zad",
    beerBadge: "Noční ležák",
    maxHp: 14,
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
};

const THEMATIC_FOLK_SEEDS = [
  "CESNEK-1899",
  "POVIDLA-1420",
  "C-K-DRAGOUN-1848",
  "KACA-1900",
  "SVECENA-PIPA-77",
  "ZNOJMO-1899",
  "BUCHTA-666",
  "SLIVOVICE-1848",
  "KORBEL-99",
  "DRACULA-007",
  "ROZMARNICE-13",
  "CERNY-KRIZ-1899",
];

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

  const handleLaunch = () => {
    try {
      SFX.bell?.();
    } catch {
      // Audio fallback
    }
    onStartHunt(selectedId, seed.trim() || "CESNEK-1899");
  };

  // Klávesové zkratky: 1-4 výběr lovce, R náhodný seed, Enter start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "1") handleSelectHunter("classic");
      else if (e.key === "2") handleSelectHunter("honza");
      else if (e.key === "3") handleSelectHunter("dragoun");
      else if (e.key === "4") handleSelectHunter("zlodejka");
      else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRandomSeed();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, seed]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0a0705] text-[#f8fafc] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* 1. Atmosférické vrstvy pozadí: Noční vesnice, louče a hospodská gotická viněta */}
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

      {/* 2. Reprezentativní goticko-hospodské záhlaví (Hostinec U Svěcené pípy) */}
      <header className="relative z-10 w-full pt-3 pb-2.5 px-3 sm:px-6 border-b-2 border-[#542106] bg-gradient-to-b from-[#1c1009] via-[#160d07] to-[#100805] shadow-[0_8px_28px_rgba(0,0,0,0.9)]">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Vývěsní cechovní štít */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-400 bg-amber-950/90 text-amber-200 font-serif text-xs font-black uppercase tracking-[0.25em] shadow-md mb-1">
            <span>🍺</span>
            <span>Hostinec „U Svěcené pípy“ & C. k. zbrojnice</span>
            <span>🧄</span>
          </div>

          {/* Monumentální název hry s maximálním kontrastem */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-black tracking-wider text-amber-300 drop-shadow-[0_4px_16px_rgba(245,158,11,0.7)] my-0.5">
            🧄 LOVEC UPÍRŮ
          </h1>

          {/* Parodický venkovský podtitul s vysokým kontrastem */}
          <p className="text-xs sm:text-sm md:text-base text-amber-100 font-serif font-medium italic max-w-3xl leading-snug">
            „Pivo točené ze svěceného sudu · Česnek ze Znojma · Kůly z dubového jádra ·
            Rázné vyčištění Drákulova hradu léta Páně 1899!“
          </p>
        </div>
      </header>

      {/* 3. Hlavní scénografie Síně lovců: 4 velkoformátové Lovecké archy vedle sebe */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 flex flex-col justify-center">
        {/* Návěští a klávesové zkratky s vysokým kontrastem */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-base">⚜️</span>
            <h2 className="text-xs sm:text-sm uppercase tracking-wider text-amber-300 font-serif font-black flex items-center gap-1.5">
              <span>Síň lovců: Zvol svého bijce</span>
              <span className="text-xs text-amber-200 font-mono font-bold">
                (Klávesy 1–4)
              </span>
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-amber-200 font-mono font-bold">
            <span className="bg-stone-900 border border-amber-800/80 px-1.5 py-0.5 rounded text-amber-300">
              [1–4] Výběr lovce
            </span>
            <span>·</span>
            <span className="bg-stone-900 border border-amber-800/80 px-1.5 py-0.5 rounded text-amber-300">
              [R] Nový spis
            </span>
            <span>·</span>
            <span className="bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded">
              [ENTER] Zahájit hon
            </span>
          </div>
        </div>

        {/* Mřížka 4 Loveckých archů */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {Object.values(HUNTERS_DATA).map((hunterItem, idx) => {
            const isSelected = hunterItem.id === selectedId;
            const starterTiles = (hunterItem.deck || []).map((card) =>
              getHeroTileDefinition(card.id, card.upgradeLevel || 0)
            );
            const imageFailed = failedImages[hunterItem.id];

            return (
              <div
                key={hunterItem.id}
                onClick={() => handleSelectHunter(hunterItem.id)}
                className={`group relative rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between overflow-hidden cursor-pointer ${
                  isSelected
                    ? "border-amber-400 bg-gradient-to-b from-[#2a170c] via-[#1c0f08] to-[#140b05] shadow-[0_0_32px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/80 scale-[1.01] z-20"
                    : "border-stone-700 bg-gradient-to-b from-[#180f0a] via-[#120a06] to-[#0c0604] hover:border-amber-500 hover:bg-[#20130d] text-stone-100"
                }`}
              >
                {/* Ozdobné kování v rozích karty */}
                <div className="absolute top-1.5 left-2 text-xs text-amber-500 font-serif pointer-events-none">
                  ❖
                </div>
                <div className="absolute top-1.5 right-2 text-xs text-amber-500 font-serif pointer-events-none">
                  ❖
                </div>

                {/* Horní hlavička archu: Hotkey [1-4], role a zdraví */}
                <div className="p-3 pb-2.5 border-b border-stone-800 bg-black/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${
                        isSelected
                          ? "border-amber-400 bg-amber-950 text-amber-200"
                          : "border-stone-600 bg-stone-900 text-stone-200"
                      }`}
                    >
                      Klávesa [{idx + 1}]
                    </span>

                    {/* Zdraví (HP) - vysoký kontrast sytě červené */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-2 border-red-600 bg-red-950 text-red-100 text-xs font-black shadow-sm">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-300" />
                      <span>{hunterItem.maxHp} HP</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-2 border-blue-600 bg-blue-950 text-blue-100 text-xs font-black shadow-sm" title={`Obrana ${hunterItem.defense}: na začátku každého kola dá ${hunterItem.defense} Štítu`}>
                      <Shield className="w-3.5 h-3.5 fill-blue-500 text-blue-300" />
                      <span>{hunterItem.defense} Obrana</span>
                    </div>
                  </div>

                  {/* Role a pivní známka v kontrastním pruhu */}
                  <div className="flex items-center justify-between text-xs font-serif font-black uppercase tracking-wide text-amber-300 mb-0.5">
                    <span className="truncate">{hunterItem.role}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700 whitespace-nowrap ml-1">
                      {hunterItem.beerBadge}
                    </span>
                  </div>

                  {/* Jméno lovce (velké a zářivé) */}
                  <h3
                    className={`text-xl sm:text-2xl font-serif font-black leading-tight mt-0.5 truncate ${
                      isSelected
                        ? "text-amber-100 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
                        : "text-white group-hover:text-amber-200"
                    }`}
                  >
                    {hunterItem.name}
                  </h3>
                  <div className="text-xs text-amber-300 font-serif font-bold italic truncate">
                    „{hunterItem.epithet}“
                  </div>
                </div>

                {/* Střední část: Portrétní medailon lovce */}
                <div className="p-3 py-2 flex flex-col items-center">
                  <div
                    className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 overflow-hidden flex items-end justify-center bg-gradient-to-b from-stone-900 to-black p-1 shadow-inner ${
                      isSelected ? "border-amber-400" : "border-stone-600"
                    }`}
                  >
                    {/* Zářící erbové pozadí */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25),transparent_70%)]" />

                    {/* Statický reprezentativní obrázek nebo erbovní fallback */}
                    {!imageFailed ? (
                      <img
                        src={hunterItem.portraitUrl}
                        alt={hunterItem.name}
                        className="relative z-10 max-h-26 sm:max-h-28 w-auto object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
                        onError={() => {
                          setFailedImages((prev) => ({
                            ...prev,
                            [hunterItem.id]: true,
                          }));
                        }}
                      />
                    ) : (
                      <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        <span className="text-5xl drop-shadow-md">{hunterItem.icon}</span>
                      </div>
                    )}

                    {/* Erbovní ikona v rohu medailonu */}
                    <div className="absolute bottom-1 right-1 text-base bg-stone-950 border border-stone-600 rounded-md px-1.5 leading-none shadow">
                      {hunterItem.icon}
                    </div>

                    {/* Pečeť výběru */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 bg-amber-400 text-stone-950 font-serif font-black text-[10px] px-2 py-0.5 rounded shadow-md border border-amber-200">
                        VYBRÁN
                      </div>
                    )}
                  </div>

                  {/* Parodická hospodská hláška s plným kontrastem */}
                  <blockquote className="mt-2.5 px-1 text-center text-xs text-amber-100 font-serif font-medium italic leading-snug line-clamp-2">
                    {hunterItem.quote}
                  </blockquote>
                </div>

                {/* Taktický rozpad lovce: Zbraň, Krok do nepřítele a 3-Kombo */}
                <div className="p-3 pt-0 flex-1 flex flex-col justify-between space-y-2">
                  {/* Podpisová zbraň */}
                  <div className="p-2 rounded-lg bg-stone-950 border border-stone-700 text-xs shadow-sm">
                    <div className="flex items-center gap-1.5 font-serif font-bold text-amber-300">
                      <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-amber-200 font-black">Zbraň:</span>
                      <span className="text-white font-medium truncate">
                        {hunterItem.signatureWeapon.split("&")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Krok do nepřítele (Bump manévr) s vysokým kontrastem */}
                  <div className="p-2 rounded-lg bg-stone-950 border border-stone-700 text-xs shadow-sm">
                    <div className="flex items-center gap-1.5 font-black text-amber-300">
                      <span className="text-sm">💥</span>
                      <span className="uppercase text-[11px] tracking-wide text-amber-300">
                        Krok ({hunterItem.bumpName}):
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-100 font-normal mt-0.5 leading-snug line-clamp-2">
                      {hunterItem.bumpDesc}
                    </p>
                  </div>

                  {/* 3-Kombo signatura s jasně azurovým písmem */}
                  <div className="p-2 rounded-lg bg-stone-950 border border-stone-700 text-xs shadow-sm">
                    <div className="flex items-center gap-1.5 font-black text-sky-300">
                      <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="uppercase text-[11px] tracking-wide text-sky-300">
                        3-Kombo ({hunterItem.comboName}):
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-100 font-normal mt-0.5 leading-snug line-clamp-2">
                      {hunterItem.comboDesc}
                    </p>
                  </div>

                  {/* Rozbalené startovní destičky pro vybraného lovce */}
                  {isSelected ? (
                    <div className="pt-1.5 border-t-2 border-amber-800">
                      <div className="text-xs font-serif font-black uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
                        <span>Výchozí destičky (3):</span>
                        <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950 px-1.5 rounded border border-emerald-700">
                          PŘIPRAVENO
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {starterTiles.map((tile, tIdx) => (
                          <div
                            key={`${tile?.id || tIdx}_${tIdx}`}
                            className="p-1.5 rounded-md border-2 border-amber-600/80 bg-stone-950 flex flex-col justify-between shadow-sm"
                            title={tile?.description || ""}
                          >
                            <span className="text-[11px] font-black text-white truncate">
                              {tile?.name}
                            </span>
                            <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-stone-800 font-mono">
                              <span className="text-red-300 font-black">
                                {tile?.dmg ? `⚔️ ${tile.dmg} D` : "🛡️ Štít"}
                              </span>
                              <span className="text-amber-300 font-bold">
                                Chladnutí {tile?.cooldown}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectHunter(hunterItem.id)}
                      className="w-full py-2 px-2 rounded-lg border-2 border-stone-600 bg-stone-900 hover:border-amber-400 hover:bg-amber-950/60 text-amber-200 hover:text-white text-xs font-serif font-black transition-all text-center cursor-pointer shadow-sm"
                    >
                      Zvolit lovce [{idx + 1}]
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. C. k. výpravní glejt (Spodní úřední povolení k odstřelu upírů & CTA) */}
      <section className="relative z-10 w-full mt-2 pt-3 pb-3 px-3 sm:px-6 border-t-2 border-[#542106] bg-gradient-to-t from-[#140b06] via-[#1a0e08] to-[#150b06] shadow-[0_-8px_28px_rgba(0,0,0,0.85)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* C. k. úřední kolkovaná část se seedem s vysokým kontrastem */}
          <div className="flex flex-wrap items-center gap-3 bg-stone-950 p-2.5 rounded-xl border-2 border-stone-700 shadow-inner">
            <div className="flex items-center gap-1.5 text-amber-300 font-serif text-xs font-black uppercase tracking-wider">
              <ScrollText className="w-4 h-4 text-amber-400" />
              <span>C. k. expediční spis:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="expedition-seed-input"
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value.toUpperCase())}
                className="w-36 sm:w-44 px-3 py-1.5 bg-black border-2 border-amber-600 rounded-lg text-xs font-mono font-black text-amber-200 tracking-wider focus:outline-none focus:border-amber-400 transition-colors uppercase"
                placeholder="CESNEK-1899"
                title="Sem můžete zadat libovolný expediční seed"
              />
              <button
                type="button"
                onClick={handleRandomSeed}
                className="px-3 py-1.5 rounded-lg border-2 border-amber-500 bg-amber-950 hover:bg-amber-900 text-amber-200 hover:text-white text-xs font-serif font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Vygenerovat náhodný tematický seed (Klávesa R)"
              >
                <Dice5 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Nový spis [R]</span>
              </button>
            </div>

            {/* Úřední razítko v syté a čitelné červené */}
            <div className="hidden lg:inline-flex items-center gap-1.5 text-xs font-serif font-black text-red-100 border-2 border-red-600 bg-red-950 px-3 py-1 rounded-md shadow">
              <BadgeCheck className="w-4 h-4 text-red-300" />
              <span>Úředně stvrzeno k likvidaci upírů</span>
            </div>
          </div>

          {/* Monumentální tlačítko zahájení honu (VYRAZIT NA HRAD) */}
          <button
            type="button"
            onClick={handleLaunch}
            className="group px-8 py-3.5 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 active:scale-[0.98] text-stone-950 font-serif font-black text-lg sm:text-xl tracking-wider shadow-[0_0_36px_rgba(245,158,11,0.7)] flex items-center justify-center gap-3 cursor-pointer transition-all duration-150"
          >
            <Swords className="w-6 h-6 text-stone-950 group-hover:rotate-12 transition-transform" />
            <span>VYRAZIT NA DRÁKULU</span>
            <span className="text-xs font-mono font-black text-stone-900 bg-amber-200 px-2.5 py-0.5 rounded border border-amber-500">
              ENTER
            </span>
          </button>
        </div>
      </section>

      {/* 5. Hospodská lišta odkazů a nastavení zvuku */}
      <footer className="relative z-10 w-full py-2 px-3 sm:px-6 border-t-2 border-stone-800 bg-[#0a0604]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 sm:gap-7 font-serif">
            <button
              type="button"
              onClick={onOpenRules}
              className="text-amber-200 hover:text-amber-100 underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Pravidla cechu</span>
            </button>
            <button
              type="button"
              onClick={onOpenArchive}
              className="text-amber-200 hover:text-amber-100 underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Castle className="w-4 h-4 text-amber-400" />
              <span>Hradní archiv & Trofeje</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-animation-lab"))}
              className="text-amber-200 hover:text-amber-100 underline font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Clapperboard className="w-4 h-4 text-amber-400" />
              <span>Animační laboratoř</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
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
              className="px-3 py-1 rounded-md border-2 border-stone-600 bg-stone-900 hover:border-amber-400 text-stone-100 hover:text-white transition-colors cursor-pointer text-xs font-serif font-black flex items-center gap-1.5 shadow-sm"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Muzika: Hraje</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-300" />
                  <span>Muzika: Ticho</span>
                </>
              )}
            </button>
            <span className="font-mono text-xs font-bold text-amber-300 hidden sm:inline">
              Lovec Upírů v1.2 · C. k. patentováno
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}