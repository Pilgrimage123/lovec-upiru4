import React, { useState, useEffect } from "react";
import { STARTING_LOADOUTS } from "@/game/config/loadouts.js";
import { getHeroTileDefinition } from "@/game/config/tiles.js";
import { SFX, setSoundEnabled } from "@/game/ui/audio.js";

export interface TitleScreenProps {
  onStartHunt: (hunterId: string, seed: string) => void;
  onOpenRules: () => void;
  onOpenArchive: () => void;
  initialHunterId?: string;
  initialSeed?: string;
}

interface HunterData {
  id: string;
  name: string;
  epithet: string;
  role: string;
  maxHp: number;
  icon: string;
  spriteUrl: string;
  tag: string;
  difficulty: string;
  signatureWeapon: string;
  bumpName: string;
  bumpDesc: string;
  comboName: string;
  comboDesc: string;
  loreSnippet: string;
  deck: Array<{ id: string; upgradeLevel?: number }>;
}

const HUNTERS_CONFIG: Record<string, HunterData> = {
  classic: {
    id: "classic",
    name: "Venca Česnekáč",
    epithet: "Dub a česnek",
    role: "Hospodský lidový bijec",
    maxHp: 20,
    icon: "🧄",
    spriteUrl: "/assets/characters/venca_idle.png",
    tag: "Vyvážený taktik · Odhazování & Dým",
    difficulty: "Doporučeno pro začátečníky",
    signatureWeapon: "Dubový kolík & Svěcená stříkačka",
    bumpName: "Česnekové žduchnutí",
    bumpDesc: "Krok do nepřítele: Odhodí cíl o 1 pole a zanechá Česnekový oblak (CD 3). V dýmu je otočení zdarma!",
    comboName: "Česneková aura",
    comboDesc: "3-kombo: Získá +4 Štít a omámí okolní upíry (Zmatení — vrávorají náhodně).",
    loreSnippet:
      "Venca je poctivý štamgast z hospody U Svěcené pípy. Do boje jde s dubovým kůlem, moravským česnekem a hasičskou stříkačkou.",
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
    role: "Drtivá selská síla & cep",
    maxHp: 20,
    icon: "🥖",
    spriteUrl: "/assets/enemies/sedlak_stit.png",
    tag: "Hrubá síla · Kolize & Beraní průraz",
    difficulty: "Přímočará síla",
    signatureWeapon: "Okovaný husitský cep & Povidlové buchty",
    bumpName: "Selský beran",
    bumpDesc: "Krok do nepřítele: Odhodí cíl, sám obsadí jeho pole a udělí mu 2 drtivé DMG (CD 3)!",
    comboName: "Selský hněv",
    comboDesc: "3-kombo: Získá +6 Štít a mocná rázová vlna zasáhne okolní nepřátele za 4 DMG.",
    loreSnippet:
      "Slezl z pece, snědl pekáč povidlových buchet od babičky a vyrazil vymýtit upíry. Jeho cep drtí upíří kosti napořád.",
    deck: [
      { id: "flail_sweep", upgradeLevel: 0 },
      { id: "plum_bun", upgradeLevel: 0 },
      { id: "heavy_windup", upgradeLevel: 0 },
    ],
  },
  dragoun: {
    id: "dragoun",
    name: "Rittmeister Jaromír",
    epithet: "Vysloužilý dragoun",
    role: "Císařský kavalerista",
    maxHp: 24,
    icon: "⚔️",
    spriteUrl: "/assets/enemies/halapartnik.png",
    tag: "Vysoké zdraví (24 HP) · Kartáčová bambitka & Kryt",
    difficulty: "Taktický veterán",
    signatureWeapon: "Důstojnická šavle vzor 1877 & Bambitka",
    bumpName: "Úder těžkým jílcem",
    bumpDesc: "Krok do nepřítele: Praští ho mosazným jílcem za 2 DMG, odhodí ho a na 1 tah ho omráčí (CD 3).",
    comboName: "Kavaleristická salva",
    comboDesc: "3-kombo: Kartáčová salva za 4 DMG všem v linii pohledu a zkrátí CD všech destiček o 1.",
    loreSnippet:
      "Císařský jezdecký veterán z bitev v Uhrách. Spoléhá na vojenskou disciplínu, železný kryt a křesadlovou bambitku.",
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
    maxHp: 14,
    icon: "🗡️",
    spriteUrl: "/assets/enemies/vrhac_nozu.png",
    tag: "Vysoké riziko (14 HP) · Smrtících 8 DMG do zad",
    difficulty: "Pokročilá akrobacie",
    signatureWeapon: "Italské stiletto & Křemenné střepy",
    bumpName: "Kapsářská záměna",
    bumpDesc: "Krok do nepřítele: Prohodí si s ním místo a otočí ho zády k sobě (CD 2) pro úder do zad!",
    comboName: "Pavučinový únik",
    comboDesc: "3-kombo: Získá +4 Štít a okamžitě obnoví připravenost manévru Kapsářské záměny.",
    loreSnippet:
      "Královna nočních pražských uliček. Je křehká, ale jakmile se upírovi dostane do zad, její dýka zasadí zničujících 8 DMG.",
    deck: [
      { id: "stiletto_stab", upgradeLevel: 0 },
      { id: "glass_shards", upgradeLevel: 0 },
      { id: "shadow_slip", upgradeLevel: 0 },
    ],
  },
};

