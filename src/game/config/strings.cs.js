// @ts-nocheck
export const STRINGS = {
  gameTitle: 'LOVEC UPÍRŮ',
  gameSubtitle: 'Venca Česnekáč v hradu temnot',
  acts: {
    1: 'Akt I: Zatuchlé předhradí a hřbitov',
    2: 'Akt II: Černá kuchyně a zbrojnice',
    3: 'Akt III: Zrcadlový trůnní sál Hraběte Drákuly'
  },
  friendlyFireQuotes: [
    '„Hrabě Drákula by zaplakal – upír právě prokousl krk vlastnímu nočnímu bratru!“',
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
  momentumQuotes: [
    '„MOMENTUM! Poslední pijavice padla v kombu – Venca popadl druhý dech a zkrátil cooldowny!“'
  ],
  tutorialHints: [
    'TIP 1 (Kroky): Klávesami A / D popojdeš o 1 pole. Do obsazeného pole se vejít nedá. Přes překážku skáče jen destička Hospodský přemet.',
    'TIP 2 (Otočení a Česnek): Klávesou W se Venca otočí čelem vzad. V Česnekovém oblaku je otočení ZDARMA (nestojí tah)!',
    'TIP 3 (Fronta a Kombo): Kliknutím na destičku (nebo klávesami 1–4) ji vložíš do Fronty (stojí 1 tah, pokud není Rychlovka). Mezerníkem (Space) odpálíš celou frontu najednou!',
    'TIP 4 (Záměry a Friendly Fire): Sleduj odpočet nad hlavami upírů a červeně označená pole. Když upíra poodstrčíš nebo otočíš stříkačkou, napálí při odpočtu 0 vlastního kumpána!'
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
