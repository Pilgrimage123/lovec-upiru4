// @ts-nocheck
export const STRINGS = {
  gameTitle: 'LOVEC UPÍRŮ',
  gameSubtitle: 'Venca Česnekáč v hradu temnot',
  acts: {
    1: 'Akt I: Zatuchlé předhradí a hřbitov',
    2: 'Akt II: Černá kuchyně a zbrojnice',
    3: 'Akt III: Zrcadlový trůnní sál Hraběte von Nochtic'
  },
  friendlyFireQuotes: [
    '„Hrabě Leopold von Nochtic by zaplakal – upír právě prokousl krk vlastnímu nočnímu bratru!“',
    '„Tohle se v kryptě nenosí! Upír napálil kumpána přímo mezi lopatky!“',
    '„Přátelská výpomoc po upířsku: jeden špičák do vlastních řad!“',
    '„Kdo jinému jámu kopá, sám do ní upířího druha shodí!“',
    '„Pekelná potupa v noční hlídce! Venca se jen škodolibě chechtá pod fousy.“'
  ],
  collisionQuotes: [
    '„Řach! Dvě palice zaduněly o sebe jak pivní soudky!“',
    '„Hradní zeď nepovolila, zato upírovi křuplo v kříži!“',
    '„Srážka v chodbě bez přednosti zprava!“'
  ],
  svunkQuotes: [
    '„ŠVUNK! Padla bestie v kombu – otevírací destička chytila švunk a zkrátila Chladnutí!“'
  ],
  momentumQuotes: [
    '„ŠVUNK! Padla bestie v kombu – otevírací destička chytila švunk a zkrátila Chladnutí!“'
  ],
  tutorialHints: [
    'TIP 1 (Kroky): Klávesami A / D popojdeš o 1 pole. Krokem do nepřítele provedeš svůj manévr (Krok do nepřítele).',
    'TIP 2 (Otočení a Česnek): Klávesou W se otočíš čelem vzad. V Česnekovém oblaku se Sokol Venca otáčí ZDARMA (0 tahů) a všichni lovci jsou proti oblaku imunní!',
    'TIP 3 (Fronta a Kombo): Klávesami 1–4 vložíš destičku do Fronty (1 tah, Rychlovka 0 tahů). Mezerníkem odpálíš celou frontu najednou!',
    'TIP 4 (Záměry a Friendly Fire): Nepřítel se značkou 🚨 1 AKCE po tvém tahu odpálí své kombo. Když ho odstrčíš nebo prohodíš, zasáhne vlastního kumpána!'
  ]
};

export function czechTurns(n) {
  const abs = Math.abs(Number(n) || 0);
  if (abs % 100 >= 11 && abs % 100 <= 14) return 'tahů';
  const last = abs % 10;
  if (last === 1) return 'tah';
  if (last >= 2 && last <= 4) return 'tahy';
  return 'tahů';
}