const THEMATIC_SEEDS = [
  "VENCA-1899",
  "HONZA-1420",
  "DRAGOUN-1848",
  "KACA-1900",
  "CERNY-KRIZ",
  "SVECENA-PIPA",
  "DRAKULA-666",
  "PUDROVKA-99",
];

export function TitleScreen({
  onStartHunt,
  onOpenRules,
  onOpenArchive,
  initialHunterId = "classic",
  initialSeed = "VENCA-1899",
}: TitleScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(initialHunterId);
  const [seed, setSeed] = useState<string>(initialSeed);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  const hunter = HUNTERS_CONFIG[selectedId] || HUNTERS_CONFIG.classic;

  const handleSelectHunter = (id: string) => {
    setSelectedId(id);
    try {
      SFX.cardDraw?.();
    } catch {
      // Audio fallback
    }
  };

  const handleRandomSeed = () => {
    const randomPick = THEMATIC_SEEDS[Math.floor(Math.random() * THEMATIC_SEEDS.length)];
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
      SFX.executeReady?.();
    } catch {
      // Audio fallback
    }
    onStartHunt(selectedId, seed.trim() || "VENCA-1899");
  };

  // Keyboard navigation: 1-4 switches hunter, Enter starts hunt, R randomizes seed
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

  const deckTiles = (hunter.deck || []).map((card) =>
    getHeroTileDefinition(card.id, card.upgradeLevel || 0)
  );

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#070b14] text-[#f8fafc] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* High-contrast atmospheric dark background with warm moonlit vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,119,6,0.18),transparent_70%),radial-gradient(ellipse_60%_50%_at_50%_110%,rgba(185,28,28,0.22),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"
        aria-hidden="true"
      />

      {/* Top Header: Clean, High-Contrast Gothic Title */}
      <header className="relative z-10 w-full pt-3 pb-2 px-3 sm:px-6 border-b border-[#2d3748] bg-[#0c1424]/95 backdrop-blur-md shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-[11px] sm:text-xs tracking-[0.2em] uppercase font-serif">
            <span>⚜️</span>
            <span>Česká tahová roguelite kronika</span>
            <span>⚜️</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-black tracking-wide text-white drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)] my-0.5">
            🧄 LOVEC UPÍRŮ
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-amber-100 font-serif italic max-w-2xl px-2 leading-tight">
            „Krvavá noc na Drákulově hradě — zvol svého lovce a vyraž vyčistit komnaty!“
          </p>
        </div>
      </header>

      {/* Mobile-Only Quick Hunter Switcher (Visible on mobile/tablet screens < 1024px) */}
      <div className="relative z-10 block lg:hidden w-full px-3 pt-2.5 bg-[#0a0f1d] border-b border-[#243048]">
        <div className="max-w-md mx-auto">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Zvol lovce (1–4):</span>
            <span className="text-white font-mono">{hunter.name}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pb-2">
            {Object.values(HUNTERS_CONFIG).map((item, idx) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectHunter(item.id)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-400 bg-amber-500/20 text-white shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                      : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:text-white"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-950 flex items-center justify-center mb-0.5">
                    <img
                      src={item.spriteUrl}
                      alt={item.name}
                      className="w-full h-full object-contain object-bottom scale-110"
                    />
                    <span className="absolute bottom-0 right-0 text-[10px]">
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold truncate max-w-full">
                    {item.name.split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-extrabold text-red-300">
                    {item.maxHp} HP
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-3 flex flex-col lg:flex-row gap-4 items-stretch justify-center">
        {/* Left Column (Desktop): Full Hunter Selection Cards */}
        <div className="hidden lg:flex lg:w-4/12 flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs uppercase tracking-wider text-amber-400 font-bold font-serif flex items-center gap-1.5">
              <span>👥</span>
              <span>Dostupní lovci (Klávesy 1–4)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              [R] Náhodný seed
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {Object.values(HUNTERS_CONFIG).map((item, idx) => {
              const isSelected = item.id === selectedId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectHunter(item.id)}
                  className={`group relative text-left p-2.5 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "border-amber-400 bg-gradient-to-r from-amber-950/60 to-slate-900/90 shadow-[0_0_18px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50 scale-[1.01]"
                      : "border-slate-800 bg-slate-900/75 hover:border-slate-600 hover:bg-slate-800/80 text-slate-300"
                  }`}
                >
                  {/* Hotkey Tag */}
                  <span className="absolute top-2 right-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-300">
                    [{idx + 1}]
                  </span>

                  {/* Character Avatar */}
                  <div
                    className={`relative w-13 h-13 rounded-lg border-2 overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-950 ${
                      isSelected ? "border-amber-400" : "border-slate-700"
                    }`}
                  >
                    <img
                      src={item.spriteUrl}
                      alt={item.name}
                      className="w-full h-full object-contain object-bottom scale-110 drop-shadow"
                    />
                    <span className="absolute bottom-0 right-0 text-xs">
                      {item.icon}
                    </span>
                  </div>

                  {/* Character Meta */}
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-base font-serif font-black truncate ${
                          isSelected ? "text-amber-200" : "text-white"
                        }`}
                      >
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-black text-red-200 bg-red-950 border border-red-700 px-1.5 py-0.2 rounded">
                        ❤️ {item.maxHp} HP
                      </span>
                    </div>

                    <div className="text-xs text-amber-300/90 font-medium font-serif italic truncate">
                      {item.epithet}
                    </div>

                    <div className="text-[11px] text-slate-300 line-clamp-1 mt-0.5 font-medium">
                      {item.tag}
                    </div>
                  </div>

                  {/* Selected Marker */}
                  {isSelected && (
                    <div className="absolute right-3 bottom-2.5 text-amber-400 font-bold text-xs">
                      ▶
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-2.5 rounded-xl border border-slate-800 bg-[#0c1424]/90 text-xs text-slate-300 leading-relaxed">
            <span className="text-amber-400 font-bold">💡 Taktický tip:</span>{" "}
            Krok do nepřítele spustí unikátní schopnost (odhození, beraní náraz, omráčení jílcem nebo záměnu pozic). Používej klávesy <kbd className="text-[10px] bg-slate-950 text-amber-300 px-1 rounded">1</kbd>–<kbd className="text-[10px] bg-slate-950 text-amber-300 px-1 rounded">4</kbd> pro rychlý výběr lovce.
          </div>
        </div>

        {/* Right Column: Selected Hunter Spotlight & Controls */}
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 rounded-2xl border-2 border-slate-700/80 bg-gradient-to-b from-[#0f172a] to-[#090d16] shadow-2xl relative overflow-hidden">
          {/* Top Info Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{hunter.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">
                  {hunter.role}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  · {hunter.difficulty}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-white mt-0.5">
                {hunter.name}
              </h2>
            </div>

            {/* Health & Armor Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-red-600 bg-red-950 font-black text-base text-red-100 shadow-sm">
                <span>❤️</span>
                <span>{hunter.maxHp} HP</span>
              </span>
            </div>
          </div>

          {/* Center Stage: Character Sprite + Tactical Breakdown */}
          <div className="relative z-10 my-2.5 flex flex-col sm:flex-row items-center sm:items-stretch gap-3 sm:gap-4 bg-[#0a0f1d]/90 p-3 rounded-xl border border-slate-700">
            {/* High-visibility Character Sprite Showcase */}
            <div className="w-24 sm:w-28 h-28 sm:h-32 flex-shrink-0 relative flex items-end justify-center pb-1 rounded-lg border border-slate-700/80 bg-gradient-to-t from-slate-900 to-transparent">
              {/* Ground Shadow */}
              <div className="absolute bottom-2 w-18 h-3 rounded-full bg-black/90 blur-[1px]" />
              <img
                src={hunter.spriteUrl}
                alt={hunter.name}
                className="relative z-10 max-h-26 sm:max-h-28 w-auto object-contain object-bottom drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] animate-pulse"
                style={{ animationDuration: "3s" }}
              />
            </div>

            {/* Tactical Perks (Krok & 3-Kombo) with High-Contrast Text */}
            <div className="flex-1 flex flex-col justify-center text-xs space-y-2 text-slate-200">
              <p className="text-[11px] sm:text-xs text-amber-100 italic line-clamp-2">
                {hunter.loreSnippet}
              </p>

              {/* Step Maneuver */}
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span>💥</span>
                  <span className="uppercase text-[11px] tracking-wide">
                    Krok do nepřítele ({hunter.bumpName}):
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                  {hunter.bumpDesc}
                </div>
              </div>

              {/* 3-Combo Signature */}
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-sky-300">
                  <span>✨</span>
                  <span className="uppercase text-[11px] tracking-wide">
                    3-Kombo ({hunter.comboName}):
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                  {hunter.comboDesc}
                </div>
              </div>
            </div>
          </div>

          {/* Starter Deck Cards (3 Cards) */}
          <div className="relative z-10 mb-2">
            <div className="text-[11px] sm:text-xs font-serif uppercase tracking-wider text-amber-400 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>🃏</span>
                <span>Startovní výzbroj (3 destičky):</span>
              </span>
              <span className="text-[10px] text-slate-300 font-sans font-normal">
                Zbraň: <strong>{hunter.signatureWeapon}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {deckTiles.map((tile, tIdx) => (
                <div
                  key={`${tile.id}_${tIdx}`}
                  className="p-2 sm:p-2.5 rounded-lg border border-slate-700 bg-slate-900/95 flex flex-col justify-between hover:border-amber-400 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-1">
                    <span className="truncate">{tile.name}</span>
                    <span className="text-amber-400 font-mono text-[11px] whitespace-nowrap pl-1">
                      CD {tile.cooldown}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-200 my-1 leading-snug line-clamp-2">
                    {tile.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 font-mono">
                    <span className="font-bold text-red-300">
                      {tile.dmg > 0 ? `⚔️ ${tile.dmg} DMG` : "🛡️ Podpora"}
                    </span>
                    <span className="text-emerald-300 font-bold">
                      {tile.quick ? "⚡ 0 tahů" : "1 tah"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seed Input & Launch Controls */}
          <div className="relative z-10 pt-2.5 border-t border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Seed Row */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="expedition-seed-input"
                className="text-xs font-bold text-slate-300 whitespace-nowrap flex items-center gap-1"
              >
                <span>🎲</span>
                <span>Seed:</span>
              </label>
              <input
                id="expedition-seed-input"
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value.toUpperCase())}
                className="w-28 sm:w-36 px-2.5 py-1.5 bg-slate-950 border-2 border-slate-600 rounded-lg text-xs font-mono font-black text-amber-300 tracking-wider focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="VENCA-1899"
              />
              <button
                type="button"
                onClick={handleRandomSeed}
                className="px-2.5 py-1.5 rounded-lg border-2 border-slate-600 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Náhodný tematický seed (Klávesa R)"
              >
                <span>🔀</span>
                <span className="hidden sm:inline">Náhodný</span>
              </button>
            </div>

            {/* Launch CTA Button */}
            <button
              type="button"
              onClick={handleLaunch}
              className="px-6 py-3 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 active:scale-[0.98] text-slate-950 font-serif font-black text-base sm:text-lg tracking-wider shadow-[0_0_24px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span className="text-xl">⚔️</span>
              <span>VYRAZIT DO BOJE</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                ENTER
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="relative z-10 w-full py-2 px-3 sm:px-6 border-t border-slate-800 bg-[#0a0e1a]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={onOpenRules}
              className="text-slate-300 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>📖</span>
              <span>Pravidla lovu</span>
            </button>
            <button
              type="button"
              onClick={onOpenArchive}
              className="text-slate-300 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>🏛️</span>
              <span>Hradní archiv</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-animation-lab"))}
              className="text-slate-300 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>🎬</span>
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
              className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 hover:border-amber-400 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            >
              {soundOn ? "🔊 Zvuk: ZAP" : "🔇 Zvuk: VYP"}
            </button>
            <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
              Lovec Upírů v1.1
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
