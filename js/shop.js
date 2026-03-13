/* =========================================================
   ARMOR Shop & Production System v6.0
   Refactor: advanced production minigames + cleaner routing
   Drop-in base for /js/shop.js
   ========================================================= */

let currentDiscountState = { valid: false, discount: 0, code: '' };
let playerInventory = {};
let productionProgress = {};
let currentTab = 'shop';
let minigameActive = false;
let currentMinigame = null;
let selectedCategory = 'all';

let resources = {
  'włókno techniczne': 50,
  'kevlar surowy': 30,
  'stal surowa': 25,
  'polimer': 20,
  'aluminium surowe': 15,
  'szkło techniczne': 10,
  'ogniwo zasilające': 10,
  'skóra techniczna': 8,
  'chemikalia przemysłowe': 5,
  'pigment premium': 5
};

const categories = [
  { id: 'all', name: 'Wszystko', icon: 'fa-border-all' },
  { id: 'vests', name: 'Kamizelki', icon: 'fa-shield-alt' },
  { id: 'magazines', name: 'Magazynki', icon: 'fa-box' },
  { id: 'lights', name: 'Oświetlenie', icon: 'fa-lightbulb' },
  { id: 'holsters', name: 'Kabury', icon: 'fa-gun' },
  { id: 'paint', name: 'Malowania', icon: 'fa-paint-brush' }
];

const workstations = {
  material: { name: 'Warsztat Materiałowy', icon: 'fa-boxes', desc: 'Sortowanie i przygotowanie surowców' },
  metal: { name: 'Warsztat Metalowy', icon: 'fa-industry', desc: 'Cięcie, obróbka i kształtowanie metalu' },
  polymer: { name: 'Warsztat Polimerowy', icon: 'fa-vial', desc: 'Mieszanie, chłodzenie i stabilizacja materiałów' },
  assembly: { name: 'Stół Montażowy', icon: 'fa-screwdriver-wrench', desc: 'Sekwencyjne składanie modułów' },
  paint: { name: 'Lakiernia', icon: 'fa-spray-can-sparkles', desc: 'Kontrola jakości i wykończenie końcowe' }
};

function addMinigameTypes(product) {
  const fallbackMap = {
    material: 'scan_grid',
    metal: 'laser_cut',
    polymer: 'overheat',
    assembly: 'sequence',
    paint: 'timing'
  };

  product.stages = product.stages.map(function(stage) {
    return Object.assign({}, stage, {
      minigameType: stage.minigameType || fallbackMap[stage.workstation] || 'timing'
    });
  });

  return product;
}

const productionData = {
  vest35: addMinigameTypes({
    id: 'vest35',
    name: 'Kamizelka 35%',
    desc: 'Podstawowa ochrona',
    image: '/images/Kamizelka35.png',
    price: 10000,
    difficulty: 'Łatwy',
    category: 'vests',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000, minigameType: 'scan_grid', inputs: { 'włókno techniczne': 4, 'kevlar surowy': 2, 'stal surowa': 1 }, outputs: { 'pakiet surowców lekkich': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-vial-circle-check', workstation: 'polymer', duration: 18000, minigameType: 'overheat', inputs: { 'pakiet surowców lekkich': 1 }, outputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 1, 'płyta ochronna lekka': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-scissors', workstation: 'metal', duration: 16000, minigameType: 'laser_cut', inputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 1 }, outputs: { 'panel przedni lekki': 1, 'panel tylny lekki': 1, 'pas mocujący': 2 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 20000, minigameType: 'sequence', inputs: { 'panel przedni lekki': 1, 'panel tylny lekki': 1, 'pas mocujący': 2 }, outputs: { 'szkielet kamizelki lekkiej': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-stopwatch', workstation: 'paint', duration: 10000, minigameType: 'timing', inputs: { 'szkielet kamizelki lekkiej': 1, 'płyta ochronna lekka': 1 }, outputs: { 'Kamizelka 35%': 1 } }
    ]
  }),
  vest50: addMinigameTypes({
    id: 'vest50',
    name: 'Kamizelka 50%',
    desc: 'Średnia ochrona',
    image: '/images/Kamizelka50.png',
    price: 20000,
    difficulty: 'Średni',
    category: 'vests',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000, minigameType: 'scan_grid', inputs: { 'włókno techniczne': 5, 'kevlar surowy': 4, 'stal surowa': 2, 'polimer': 2 }, outputs: { 'pakiet surowców standard': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-vial-circle-check', workstation: 'polymer', duration: 25000, minigameType: 'overheat', inputs: { 'pakiet surowców standard': 1 }, outputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 2, 'płyta balistyczna standard': 2, 'klamry montażowe': 2 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-scissors', workstation: 'metal', duration: 22000, minigameType: 'laser_cut', inputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 2, 'klamry montażowe': 2 }, outputs: { 'panel przedni standard': 1, 'panel tylny standard': 1, 'pasy boczne': 2, 'uchwyty taktyczne': 2 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 28000, minigameType: 'sequence', inputs: { 'panel przedni standard': 1, 'panel tylny standard': 1, 'pasy boczne': 2, 'uchwyty taktyczne': 2 }, outputs: { 'korpus kamizelki standard': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-radar', workstation: 'paint', duration: 15000, minigameType: 'scan_grid', inputs: { 'korpus kamizelki standard': 1, 'płyta balistyczna standard': 2 }, outputs: { 'Kamizelka 50%': 1 } }
    ]
  }),
  vest75: addMinigameTypes({
    id: 'vest75',
    name: 'Kamizelka 75%',
    desc: 'Wysoka ochrona',
    image: '/images/Kamizelka75.png',
    price: 35000,
    difficulty: 'Trudny',
    category: 'vests',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000, minigameType: 'scan_grid', inputs: { 'włókno techniczne': 6, 'kevlar surowy': 6, 'stal surowa': 3, 'polimer': 3, 'aluminium surowe': 2 }, outputs: { 'pakiet surowców ciężkich': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-fire-flame-curved', workstation: 'polymer', duration: 30000, minigameType: 'overheat', inputs: { 'pakiet surowców ciężkich': 1 }, outputs: { 'tkanina balistyczna premium': 2, 'arkusz kevlaru premium': 3, 'płyta balistyczna ciężka': 3, 'szyny MOLLE': 2 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-scissors', workstation: 'metal', duration: 28000, minigameType: 'laser_cut', inputs: { 'tkanina balistyczna premium': 2, 'arkusz kevlaru premium': 3, 'szyny MOLLE': 2 }, outputs: { 'panel przedni ciężki': 1, 'panel tylny ciężki': 1, 'system boczny': 2, 'moduł taktyczny MOLLE': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 35000, minigameType: 'sequence', inputs: { 'panel przedni ciężki': 1, 'panel tylny ciężki': 1, 'system boczny': 2 }, outputs: { 'korpus kamizelki ciężkiej': 1, 'wkład ochronny ciężki': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-radar', workstation: 'paint', duration: 18000, minigameType: 'scan_grid', inputs: { 'korpus kamizelki ciężkiej': 1, 'wkład ochronny ciężki': 1, 'moduł taktyczny MOLLE': 1 }, outputs: { 'Kamizelka 75%': 1 } }
    ]
  }),
  kabura: addMinigameTypes({
    id: 'kabura',
    name: 'Kabura',
    desc: 'Kabura na broń',
    image: '/images/Kabura.png',
    price: 250000,
    difficulty: 'Elite',
    category: 'holsters',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000, minigameType: 'scan_grid', inputs: { 'skóra techniczna': 4, 'polimer': 2, 'aluminium surowe': 1 }, outputs: { 'pakiet kabury': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-fire-flame-curved', workstation: 'polymer', duration: 30000, minigameType: 'overheat', inputs: { 'pakiet kabury': 1 }, outputs: { 'formowana skóra': 2, 'korpus polimerowy': 1, 'klips montażowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-scissors', workstation: 'metal', duration: 28000, minigameType: 'laser_cut', inputs: { 'formowana skóra': 2, 'korpus polimerowy': 1 }, outputs: { 'osłona kabury': 1, 'mocowanie pasa': 1, 'blokada kabury': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 35000, minigameType: 'sequence', inputs: { 'osłona kabury': 1, 'mocowanie pasa': 1, 'blokada kabury': 1 }, outputs: { 'korpus kabury': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-stopwatch', workstation: 'paint', duration: 18000, minigameType: 'timing', inputs: { 'korpus kabury': 1, 'klips montażowy': 1 }, outputs: { 'Kabura': 1 } }
    ]
  }),
  latarka: addMinigameTypes({
    id: 'latarka',
    name: 'Latarka do broni',
    desc: 'Latarka taktyczna',
    image: '/images/latarka_broń.png',
    price: 25000,
    difficulty: 'Średni',
    category: 'lights',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000, minigameType: 'scan_grid', inputs: { 'aluminium surowe': 2, 'szkło techniczne': 1, 'ogniwo zasilające': 2, 'polimer': 1 }, outputs: { 'pakiet oświetlenia taktycznego': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-scissors', workstation: 'metal', duration: 25000, minigameType: 'laser_cut', inputs: { 'pakiet oświetlenia taktycznego': 1 }, outputs: { 'obudowa latarki': 1, 'soczewka': 1, 'bateria robocza': 1, 'uchwyt montażowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-fire-flame-curved', workstation: 'polymer', duration: 22000, minigameType: 'overheat', inputs: { 'obudowa latarki': 1, 'soczewka': 1, 'bateria robocza': 1 }, outputs: { 'głowica światła': 1, 'moduł zasilania': 1, 'mocowanie do szyny': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 28000, minigameType: 'sequence', inputs: { 'głowica światła': 1, 'moduł zasilania': 1, 'mocowanie do szyny': 1 }, outputs: { 'moduł latarki broniowej': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-radar', workstation: 'paint', duration: 15000, minigameType: 'scan_grid', inputs: { 'moduł latarki broniowej': 1, 'uchwyt montażowy': 1 }, outputs: { 'Latarka do broni': 1 } }
    ]
  }),
  latarka_reczna: addMinigameTypes({
    id: 'latarka_reczna',
    name: 'Latarka ręczna',
    desc: 'Latarka LED',
    image: '/images/Latarka.png',
    price: 50000,
    difficulty: 'Łatwy',
    category: 'lights',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000, minigameType: 'scan_grid', inputs: { 'aluminium surowe': 2, 'szkło techniczne': 1, 'ogniwo zasilające': 2, 'polimer': 1 }, outputs: { 'pakiet oświetlenia ręcznego': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-scissors', workstation: 'metal', duration: 18000, minigameType: 'laser_cut', inputs: { 'pakiet oświetlenia ręcznego': 1 }, outputs: { 'obudowa ręczna': 1, 'soczewka': 1, 'bateria robocza': 1, 'przycisk zasilania': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-stopwatch', workstation: 'polymer', duration: 16000, minigameType: 'timing', inputs: { 'obudowa ręczna': 1, 'soczewka': 1, 'bateria robocza': 1 }, outputs: { 'głowica latarki': 1, 'moduł zasilania': 1, 'rękojeść': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 20000, minigameType: 'sequence', inputs: { 'głowica latarki': 1, 'moduł zasilania': 1, 'rękojeść': 1 }, outputs: { 'korpus latarki': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-radar', workstation: 'paint', duration: 10000, minigameType: 'scan_grid', inputs: { 'korpus latarki': 1 }, outputs: { 'Latarka ręczna': 1 } }
    ]
  }),
  magazynek_pistolet: addMinigameTypes({
    id: 'magazynek_pistolet',
    name: 'Magazynek do pistoletu',
    desc: 'Standardowy magazynek',
    image: '/images/magazynek_pistolet.png',
    price: 3800,
    difficulty: 'Łatwy',
    category: 'magazines',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000, minigameType: 'timing', inputs: { 'stal surowa': 2, 'polimer': 1 }, outputs: { 'pakiet magazynka standard': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-scissors', workstation: 'metal', duration: 18000, minigameType: 'laser_cut', inputs: { 'pakiet magazynka standard': 1 }, outputs: { 'korpus magazynka': 1, 'sprężyna': 1, 'podajnik': 1, 'stopka magazynka': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-fire-flame-curved', workstation: 'polymer', duration: 16000, minigameType: 'overheat', inputs: { 'korpus magazynka': 1, 'sprężyna': 1, 'podajnik': 1 }, outputs: { 'moduł wewnętrzny magazynka': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 20000, minigameType: 'sequence', inputs: { 'moduł wewnętrzny magazynka': 1, 'stopka magazynka': 1 }, outputs: { 'mechanizm magazynka': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-stopwatch', workstation: 'paint', duration: 10000, minigameType: 'timing', inputs: { 'mechanizm magazynka': 1 }, outputs: { 'Magazynek do pistoletu': 1 } }
    ]
  }),
  powiekszony_magazynek: addMinigameTypes({
    id: 'powiekszony_magazynek',
    name: 'Powiększony magazynek',
    desc: 'Większa pojemność',
    image: '/images/Pow_magazynek.png',
    price: 60000,
    difficulty: 'Średni',
    category: 'magazines',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000, minigameType: 'timing', inputs: { 'stal surowa': 3, 'polimer': 2, 'aluminium surowe': 1 }, outputs: { 'pakiet magazynka rozszerzonego': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-scissors', workstation: 'metal', duration: 25000, minigameType: 'laser_cut', inputs: { 'pakiet magazynka rozszerzonego': 1 }, outputs: { 'wydłużony korpus magazynka': 1, 'sprężyna wzmocniona': 1, 'rozszerzona stopka': 1, 'adapter montażowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-fire-flame-curved', workstation: 'polymer', duration: 22000, minigameType: 'overheat', inputs: { 'wydłużony korpus magazynka': 1, 'sprężyna wzmocniona': 1, 'adapter montażowy': 1 }, outputs: { 'moduł dużej pojemności': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 28000, minigameType: 'sequence', inputs: { 'moduł dużej pojemności': 1, 'rozszerzona stopka': 1 }, outputs: { 'mechanizm magazynka premium': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-stopwatch', workstation: 'paint', duration: 15000, minigameType: 'timing', inputs: { 'mechanizm magazynka premium': 1 }, outputs: { 'Powiększony magazynek': 1 } }
    ]
  }),
  zlote_malowanie: addMinigameTypes({
    id: 'zlote_malowanie',
    name: 'Złote malowanie',
    desc: 'Złoty wygląd broni',
    image: '/images/Złote_malowanie.png',
    price: 280000,
    difficulty: 'Elite',
    category: 'paint',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000, minigameType: 'scan_grid', inputs: { 'chemikalia przemysłowe': 2, 'pigment premium': 2, 'aluminium surowe': 1, 'szkło techniczne': 1 }, outputs: { 'pakiet lakierniczy premium': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-fire-flame-curved', workstation: 'polymer', duration: 30000, minigameType: 'overheat', inputs: { 'pakiet lakierniczy premium': 1 }, outputs: { 'baza lakiernicza': 1, 'mieszanka pigmentu': 1, 'utwardzacz': 1, 'aplikator natryskowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-stopwatch', workstation: 'metal', duration: 28000, minigameType: 'timing', inputs: { 'baza lakiernicza': 1, 'mieszanka pigmentu': 1, 'utwardzacz': 1 }, outputs: { 'zestaw lakierniczy premium': 1, 'warstwa podkładowa': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-screwdriver-wrench', workstation: 'assembly', duration: 35000, minigameType: 'sequence', inputs: { 'zestaw lakierniczy premium': 1, 'warstwa podkładowa': 1, 'aplikator natryskowy': 1 }, outputs: { 'pakiet malowania dekoracyjnego': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-radar', workstation: 'paint', duration: 18000, minigameType: 'scan_grid', inputs: { 'pakiet malowania dekoracyjnego': 1 }, outputs: { 'Złote malowanie': 1 } }
    ]
  })
};

const shopProducts = [
  { id: 'vest35', name: 'Kamizelka 35%', price: 10000, image: '/images/Kamizelka35.png', desc: 'Podstawowa ochrona balistyczna' },
  { id: 'vest50', name: 'Kamizelka 50%', price: 20000, image: '/images/Kamizelka50.png', desc: 'Średnia ochrona balistyczna' },
  { id: 'vest75', name: 'Kamizelka 75%', price: 35000, image: '/images/Kamizelka75.png', desc: 'Wysoka ochrona balistyczna' },
  { id: 'kabura', name: 'Kabura', price: 250000, image: '/images/Kabura.png', desc: 'Kabura na broń' },
  { id: 'latarka', name: 'Latarka do broni', price: 25000, image: '/images/latarka_broń.png', desc: 'Latarka taktyczna' },
  { id: 'latarka_reczna', name: 'Latarka ręczna', price: 50000, image: '/images/Latarka.png', desc: 'Latarka LED' },
  { id: 'magazynek_pistolet', name: 'Magazynek do pistoletu', price: 3800, image: '/images/magazynek_pistolet.png', desc: 'Standardowy magazynek' },
  { id: 'powiekszony_magazynek', name: 'Powiększony magazynek', price: 60000, image: '/images/Pow_magazynek.png', desc: 'Większa pojemność' },
  { id: 'zlote_malowanie', name: 'Złote malowanie', price: 280000, image: '/images/Złote_malowanie.png', desc: 'Złoty wygląd broni' }
];

const standaloneMinigames = {
  cutting: {
    id: 'cutting',
    name: 'Cięcie laserowe',
    icon: 'fa-scissors',
    duration: 18000,
    difficulty: 'Średni',
    workstation: 'metal',
    minigameType: 'laser_cut',
    inputs: {}, outputs: {}
  },
  assembly: {
    id: 'assembly',
    name: 'Montaż taśmowy',
    icon: 'fa-vest',
    duration: 20000,
    difficulty: 'Trudny',
    workstation: 'assembly',
    minigameType: 'sequence',
    inputs: {}, outputs: {}
  },
  calibration: {
    id: 'calibration',
    name: 'Kalibracja prasy',
    icon: 'fa-wave-square',
    duration: 12000,
    difficulty: 'Łatwy',
    workstation: 'paint',
    minigameType: 'timing',
    inputs: {}, outputs: {}
  },
  scan: {
    id: 'scan',
    name: 'Skan jakości',
    icon: 'fa-magnifying-glass-chart',
    duration: 16000,
    difficulty: 'Elite',
    workstation: 'paint',
    minigameType: 'scan_grid',
    inputs: {}, outputs: {}
  },
  overheat: {
    id: 'overheat',
    name: 'Chłodzenie reaktora',
    icon: 'fa-temperature-three-quarters',
    duration: 22000,
    difficulty: 'Trudny',
    workstation: 'polymer',
    minigameType: 'overheat',
    inputs: {}, outputs: {}
  }
};

/* =========================
   HELPERS
   ========================= */

function safeText(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function formatPrice(price) {
  return '$' + Number(price || 0).toLocaleString('pl-PL');
}

function formatSeconds(value) {
  return Math.max(0, Number(value || 0)).toFixed(1) + 's';
}

function isStandaloneMinigame(id) {
  return Object.prototype.hasOwnProperty.call(standaloneMinigames, id);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getDifficultyLabelForEntity(entity) {
  return entity && entity.difficulty ? entity.difficulty : 'Średni';
}

function mapDifficultyClass(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'łatwy') return 'easy';
  if (d === 'średni') return 'medium';
  if (d === 'trudny') return 'hard';
  return 'elite';
}

function showNotification(title, message, type) {
  const old = document.querySelector('.armor-notify');
  if (old) old.remove();

  const n = document.createElement('div');
  n.className = 'armor-notify';
  n.style.cssText = [
    'position:fixed',
    'top:20px',
    'right:20px',
    'z-index:12000',
    'min-width:300px',
    'max-width:420px',
    'padding:14px 16px',
    'border-radius:16px',
    'backdrop-filter:blur(14px)',
    'box-shadow:0 18px 50px rgba(0,0,0,.35)',
    'border:1px solid rgba(0,234,255,.28)',
    'background:rgba(9,14,24,.96)',
    'color:#effbff'
  ].join(';');

  const colorMap = {
    success: '#37ff9c',
    error: '#ff4b73',
    warning: '#ff9d00',
    info: '#00eaff'
  };

  n.innerHTML = '' +
    '<div style="font-family:Orbitron,sans-serif;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:' + (colorMap[type] || '#00eaff') + ';margin-bottom:6px;">' + safeText(title) + '</div>' +
    '<div style="color:rgba(239,251,255,.78);line-height:1.55;">' + safeText(message) + '</div>';

  document.body.appendChild(n);
  setTimeout(function() { if (n) n.remove(); }, 4200);
}

async function validateDiscountCode(code) {
  if (!code) return { valid: false, discount: 0 };

  try {
    const response = await fetch('/api/validate-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: String(code).trim().toUpperCase() })
    });

    if (!response.ok) return { valid: false, discount: 0 };
    return await response.json();
  } catch (error) {
    console.log('Error validating discount:', error);
    return { valid: false, discount: 0 };
  }
}

function saveGame() {
  localStorage.setItem('armor_playerInventory', JSON.stringify(playerInventory));
  localStorage.setItem('armor_productionProgress', JSON.stringify(productionProgress));
  localStorage.setItem('armor_resources', JSON.stringify(resources));
  localStorage.setItem('armor_selectedCategory', selectedCategory);
  localStorage.setItem('armor_currentTab', currentTab);
}

function loadGame() {
  const savedInventory = localStorage.getItem('armor_playerInventory');
  const savedProgress = localStorage.getItem('armor_productionProgress');
  const savedResources = localStorage.getItem('armor_resources');
  const savedCategory = localStorage.getItem('armor_selectedCategory');
  const savedTab = localStorage.getItem('armor_currentTab');

  playerInventory = savedInventory ? JSON.parse(savedInventory) : {};
  productionProgress = savedProgress ? JSON.parse(savedProgress) : {};
  resources = savedResources ? JSON.parse(savedResources) : resources;
  selectedCategory = savedCategory || 'all';
  currentTab = savedTab || 'shop';
}

/* =========================
   INIT
   ========================= */

document.addEventListener('DOMContentLoaded', function() {
  loadGame();
  initTabs();
  initCategoryFilters();
  renderResources();
  renderWorkstations();
  renderProductionPanel();
  renderShopProducts();
  renderProductionProducts();
  bindShopSearch();
  bindProductionSearch();

  if (currentTab === 'production') {
    const tab = document.querySelector('[data-tab="production"]');
    if (tab) tab.click();
  }
  if (currentTab === 'minigames') {
    const tab = document.querySelector('[data-tab="minigames"]');
    if (tab) tab.click();
  }
});

function initTabs() {
  document.querySelectorAll('.shop-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      currentTab = this.dataset.tab;
      document.querySelectorAll('.shop-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');

      const shopSection = document.getElementById('shop-section');
      const prodSection = document.getElementById('production-section');
      const miniSection = document.getElementById('minigames-section');

      if (shopSection) shopSection.classList.add('hidden');
      if (prodSection) prodSection.classList.add('hidden');
      if (miniSection) miniSection.classList.add('hidden');

      if (currentTab === 'shop' && shopSection) shopSection.classList.remove('hidden');
      if (currentTab === 'production' && prodSection) prodSection.classList.remove('hidden');
      if (currentTab === 'minigames' && miniSection) miniSection.classList.remove('hidden');

      saveGame();
    });
  });
}

function initCategoryFilters() {
  const row = document.getElementById('category-filters');
  if (!row) return;

  row.innerHTML = categories.map(function(cat) {
    return '<button class="category-btn' + (selectedCategory === cat.id ? ' active' : '') + '" type="button" data-category="' + cat.id + '"><i class="fas ' + cat.icon + '"></i> ' + cat.name + '</button>';
  }).join('');

  row.querySelectorAll('[data-category]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedCategory = this.dataset.category;
      row.querySelectorAll('[data-category]').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      renderProductionProducts();
      saveGame();
    });
  });
}

function bindShopSearch() {
  const input = document.querySelector('[data-shop-search]');
  const filter = document.querySelector('[data-shop-filter]');
  const sort = document.querySelector('[data-shop-sort]');
  const refresh = document.querySelector('[data-refresh-shop]');

  if (input) input.addEventListener('input', renderShopProducts);
  if (filter) filter.addEventListener('change', renderShopProducts);
  if (sort) sort.addEventListener('change', renderShopProducts);
  if (refresh) refresh.addEventListener('click', function() {
    renderShopProducts();
    showNotification('Sklep', 'Lista produktów została odświeżona.', 'info');
  });
}

function bindProductionSearch() {
  const input = document.querySelector('[data-production-search]');
  const sort = document.querySelector('[data-production-sort]');
  if (input) input.addEventListener('input', renderProductionProducts);
  if (sort) sort.addEventListener('change', renderProductionProducts);
}

/* =========================
   RENDERING
   ========================= */

function renderProductionPanel() {
  const panel = document.getElementById('production-panel');
  if (!panel) return;

  let inProgress = 0;
  let completed = 0;
  let ready = 0;

  Object.keys(productionProgress).forEach(function(key) {
    const prog = productionProgress[key];
    if (prog) {
      if (prog.status === 'completed') completed++;
      else if (prog.status === 'in_progress') inProgress++;
    }
  });

  Object.keys(playerInventory).forEach(function(key) {
    if (playerInventory[key] > 0) ready += playerInventory[key];
  });

  panel.innerHTML = '' +
    '<div class="panel-stat"><div class="panel-stat-icon"><i class="fas fa-cogs"></i></div><div class="panel-stat-value">' + inProgress + '</div><div class="panel-stat-label">W produkcji</div></div>' +
    '<div class="panel-stat"><div class="panel-stat-icon"><i class="fas fa-check-circle"></i></div><div class="panel-stat-value">' + completed + '</div><div class="panel-stat-label">Ukończono</div></div>' +
    '<div class="panel-stat"><div class="panel-stat-icon"><i class="fas fa-boxes"></i></div><div class="panel-stat-value">' + ready + '</div><div class="panel-stat-label">Gotowe</div></div>';
}

function renderResources() {
  const container = document.getElementById('resources-panel');
  if (!container) return;

  const entries = Object.entries(resources);
  container.innerHTML = entries.map(function(entry) {
    const isLow = entry[1] < 3;
    return '<article class="resource-card"><div class="resource-top"><div><div class="resource-icon"><i class="fas fa-cubes"></i></div><h3 class="workstation-name">' + entry[0] + '</h3></div><div class="resource-value' + (isLow ? ' low' : '') + '">' + entry[1] + '</div></div><p class="resource-meta">' + (isLow ? 'Niski stan zasobu.' : 'Zasób gotowy do użycia.') + '</p></article>';
  }).join('');
}

function renderWorkstations() {
  const container = document.getElementById('workstations');
  if (!container) return;

  container.innerHTML = Object.keys(workstations).map(function(key) {
    const ws = workstations[key];
    return '<article class="workstation-card"><div class="workstation-icon"><i class="fas ' + ws.icon + '"></i></div><h3 class="workstation-name">' + ws.name + '</h3><p class="workstation-desc">' + ws.desc + '</p><div class="workstation-status">Gotowe do pracy</div></article>';
  }).join('');
}

function renderShopProducts() {
  const grid = document.getElementById('shop-products');
  if (!grid) return;

  const query = (document.querySelector('[data-shop-search]')?.value || '').toLowerCase().trim();
  const filter = document.querySelector('[data-shop-filter]')?.value || 'all';
  const sort = document.querySelector('[data-shop-sort]')?.value || 'name-asc';

  let products = shopProducts.slice();

  if (query) {
    products = products.filter(function(p) {
      return p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
    });
  }

  if (filter !== 'all') {
    const map = {
      vest: 'vests',
      accessory: ['magazines', 'lights', 'holsters'],
      special: 'paint'
    };

    products = products.filter(function(p) {
      const cat = productionData[p.id] ? productionData[p.id].category : '';
      if (Array.isArray(map[filter])) return map[filter].includes(cat);
      return cat === map[filter];
    });
  }

  if (sort === 'name-asc') products.sort(function(a, b) { return a.name.localeCompare(b.name, 'pl'); });
  if (sort === 'price-asc') products.sort(function(a, b) { return a.price - b.price; });
  if (sort === 'price-desc') products.sort(function(a, b) { return b.price - a.price; });

  grid.innerHTML = products.map(function(product) {
    const inInv = playerInventory[product.id] || 0;
    return '' +
      '<article class="shop-card" data-product-id="' + product.id + '">' +
        '<div class="shop-image-wrap"><img src="' + product.image + '" alt="' + safeText(product.name) + '" /></div>' +
        '<div>' +
          '<h3 class="shop-name">' + product.name + '</h3>' +
          '<p class="shop-desc">' + product.desc + '</p>' +
          '<div class="shop-meta"><span class="tag"><i class="fas fa-box"></i> Na stanie: ' + inInv + '</span></div>' +
        '</div>' +
        '<div class="shop-side"><div class="price">' + formatPrice(product.price) + '</div><button class="buy-btn" type="button" onclick="initiatePurchase(\'' + product.id + '\')">Kup</button></div>' +
      '</article>';
  }).join('');
}

function renderProductionProducts() {
  const grid = document.getElementById('production-grid');
  if (!grid) return;

  const query = (document.querySelector('[data-production-search]')?.value || '').toLowerCase().trim();
  const sort = document.querySelector('[data-production-sort]')?.value || 'name-asc';

  let products = Object.values(productionData);
  if (selectedCategory !== 'all') {
    products = products.filter(function(p) { return p.category === selectedCategory; });
  }
  if (query) {
    products = products.filter(function(p) {
      return p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
    });
  }

  if (sort === 'name-asc') products.sort(function(a, b) { return a.name.localeCompare(b.name, 'pl'); });
  if (sort === 'difficulty-asc') products.sort(function(a, b) { return difficultyOrder(a.difficulty) - difficultyOrder(b.difficulty); });
  if (sort === 'time-asc') products.sort(function(a, b) { return totalStageTime(a) - totalStageTime(b); });

  if (products.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Brak produktów w tej kategorii</p></div>';
    return;
  }

  grid.innerHTML = products.map(function(p) {
    const prog = productionProgress[p.id] || { currentStage: 1, stageProgress: 0, status: 'not_started' };
    const inInv = playerInventory[p.id] || 0;
    const totalTime = totalStageTime(p);

    let statusText = 'Nie rozpoczęto';
    if (prog.status === 'completed') statusText = 'Gotowe';
    else if (prog.status === 'in_progress') statusText = 'Etap ' + prog.currentStage + '/' + p.stages.length;

    return '' +
      '<article class="recipe-card">' +
        '<div class="recipe-top">' +
          '<div class="recipe-image"><img src="' + p.image + '" alt="' + safeText(p.name) + '" /></div>' +
          '<div><h3 class="recipe-title">' + p.name + '</h3><p class="recipe-desc">' + p.desc + '</p>' +
          '<div class="shop-meta" style="margin-top:10px;">' +
            '<span class="difficulty-badge ' + mapDifficultyClass(p.difficulty) + '">' + p.difficulty + '</span>' +
            '<span class="station-badge"><i class="fas fa-clock"></i> ' + Math.round(totalTime / 1000) + ' s</span>' +
          '</div></div>' +
          '<div class="recipe-right"><div class="recipe-status">' + statusText + (inInv > 0 ? ' | ' + inInv + ' szt.' : '') + '</div><div class="recipe-time">' + p.stages.length + ' etapów</div></div>' +
        '</div>' +
        '<div class="stage-list">' + renderModernStages(p.id) + '</div>' +
        '<div class="recipe-footer"><div class="shop-meta"><span class="reward-badge"><i class="fas fa-coins"></i> Wartość: ' + formatPrice(p.price) + '</span></div><button class="craft-btn" type="button" onclick="startProduction(\'' + p.id + '\')">Rozpocznij craft</button></div>' +
      '</article>';
  }).join('');
}

function renderModernStages(productId) {
  const p = productionData[productId];
  return p.stages.map(function(stage) {
    const ws = workstations[stage.workstation];
    return '<article class="stage-item"><div class="stage-head"><div class="stage-title"><span class="stage-dot"><i class="fas ' + stage.icon + '"></i></span>' + stage.name + '</div><span class="station-badge"><i class="fas ' + ws.icon + '"></i> ' + ws.name + '</span></div><div class="stage-columns"><div class="io-card"><div class="io-label">Wejście</div>' +
      Object.entries(stage.inputs).map(function(item) {
        return '<div class="io-row"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join('') +
      '</div><div class="io-arrow"><i class="fas fa-arrow-right"></i></div><div class="io-card"><div class="io-label">Wynik</div>' +
      Object.entries(stage.outputs).map(function(item) {
        return '<div class="io-row"><span>' + item[0] + '</span><strong>+' + item[1] + '</strong></div>';
      }).join('') +
      '</div></div><div class="shop-meta" style="margin-top:12px;"><span class="tag"><i class="fas fa-gamepad"></i> ' + stage.minigameType + '</span></div></article>';
  }).join('');
}

function difficultyOrder(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'łatwy') return 1;
  if (d === 'średni') return 2;
  if (d === 'trudny') return 3;
  return 4;
}

function totalStageTime(product) {
  return product.stages.reduce(function(sum, s) { return sum + s.duration; }, 0);
}

/* =========================
   RESOURCES / PRODUCTION
   ========================= */

function canStartStage(stage) {
  return Object.entries(stage.inputs).every(function(entry) {
    return (resources[entry[0]] || 0) >= entry[1];
  });
}

function hasEnoughResources(inputs) {
  return Object.entries(inputs).every(function(entry) {
    return (resources[entry[0]] || 0) >= entry[1];
  });
}

function consumeResources(inputs) {
  Object.entries(inputs).forEach(function(entry) {
    resources[entry[0]] = (resources[entry[0]] || 0) - entry[1];
  });
}

function addResources(outputs) {
  Object.entries(outputs).forEach(function(entry) {
    resources[entry[0]] = (resources[entry[0]] || 0) + entry[1];
  });
}

function addTestResources() {
  const starterPack = {
    'włókno techniczne': 20,
    'kevlar surowy': 15,
    'stal surowa': 15,
    'polimer': 15,
    'aluminium surowe': 10,
    'szkło techniczne': 10,
    'ogniwo zasilające': 10,
    'skóra techniczna': 10,
    'chemikalia przemysłowe': 8,
    'pigment premium': 8
  };

  Object.entries(starterPack).forEach(function(entry) {
    resources[entry[0]] = (resources[entry[0]] || 0) + entry[1];
  });

  saveGame();
  renderResources();
  renderProductionProducts();
  showNotification('Zasoby dodane', 'Dodano pakiet testowy surowców.', 'success');
}
window.addTestResources = addTestResources;

function resetGame() {
  playerInventory = {};
  productionProgress = {};
  resources = {
    'włókno techniczne': 50,
    'kevlar surowy': 30,
    'stal surowa': 25,
    'polimer': 20,
    'aluminium surowe': 15,
    'szkło techniczne': 10,
    'ogniwo zasilające': 10,
    'skóra techniczna': 8,
    'chemikalia przemysłowe': 5,
    'pigment premium': 5
  };
  saveGame();
  renderResources();
  renderShopProducts();
  renderProductionProducts();
  renderProductionPanel();
  showNotification('Reset', 'Zresetowano postęp gry.', 'info');
}
window.resetGame = resetGame;

function startProduction(productId) {
  const p = productionData[productId];
  const prog = productionProgress[productId] || { currentStage: 1, stageProgress: 0, status: 'not_started' };

  if (prog.status === 'completed') {
    playerInventory[productId] = (playerInventory[productId] || 0) + 1;
    productionProgress[productId] = { currentStage: 1, stageProgress: 0, status: 'not_started' };
    showNotification('Produkcja zakończona', 'Wyprodukowano: ' + p.name, 'success');
    renderProductionProducts();
    renderShopProducts();
    renderProductionPanel();
    saveGame();
    return;
  }

  const currentStageNum = prog.currentStage;
  const stage = p.stages[currentStageNum - 1];
  if (!stage) return;

  if (!hasEnoughResources(stage.inputs)) {
    showNotification('Brak surowców', 'Nie masz wymaganych materiałów do tego etapu.', 'error');
    return;
  }

  showMinigame(productId, currentStageNum, stage);
}
window.startProduction = startProduction;

function updateProductionAfterSuccess(productId, stageNum, score, quality) {
  const product = productionData[productId];
  const stage = product.stages[stageNum - 1];

  consumeResources(stage.inputs);
  addResources(stage.outputs);

  if (!productionProgress[productId]) {
    productionProgress[productId] = { currentStage: 1, stageProgress: 0, status: 'not_started' };
  }

  const prog = productionProgress[productId];
  if (stageNum >= product.stages.length) {
    prog.status = 'completed';
    prog.currentStage = product.stages.length;
    prog.stageProgress = 100;
  } else {
    prog.currentStage = stageNum + 1;
    prog.stageProgress = 0;
    prog.status = 'in_progress';
  }

  const outputText = Object.entries(stage.outputs).map(function(entry) {
    return entry[0] + ' x' + entry[1];
  }).join(', ');

  showNotification('Sukces', 'Otrzymano: ' + outputText + ' | Jakość: ' + quality + ' | Wynik: ' + score + '%', 'success');
  renderProductionProducts();
  renderProductionPanel();
  renderResources();
  saveGame();
}

/* =========================
   PURCHASE
   ========================= */

function initiatePurchase(productId) {
  const product = shopProducts.find(function(p) { return p.id === productId; });
  if (!product) return;

  const modal = document.getElementById('purchaseModal');
  if (!modal) {
    showNotification('Zakup', 'Modal zakupu nie został znaleziony w HTML.', 'warning');
    return;
  }

  const name = document.getElementById('modalProductName');
  const base = document.getElementById('modalBasePrice');
  const final = document.getElementById('modalFinalPrice');
  const discount = document.getElementById('modalDiscount');
  const code = document.getElementById('discount-code');

  if (name) name.value = product.name;
  if (base) base.textContent = formatPrice(product.price);
  if (final) final.textContent = formatPrice(product.price);
  if (discount) discount.textContent = '—';
  if (code) code.value = '';

  modal.classList.add('show');

  const confirm = document.getElementById('confirmPurchaseBtn');
  if (confirm) {
    confirm.onclick = async function() {
      const discountCode = code ? code.value.trim() : '';
      let finalPrice = product.price;

      if (discountCode) {
        currentDiscountState = await validateDiscountCode(discountCode);
        if (currentDiscountState.valid) {
          finalPrice = Math.round(product.price * (1 - currentDiscountState.discount / 100));
          if (discount) discount.textContent = '-' + currentDiscountState.discount + '%';
        } else {
          if (discount) discount.textContent = 'Nieprawidłowy';
        }
      }

      if (final) final.textContent = formatPrice(finalPrice);
      modal.classList.remove('show');
      showNotification('Zamówienie', 'Zamówienie na ' + product.name + ' zostało przygotowane.', 'success');
    };
  }
}
window.initiatePurchase = initiatePurchase;

/* =========================
   MINIGAME ENGINE
   ========================= */

const LASER_BG = 'linear-gradient(180deg, rgba(220,220,220,.08), rgba(80,80,80,.14))';
let armorAudioCtx = null;
let armorLaserLoop = null;

function getArmorAudioCtx() {
  if (!armorAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    armorAudioCtx = new Ctx();
  }
  if (armorAudioCtx.state === 'suspended') armorAudioCtx.resume().catch(function() {});
  return armorAudioCtx;
}

function playSynthClick() {
  const ctx = getArmorAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(420, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.1);
}

function playSynthSuccess() {
  const ctx = getArmorAudioCtx();
  if (!ctx) return;
  [440, 660, 880].forEach(function(freq, idx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const offset = idx * 0.08;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.2);
  });
}

function playSynthFail() {
  const ctx = getArmorAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(170, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.42);
}

function startLaserLoopSound() {
  const ctx = getArmorAudioCtx();
  if (!ctx || armorLaserLoop) return;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  osc1.frequency.value = 170;
  osc2.frequency.value = 340;
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  gain.gain.value = 0.0001;
  osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.08);
  osc1.start(); osc2.start();
  armorLaserLoop = { osc1: osc1, osc2: osc2, gain: gain };
}

function stopLaserLoopSound() {
  const ctx = getArmorAudioCtx();
  if (!ctx || !armorLaserLoop) return;
  try {
    armorLaserLoop.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    armorLaserLoop.osc1.stop(ctx.currentTime + 0.1);
    armorLaserLoop.osc2.stop(ctx.currentTime + 0.1);
  } catch (e) {}
  armorLaserLoop = null;
}

function safeRemoveMinigameModal() {
  const modal = document.getElementById('minigame-modal');
  if (modal) modal.remove();
}

function cleanupMinigameTimers() {
  if (!currentMinigame) return;
  clearInterval(currentMinigame.timerInterval);
  clearInterval(currentMinigame.renderInterval);
  clearTimeout(currentMinigame.moveTimeout);
  clearTimeout(currentMinigame.flashTimeout);
  if (currentMinigame.rafId) cancelAnimationFrame(currentMinigame.rafId);
  if (currentMinigame.cleanupEvents) currentMinigame.cleanupEvents();
  stopLaserLoopSound();
}

function resolveMinigameType(stageConfig) {
  return stageConfig.minigameType || 'timing';
}

function getStageConfig(productId, stage) {
  return stage || standaloneMinigames[productId] || { name: 'Minigra', icon: 'fa-gamepad', duration: 12000, difficulty: 'Średni', minigameType: 'timing', inputs: {}, outputs: {} };
}

function showMinigame(productId, stageNum, stage) {
  if (minigameActive) {
    showNotification('Minigra aktywna', 'Zakończ najpierw trwającą grę.', 'warning');
    return;
  }

  const stageConfig = getStageConfig(productId, stage);
  const minigameType = resolveMinigameType(stageConfig);

  minigameActive = true;
  currentMinigame = {
    productId: productId,
    stageNum: stageNum,
    stage: stageConfig,
    type: minigameType,
    difficulty: getDifficultyLabelForEntity(stageConfig),
    timeLeft: stageConfig.duration / 1000,
    score: 0,
    clicks: 0,
    success: false
  };

  if (minigameType === 'laser_cut') return showLaserCutMinigame();
  if (minigameType === 'overheat') return showOverheatMinigame();
  if (minigameType === 'sequence') return showSequenceMinigame();
  if (minigameType === 'scan_grid') return showScanGridMinigame();
  return showTimingMinigame();
}
window.showMinigame = showMinigame;

function finalizeMinigameResult(result) {
  if (!currentMinigame) return;

  cleanupMinigameTimers();
  minigameActive = false;
  safeRemoveMinigameModal();

  const score = result.score;
  const quality = result.quality;
  const success = result.success;

  if (isStandaloneMinigame(currentMinigame.productId)) {
    if (success) {
      playSynthSuccess();
      showNotification('Sukces', currentMinigame.stage.name + ' ukończone | Jakość: ' + quality + ' | Wynik: ' + score + '%', 'success');
    } else {
      playSynthFail();
      showNotification('Porażka', currentMinigame.stage.name + ' nieudane | Jakość: ' + quality + ' | Wynik: ' + score + '%', 'error');
    }
    currentMinigame = null;
    return;
  }

  if (success) {
    playSynthSuccess();
    updateProductionAfterSuccess(currentMinigame.productId, currentMinigame.stageNum, score, quality);
  } else {
    playSynthFail();
    showNotification('Porażka', currentMinigame.stage.name + ' nieudane | Jakość: ' + quality + ' | Wynik: ' + score + '%', 'error');
  }

  currentMinigame = null;
}

function cancelMinigame() {
  if (!minigameActive) return;
  cleanupMinigameTimers();
  minigameActive = false;
  safeRemoveMinigameModal();
  currentMinigame = null;
  showNotification('Anulowano', 'Minigra została przerwana.', 'info');
}
window.cancelMinigame = cancelMinigame;

/* =========================
   SHARED MODAL + STYLES
   ========================= */

function injectMinigameStyles() {
  if (document.getElementById('armor-minigame-styles')) return;
  const s = document.createElement('style');
  s.id = 'armor-minigame-styles';
  s.textContent = `
    .minigame-modal{position:fixed;inset:0;z-index:12000;background:rgba(4,7,12,.88);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(10px)}
    .minigame-content{width:min(980px,100%);background:linear-gradient(180deg,rgba(15,20,30,.98),rgba(8,12,20,.98));border:1px solid rgba(0,234,255,.18);border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,.5);padding:22px;color:#effbff}
    .minigame-header h2{margin:0 0 8px;font-family:Orbitron,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#00eaff;font-size:1.15rem}
    .minigame-header p{margin:0 0 16px;color:rgba(239,251,255,.66);line-height:1.55}
    .mg-top{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
    .mg-stat{min-height:48px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;gap:10px;font-family:Orbitron,sans-serif;font-size:.8rem;letter-spacing:.05em;text-transform:uppercase}
    .mg-board{position:relative;min-height:420px;border-radius:20px;overflow:hidden;border:1px solid rgba(0,234,255,.16);background:rgba(255,255,255,.03)}
    .mg-actions{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-top:16px}
    .mg-btn,.cancel-btn{min-height:48px;padding:0 16px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#effbff;cursor:pointer;font-family:inherit}
    .mg-btn.primary{border:none;background:linear-gradient(135deg,#00eaff,#00a1af);color:#031018;font-family:Orbitron,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
    .laser-spark{position:absolute;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff6c7 0%,#ffd970 38%,#ff8c00 70%,rgba(255,140,0,0) 100%);box-shadow:0 0 16px rgba(255,186,50,.9),0 0 30px rgba(255,90,0,.55);pointer-events:none;z-index:5;animation:laserSparkFly .45s ease-out forwards}
    .laser-burn{position:absolute;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,rgba(255,90,40,.45),rgba(255,90,40,.12) 60%,rgba(255,90,40,0) 100%);pointer-events:none;z-index:3;mix-blend-mode:screen}
    .assembly-slot{min-height:86px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:Orbitron,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:12px;text-align:center}
    .scan-cell{aspect-ratio:1/1;border-radius:14px;border:1px solid rgba(0,234,255,.14);background:rgba(255,255,255,.03);cursor:pointer;position:relative}
    .scan-cell.active{background:rgba(255,75,115,.18);border-color:rgba(255,75,115,.45);box-shadow:0 0 26px rgba(255,75,115,.18) inset}
    .timing-bar{height:34px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);position:relative}
    .timing-zone{position:absolute;left:44%;width:12%;top:0;bottom:0;background:rgba(55,255,156,.18);border-left:1px solid rgba(55,255,156,.55);border-right:1px solid rgba(55,255,156,.55)}
    .timing-marker{position:absolute;top:5px;bottom:5px;width:10px;border-radius:8px;background:#ffe37a;box-shadow:0 0 12px rgba(255,227,122,.55)}
    @keyframes laserSparkFly{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.15)}}
    @media (max-width:760px){.mg-top{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function createMinigameShell(title, subtitle) {
  injectMinigameStyles();
  safeRemoveMinigameModal();
  const modal = document.createElement('div');
  modal.className = 'minigame-modal';
  modal.id = 'minigame-modal';
  modal.innerHTML = '' +
    '<div class="minigame-content">' +
      '<div class="minigame-header"><h2>' + title + '</h2><p>' + subtitle + '</p></div>' +
      '<div class="mg-top" id="mg-top"></div>' +
      '<div class="mg-board" id="mg-board"></div>' +
      '<div class="mg-actions"><div id="mg-subinfo" style="color:rgba(239,251,255,.72)"></div><button class="cancel-btn" type="button" onclick="cancelMinigame()">Anuluj</button></div>' +
    '</div>';
  document.body.appendChild(modal);
  return {
    top: modal.querySelector('#mg-top'),
    board: modal.querySelector('#mg-board'),
    subinfo: modal.querySelector('#mg-subinfo')
  };
}

/* =========================
   LASER CUT
   ========================= */

function getLaserSuccessThreshold(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'łatwy') return 62;
  if (d === 'średni') return 72;
  if (d === 'trudny') return 80;
  return 86;
}

function getLaserShapesByDifficulty(diff) {
  const d = String(diff || '').toLowerCase();
  const easy = [[{x:160,y:140},{x:800,y:140},{x:860,y:200},{x:860,y:420},{x:800,y:480},{x:160,y:480},{x:100,y:420},{x:100,y:200},{x:160,y:140}]];
  const medium = [[{x:150,y:130},{x:760,y:130},{x:860,y:190},{x:860,y:320},{x:760,y:450},{x:640,y:490},{x:340,y:490},{x:220,y:450},{x:120,y:320},{x:120,y:190},{x:150,y:130}],[{x:150,y:130},{x:350,y:130},{x:480,y:180},{x:640,y:130},{x:830,y:130},{x:880,y:250},{x:780,y:470},{x:600,y:500},{x:260,y:500},{x:100,y:340},{x:100,y:220},{x:150,y:130}]];
  const hard = [[{x:130,y:120},{x:300,y:120},{x:430,y:170},{x:560,y:120},{x:760,y:120},{x:880,y:210},{x:910,y:330},{x:820,y:470},{x:680,y:520},{x:340,y:520},{x:180,y:470},{x:100,y:330},{x:100,y:200},{x:130,y:120}]];
  const elite = [[{x:130,y:120},{x:240,y:120},{x:330,y:155},{x:430,y:155},{x:500,y:115},{x:590,y:155},{x:690,y:155},{x:790,y:120},{x:880,y:170},{x:920,y:280},{x:900,y:390},{x:820,y:500},{x:660,y:550},{x:340,y:550},{x:170,y:500},{x:90,y:390},{x:80,y:250},{x:130,y:120}]];
  if (d === 'łatwy') return easy;
  if (d === 'średni') return medium;
  if (d === 'trudny') return hard;
  return elite;
}

function pickRandomLaserShape(diff) {
  const shapes = getLaserShapesByDifficulty(diff);
  return shapes[Math.floor(Math.random() * shapes.length)];
}

function pointDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPathTotalLength(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += pointDistance(path[i], path[i + 1]);
  return total;
}

function projectToSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return { x: a.x + abx * t, y: a.y + aby * t, t: t };
}

function getClosestPathData(point, path, totalLength) {
  let best = null;
  let runningLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const segmentLength = pointDistance(a, b);
    const proj = projectToSegment(point, a, b);
    const d = pointDistance(point, proj);
    if (!best || d < best.distance) {
      best = { distance: d, point: proj, lengthAtPoint: runningLength + segmentLength * proj.t };
    }
    runningLength += segmentLength;
  }
  return best;
}

function getToleranceByDifficulty(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'łatwy') return 32;
  if (d === 'średni') return 26;
  if (d === 'trudny') return 22;
  return 18;
}

function showLaserCutMinigame() {
  const ui = createMinigameShell('<i class="fas fa-scissors"></i> ' + currentMinigame.stage.name, 'Przytrzymaj LPM i prowadź narzędzie po linii cięcia. Im dokładniej tniesz metal, tym wyższa jakość.');

  const path = pickRandomLaserShape(currentMinigame.difficulty);
  const totalLength = getPathTotalLength(path);
  const start = path[0];
  const end = path[path.length - 2] || path[path.length - 1];

  currentMinigame.path = path;
  currentMinigame.totalLength = totalLength;
  currentMinigame.samples = 0;
  currentMinigame.goodSamples = 0;
  currentMinigame.maxProgress = 0;
  currentMinigame.userPoints = [];
  currentMinigame.drawing = false;
  currentMinigame.started = false;
  currentMinigame.lastSparkAt = 0;

  ui.top.innerHTML = '' +
    '<div class="mg-stat"><i class="fas fa-clock"></i> <span id="laser-time">' + formatSeconds(currentMinigame.timeLeft) + '</span></div>' +
    '<div class="mg-stat"><i class="fas fa-crosshairs"></i> Dokładność: <span id="laser-accuracy">0%</span></div>' +
    '<div class="mg-stat"><i class="fas fa-route"></i> Postęp: <span id="laser-progress">0%</span></div>';

  ui.subinfo.textContent = 'Startuj przy znaczniku START, trzymaj się konturu i dojedź do końca.';

  ui.board.style.background = LASER_BG;
  ui.board.innerHTML = '' +
    '<svg id="laser-svg" viewBox="0 0 1000 620" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;z-index:2">' +
      '<polyline id="laser-guide-shadow" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
      '<polyline id="laser-guide" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="12" stroke-dasharray="8 12" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
      '<polyline id="laser-guide-core" fill="none" stroke="rgba(0,234,255,.28)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
      '<polyline id="laser-progress-line" fill="none" stroke="#00eaff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
      '<circle id="laser-head" r="11" fill="#ff5d7f" stroke="#fff2f5" stroke-width="3"></circle>' +
    '</svg>' +
    '<div style="position:absolute;left:' + start.x + 'px;top:' + (start.y - 28) + 'px;transform:translate(-50%,-50%);padding:8px 12px;border-radius:999px;background:rgba(8,13,22,.86);border:1px solid rgba(0,234,255,.14);font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;z-index:4">Start</div>' +
    '<div style="position:absolute;left:' + end.x + 'px;top:' + (end.y - 28) + 'px;transform:translate(-50%,-50%);padding:8px 12px;border-radius:999px;background:rgba(8,13,22,.86);border:1px solid rgba(0,234,255,.14);font-family:Orbitron,sans-serif;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;z-index:4">Koniec</div>';

  const guideShadow = ui.board.querySelector('#laser-guide-shadow');
  const guide = ui.board.querySelector('#laser-guide');
  const guideCore = ui.board.querySelector('#laser-guide-core');
  const progressLine = ui.board.querySelector('#laser-progress-line');
  const laserHead = ui.board.querySelector('#laser-head');
  const timeEl = ui.top.querySelector('#laser-time');
  const accuracyEl = ui.top.querySelector('#laser-accuracy');
  const progressEl = ui.top.querySelector('#laser-progress');

  const pointsString = path.map(function(p) { return p.x + ',' + p.y; }).join(' ');
  guideShadow.setAttribute('points', pointsString);
  guide.setAttribute('points', pointsString);
  guideCore.setAttribute('points', pointsString);
  laserHead.setAttribute('cx', start.x);
  laserHead.setAttribute('cy', start.y);

  function getPointerPos(event) {
    const rect = ui.board.getBoundingClientRect();
    const source = event.touches && event.touches.length ? event.touches[0] : event;
    return {
      x: ((source.clientX - rect.left) / rect.width) * 1000,
      y: ((source.clientY - rect.top) / rect.height) * 620
    };
  }

  function maybeSpawnSparks(point, intensity) {
    const now = Date.now();
    if (now - currentMinigame.lastSparkAt < 35) return;
    currentMinigame.lastSparkAt = now;

    for (let i = 0; i < 2 + Math.floor(intensity * 4); i++) {
      const spark = document.createElement('div');
      spark.className = 'laser-spark';
      spark.style.left = point.x + 'px';
      spark.style.top = point.y + 'px';
      spark.style.setProperty('--dx', ((Math.random() * 120) - 60) + 'px');
      spark.style.setProperty('--dy', ((Math.random() * 90) - 45) + 'px');
      ui.board.appendChild(spark);
      setTimeout(function() { spark.remove(); }, 480);
    }

    const burn = document.createElement('div');
    burn.className = 'laser-burn';
    burn.style.left = (point.x - 9) + 'px';
    burn.style.top = (point.y - 9) + 'px';
    ui.board.appendChild(burn);
    setTimeout(function() { burn.remove(); }, 180);
  }

  function refreshHud() {
    const accuracy = currentMinigame.samples > 0 ? Math.round((currentMinigame.goodSamples / currentMinigame.samples) * 100) : 0;
    const progress = Math.round(currentMinigame.maxProgress * 100);
    accuracyEl.textContent = accuracy + '%';
    progressEl.textContent = progress + '%';
  }

  function beginDrawing(event) {
    event.preventDefault();
    const pos = getPointerPos(event);
    if (pointDistance(pos, start) > 55) {
      playSynthClick();
      ui.subinfo.textContent = 'Zacznij bliżej punktu START.';
      return;
    }
    currentMinigame.started = true;
    currentMinigame.drawing = true;
    currentMinigame.userPoints = [start];
    progressLine.setAttribute('points', start.x + ',' + start.y);
    ui.subinfo.textContent = 'Cięcie aktywne. Trzymaj się konturu.';
    startLaserLoopSound();
  }

  function moveDrawing(event) {
    if (!currentMinigame.drawing) return;
    event.preventDefault();

    const pointer = getPointerPos(event);
    const closest = getClosestPathData(pointer, path, totalLength);
    const tolerance = getToleranceByDifficulty(currentMinigame.difficulty);
    const intensity = clamp(closest.distance / 42, 0, 1);

    currentMinigame.samples++;
    if (closest.distance <= tolerance) currentMinigame.goodSamples++;
    else maybeSpawnSparks(pointer, intensity);

    currentMinigame.maxProgress = Math.max(currentMinigame.maxProgress, closest.lengthAtPoint / totalLength);
    currentMinigame.userPoints.push(closest.point);
    progressLine.setAttribute('points', currentMinigame.userPoints.map(function(p) { return p.x + ',' + p.y; }).join(' '));
    laserHead.setAttribute('cx', closest.point.x);
    laserHead.setAttribute('cy', closest.point.y);
    refreshHud();

    if (currentMinigame.maxProgress >= 0.992 && pointDistance(closest.point, end) < 52) {
      finishLaserCutMinigame(true);
    }
  }

  function stopDrawing(event) {
    if (event) event.preventDefault();
    currentMinigame.drawing = false;
    stopLaserLoopSound();
  }

  currentMinigame.cleanupEvents = function() {
    ui.board.removeEventListener('mousedown', beginDrawing);
    ui.board.removeEventListener('mousemove', moveDrawing);
    window.removeEventListener('mouseup', stopDrawing);
    ui.board.removeEventListener('touchstart', beginDrawing);
    ui.board.removeEventListener('touchmove', moveDrawing);
    window.removeEventListener('touchend', stopDrawing);
  };

  ui.board.addEventListener('mousedown', beginDrawing);
  ui.board.addEventListener('mousemove', moveDrawing);
  window.addEventListener('mouseup', stopDrawing);
  ui.board.addEventListener('touchstart', beginDrawing, { passive: false });
  ui.board.addEventListener('touchmove', moveDrawing, { passive: false });
  window.addEventListener('touchend', stopDrawing, { passive: false });

  currentMinigame.timerInterval = setInterval(function() {
    currentMinigame.timeLeft -= 0.1;
    timeEl.textContent = formatSeconds(currentMinigame.timeLeft);
    if (currentMinigame.timeLeft <= 0) finishLaserCutMinigame(false);
  }, 100);

  refreshHud();
}

function finishLaserCutMinigame(reachedEnd) {
  if (!currentMinigame || currentMinigame.type !== 'laser_cut') return;
  const accuracy = currentMinigame.samples > 0 ? (currentMinigame.goodSamples / currentMinigame.samples) * 100 : 0;
  const progress = currentMinigame.maxProgress * 100;
  const timeBonus = clamp(currentMinigame.timeLeft * 0.65, 0, 10);
  const score = clamp(Math.round((accuracy * 0.68) + (progress * 0.24) + timeBonus), 0, 100);
  const threshold = getLaserSuccessThreshold(currentMinigame.difficulty);
  const success = reachedEnd && score >= threshold;
  const quality = score >= 93 ? 'Elite' : score >= 84 ? 'Premium' : score >= 72 ? 'Standard' : 'Fail';
  finalizeMinigameResult({ score: score, success: success, quality: quality });
}

/* =========================
   OVERHEAT
   ========================= */

function showOverheatMinigame() {
  const ui = createMinigameShell('<i class="fas fa-temperature-three-quarters"></i> ' + currentMinigame.stage.name, 'Utrzymaj temperaturę maszyny w bezpiecznym zakresie. Chłodzenie mocno zbija temperaturę, wentylacja daje oddech, redukcja mocy spowalnia wzrost.');

  currentMinigame.temperature = 42;
  currentMinigame.score = 0;
  currentMinigame.growth = 1.2;
  currentMinigame.reducedPowerUntil = 0;
  currentMinigame.coolingCooldown = 0;
  currentMinigame.ventilationCooldown = 0;
  currentMinigame.powerCooldown = 0;
  currentMinigame.dangerFrames = 0;

  ui.top.innerHTML = '' +
    '<div class="mg-stat"><i class="fas fa-clock"></i> <span id="oh-time">' + formatSeconds(currentMinigame.timeLeft) + '</span></div>' +
    '<div class="mg-stat"><i class="fas fa-temperature-three-quarters"></i> <span id="oh-temp">42°C</span></div>' +
    '<div class="mg-stat"><i class="fas fa-medal"></i> <span id="oh-score">0</span></div>';

  ui.board.innerHTML = '' +
    '<div style="padding:18px;display:grid;gap:18px;height:100%;align-content:start">' +
      '<div style="border:1px solid rgba(0,234,255,.16);border-radius:18px;background:rgba(255,255,255,.03);padding:18px">' +
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><div style="display:flex;align-items:center;gap:10px;font-family:Orbitron,sans-serif;text-transform:uppercase"><i class="fas fa-gauge-high"></i> Reaktor</div><div id="oh-status" style="font-family:Orbitron,sans-serif;color:#37ff9c">Stabilna</div></div>' +
        '<div style="height:30px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)"><div id="oh-fill" style="height:100%;width:42%;transition:.15s linear;background:linear-gradient(90deg,#37ff9c,#ffe37a,#ff9d00,#ff4b73)"></div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">' +
        '<button class="mg-btn" id="oh-cool"><i class="fas fa-snowflake"></i><br>Chłodzenie<br><small id="oh-cool-txt">-22°C</small></button>' +
        '<button class="mg-btn" id="oh-vent"><i class="fas fa-fan"></i><br>Wentylacja<br><small id="oh-vent-txt">-12°C</small></button>' +
        '<button class="mg-btn" id="oh-power"><i class="fas fa-bolt"></i><br>Redukcja mocy<br><small id="oh-power-txt">spowolnienie</small></button>' +
      '</div>' +
    '</div>';

  const timeEl = ui.top.querySelector('#oh-time');
  const tempEl = ui.top.querySelector('#oh-temp');
  const scoreEl = ui.top.querySelector('#oh-score');
  const statusEl = ui.board.querySelector('#oh-status');
  const fillEl = ui.board.querySelector('#oh-fill');
  const coolBtn = ui.board.querySelector('#oh-cool');
  const ventBtn = ui.board.querySelector('#oh-vent');
  const powerBtn = ui.board.querySelector('#oh-power');
  const coolTxt = ui.board.querySelector('#oh-cool-txt');
  const ventTxt = ui.board.querySelector('#oh-vent-txt');
  const powerTxt = ui.board.querySelector('#oh-power-txt');

  function applyCooldownState() {
    coolBtn.disabled = currentMinigame.coolingCooldown > 0;
    ventBtn.disabled = currentMinigame.ventilationCooldown > 0;
    powerBtn.disabled = currentMinigame.powerCooldown > 0;
    coolTxt.textContent = currentMinigame.coolingCooldown > 0 ? 'CD ' + currentMinigame.coolingCooldown + 's' : '-22°C';
    ventTxt.textContent = currentMinigame.ventilationCooldown > 0 ? 'CD ' + currentMinigame.ventilationCooldown + 's' : '-12°C';
    powerTxt.textContent = currentMinigame.powerCooldown > 0 ? 'CD ' + currentMinigame.powerCooldown + 's' : 'spowolnienie';
  }

  function refreshBoard() {
    const temp = currentMinigame.temperature;
    tempEl.textContent = Math.round(temp) + '°C';
    scoreEl.textContent = currentMinigame.score;
    timeEl.textContent = formatSeconds(currentMinigame.timeLeft);
    fillEl.style.width = clamp(temp, 0, 100) + '%';

    if (temp < 55) {
      statusEl.textContent = 'Stabilna';
      statusEl.style.color = '#37ff9c';
    } else if (temp < 75) {
      statusEl.textContent = 'Podwyższona';
      statusEl.style.color = '#ffe37a';
    } else if (temp < 90) {
      statusEl.textContent = 'Krytyczna';
      statusEl.style.color = '#ff9d00';
    } else {
      statusEl.textContent = 'Alarm';
      statusEl.style.color = '#ff4b73';
    }

    applyCooldownState();
  }

  coolBtn.addEventListener('click', function() {
    if (currentMinigame.coolingCooldown > 0) return;
    currentMinigame.temperature -= 22;
    currentMinigame.coolingCooldown = 5;
    currentMinigame.score += 8;
    playSynthClick();
    refreshBoard();
  });

  ventBtn.addEventListener('click', function() {
    if (currentMinigame.ventilationCooldown > 0) return;
    currentMinigame.temperature -= 12;
    currentMinigame.ventilationCooldown = 3;
    currentMinigame.score += 5;
    playSynthClick();
    refreshBoard();
  });

  powerBtn.addEventListener('click', function() {
    if (currentMinigame.powerCooldown > 0) return;
    currentMinigame.reducedPowerUntil = Date.now() + 3200;
    currentMinigame.powerCooldown = 7;
    currentMinigame.score += 6;
    playSynthClick();
    refreshBoard();
  });

  currentMinigame.timerInterval = setInterval(function() {
    currentMinigame.timeLeft -= 0.1;

    let growth = currentMinigame.growth;
    if (Date.now() < currentMinigame.reducedPowerUntil) growth *= 0.42;

    currentMinigame.temperature += growth;
    currentMinigame.temperature = clamp(currentMinigame.temperature, 0, 110);

    if (currentMinigame.temperature < 75) currentMinigame.score += 1;
    if (currentMinigame.temperature > 88) currentMinigame.dangerFrames++;

    refreshBoard();

    if (currentMinigame.temperature >= 100) {
      const score = clamp(Math.round(currentMinigame.score * 0.55), 0, 100);
      return finalizeMinigameResult({ score: score, success: false, quality: score >= 70 ? 'Standard' : 'Fail' });
    }

    if (currentMinigame.timeLeft <= 0) {
      const score = clamp(Math.round(currentMinigame.score * 0.9), 0, 100);
      const success = score >= (String(currentMinigame.difficulty).toLowerCase() === 'elite' ? 78 : 64);
      const quality = score >= 92 ? 'Elite' : score >= 82 ? 'Premium' : score >= 64 ? 'Standard' : 'Fail';
      return finalizeMinigameResult({ score: score, success: success, quality: quality });
    }
  }, 100);

  currentMinigame.renderInterval = setInterval(function() {
    if (currentMinigame.coolingCooldown > 0) currentMinigame.coolingCooldown--;
    if (currentMinigame.ventilationCooldown > 0) currentMinigame.ventilationCooldown--;
    if (currentMinigame.powerCooldown > 0) currentMinigame.powerCooldown--;
    refreshBoard();
  }, 1000);

  refreshBoard();
}

/* =========================
   SEQUENCE / ASSEMBLY
   ========================= */

function showSequenceMinigame() {
  const ui = createMinigameShell('<i class="fas fa-screwdriver-wrench"></i> ' + currentMinigame.stage.name, 'Składaj elementy w dobrej kolejności. Pomyłki obniżają jakość końcową.');

  const sequenceSets = {
    'Kamizelka 35%': ['Panel przód', 'Panel tył', 'Pasy', 'Płyta', 'Zapięcie'],
    'Kamizelka 50%': ['Panel przód', 'Panel tył', 'Pasy boczne', 'Płyty', 'Uchwyty'],
    'Kamizelka 75%': ['Panel ciężki', 'Panel tył', 'System boczny', 'Wkład', 'Moduł MOLLE'],
    'Kabura': ['Osłona', 'Mocowanie', 'Blokada', 'Korpus', 'Klips'],
    'Latarka do broni': ['Głowica', 'Zasilanie', 'Szyna', 'Obudowa', 'Uchwyt'],
    'Latarka ręczna': ['Głowica', 'Zasilanie', 'Rękojeść', 'Korpus', 'Przycisk'],
    'Magazynek do pistoletu': ['Korpus', 'Sprężyna', 'Podajnik', 'Stopka', 'Mechanizm'],
    'Powiększony magazynek': ['Korpus', 'Sprężyna', 'Adapter', 'Stopka', 'Mechanizm']
  };

  const order = sequenceSets[currentMinigame.productId && productionData[currentMinigame.productId] ? productionData[currentMinigame.productId].name : ''] || ['Moduł A', 'Moduł B', 'Moduł C', 'Moduł D', 'Moduł E'];
  currentMinigame.sequenceOrder = order;
  currentMinigame.sequenceStep = 0;
  currentMinigame.sequenceMistakes = 0;

  ui.top.innerHTML = '' +
    '<div class="mg-stat"><i class="fas fa-clock"></i> <span id="seq-time">' + formatSeconds(currentMinigame.timeLeft) + '</span></div>' +
    '<div class="mg-stat"><i class="fas fa-list-check"></i> Etap: <span id="seq-step">1/' + order.length + '</span></div>' +
    '<div class="mg-stat"><i class="fas fa-triangle-exclamation"></i> Błędy: <span id="seq-mistakes">0</span></div>';

  function renderGrid() {
    const shuffled = order.slice().sort(function() { return Math.random() - 0.5; });
    ui.board.innerHTML = '<div style="padding:18px;display:grid;gap:16px"><div style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)"><div style="color:rgba(239,251,255,.65);margin-bottom:8px">Aktualny element:</div><div style="font-family:Orbitron,sans-serif;color:#ffe37a;text-transform:uppercase;letter-spacing:.08em">' + order[currentMinigame.sequenceStep] + '</div></div><div id="seq-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px"></div></div>';
      const grid = ui.board.querySelector('#seq-grid');
      shuffled.forEach(function(item) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'assembly-slot';
        btn.textContent = item;
        btn.addEventListener('click', function() {
          if (item === order[currentMinigame.sequenceStep]) {
            currentMinigame.sequenceStep++;
            playSynthClick();
            if (currentMinigame.sequenceStep >= order.length) {
              finishSequenceMinigame(true);
            } else {
              ui.top.querySelector('#seq-step').textContent = (currentMinigame.sequenceStep + 1) + '/' + order.length;
              renderGrid();
            }
          } else {
            currentMinigame.sequenceMistakes++;
            ui.top.querySelector('#seq-mistakes').textContent = currentMinigame.sequenceMistakes;
            btn.style.borderColor = 'rgba(255,75,115,.38)';
            btn.style.background = 'rgba(255,75,115,.12)';
            playSynthFail();
            setTimeout(function() {
              btn.style.borderColor = 'rgba(255,255,255,.08)';
              btn.style.background = 'rgba(255,255,255,.03)';
            }, 220);
          }
        });
        grid.appendChild(btn);
      });
  }

  currentMinigame.timerInterval = setInterval(function() {
    currentMinigame.timeLeft -= 0.1;
    ui.top.querySelector('#seq-time').textContent = formatSeconds(currentMinigame.timeLeft);
    if (currentMinigame.timeLeft <= 0) finishSequenceMinigame(false);
  }, 100);

  renderGrid();
}

function finishSequenceMinigame(completed) {
  const timeBonus = clamp(currentMinigame.timeLeft * 2.4, 0, 30);
  const base = completed ? 80 : 30;
  const score = clamp(Math.round(base + timeBonus - currentMinigame.sequenceMistakes * 10), 0, 100);
  const success = completed && score >= 60;
  const quality = score >= 92 ? 'Elite' : score >= 82 ? 'Premium' : score >= 60 ? 'Standard' : 'Fail';
  finalizeMinigameResult({ score: score, success: success, quality: quality });
}

/* =========================
   SCAN GRID
   ========================= */

function showScanGridMinigame() {
  const ui = createMinigameShell('<i class="fas fa-magnifying-glass-chart"></i> ' + currentMinigame.stage.name, 'Wykrywaj wadliwe sektory. Klikaj tylko aktywne pola skanera zanim znikną.');

  currentMinigame.scanRound = 0;
  currentMinigame.scanHits = 0;
  currentMinigame.scanMisses = 0;
  currentMinigame.scanTarget = -1;
  currentMinigame.scanCanClick = false;

  ui.top.innerHTML = '' +
    '<div class="mg-stat"><i class="fas fa-clock"></i> <span id="scan-time">' + formatSeconds(currentMinigame.timeLeft) + '</span></div>' +
    '<div class="mg-stat"><i class="fas fa-bullseye"></i> Trafienia: <span id="scan-hits">0</span></div>' +
    '<div class="mg-stat"><i class="fas fa-xmark"></i> Błędy: <span id="scan-misses">0</span></div>';

  function renderGrid() {
    ui.board.innerHTML = '<div id="scan-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px"></div>';
    const grid = ui.board.querySelector('#scan-grid');
    for (let i = 0; i < 12; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'scan-cell';
      cell.dataset.index = String(i);
      cell.innerHTML = '<span style="position:absolute;inset:0;display:grid;place-items:center;color:rgba(239,251,255,.34);font-family:Orbitron,sans-serif">' + (i + 1) + '</span>';
      cell.addEventListener('click', function() {
        if (!currentMinigame.scanCanClick) return;
        if (Number(cell.dataset.index) === currentMinigame.scanTarget) {
          currentMinigame.scanHits++;
          currentMinigame.scanCanClick = false;
          ui.top.querySelector('#scan-hits').textContent = currentMinigame.scanHits;
          playSynthClick();
          setTimeout(nextRound, 80);
        } else {
          currentMinigame.scanMisses++;
          ui.top.querySelector('#scan-misses').textContent = currentMinigame.scanMisses;
          playSynthFail();
        }
      });
      grid.appendChild(cell);
    }

    currentMinigame.scanTarget = Math.floor(Math.random() * 12);
    const active = grid.children[currentMinigame.scanTarget];
    active.classList.add('active');
    currentMinigame.scanCanClick = true;

    clearTimeout(currentMinigame.flashTimeout);
    currentMinigame.flashTimeout = setTimeout(function() {
      if (currentMinigame.scanCanClick) {
        currentMinigame.scanCanClick = false;
        currentMinigame.scanMisses++;
        ui.top.querySelector('#scan-misses').textContent = currentMinigame.scanMisses;
        nextRound();
      }
    }, Math.max(360, 1000 - currentMinigame.scanRound * 35));
  }

  function nextRound() {
    currentMinigame.scanRound++;
    if (currentMinigame.scanRound >= 12) {
      finishScanGridMinigame();
      return;
    }
    renderGrid();
  }

  currentMinigame.timerInterval = setInterval(function() {
    currentMinigame.timeLeft -= 0.1;
    ui.top.querySelector('#scan-time').textContent = formatSeconds(currentMinigame.timeLeft);
    if (currentMinigame.timeLeft <= 0) finishScanGridMinigame();
  }, 100);

  nextRound();
}

function finishScanGridMinigame() {
  const raw = (currentMinigame.scanHits / 12) * 100 - currentMinigame.scanMisses * 3;
  const score = clamp(Math.round(raw), 0, 100);
  const success = score >= 62;
  const quality = score >= 90 ? 'Elite' : score >= 80 ? 'Premium' : score >= 62 ? 'Standard' : 'Fail';
  finalizeMinigameResult({ score: score, success: success, quality: quality });
}

/* =========================
   TIMING
   ========================= */

function showTimingMinigame() {
  const ui = createMinigameShell('<i class="fas fa-stopwatch"></i> ' + currentMinigame.stage.name, 'Zatrzymaj wskaźnik jak najbliżej środka zielonego pola.');

  currentMinigame.timingRound = 1;
  currentMinigame.timingTotal = 0;
  currentMinigame.timingValue = 0;
  currentMinigame.timingDir = 1;

  ui.top.innerHTML = '' +
    '<div class="mg-stat"><i class="fas fa-clock"></i> <span id="timing-time">' + formatSeconds(currentMinigame.timeLeft) + '</span></div>' +
    '<div class="mg-stat"><i class="fas fa-wave-square"></i> Runda: <span id="timing-round">1/3</span></div>' +
    '<div class="mg-stat"><i class="fas fa-gauge"></i> Średnia: <span id="timing-score">0</span></div>';

  function renderRound() {
    ui.board.innerHTML = '' +
      '<div style="padding:18px;display:grid;gap:18px;align-content:start">' +
        '<div class="timing-bar"><div class="timing-zone"></div><div class="timing-marker" id="timing-marker" style="left:0%"></div></div>' +
        '<div><button class="mg-btn primary" id="timing-stop">Stop</button></div>' +
      '</div>';

    const marker = ui.board.querySelector('#timing-marker');
    const stopBtn = ui.board.querySelector('#timing-stop');

    function tick() {
      currentMinigame.timingValue += currentMinigame.timingDir * 1.9;
      if (currentMinigame.timingValue >= 98) currentMinigame.timingDir = -1;
      if (currentMinigame.timingValue <= 0) currentMinigame.timingDir = 1;
      marker.style.left = currentMinigame.timingValue + '%';
      currentMinigame.rafId = requestAnimationFrame(tick);
    }

    stopBtn.addEventListener('click', function() {
      cancelAnimationFrame(currentMinigame.rafId);
      const center = currentMinigame.timingValue + 1;
      const dist = Math.abs(center - 50);
      const roundScore = Math.max(0, Math.round(100 - dist * 3.2));
      currentMinigame.timingTotal += roundScore;
      ui.top.querySelector('#timing-score').textContent = Math.round(currentMinigame.timingTotal / currentMinigame.timingRound);
      playSynthClick();
      currentMinigame.timingRound++;
      currentMinigame.timingValue = 0;
      currentMinigame.timingDir = 1;
      if (currentMinigame.timingRound > 3) {
        finishTimingMinigame();
      } else {
        ui.top.querySelector('#timing-round').textContent = currentMinigame.timingRound + '/3';
        renderRound();
      }
    }, { once: true });

    tick();
  }

  currentMinigame.timerInterval = setInterval(function() {
    currentMinigame.timeLeft -= 0.1;
    ui.top.querySelector('#timing-time').textContent = formatSeconds(currentMinigame.timeLeft);
    if (currentMinigame.timeLeft <= 0) finishTimingMinigame();
  }, 100);

  renderRound();
}

function finishTimingMinigame() {
  const score = clamp(Math.round(currentMinigame.timingTotal / Math.max(1, currentMinigame.timingRound - 1)), 0, 100);
  const success = score >= 58;
  const quality = score >= 92 ? 'Elite' : score >= 82 ? 'Premium' : score >= 58 ? 'Standard' : 'Fail';
  finalizeMinigameResult({ score: score, success: success, quality: quality });
}

/* =========================
   STANDALONE ENTRY
   ========================= */

function startMinigame(gameType) {
  const stage = standaloneMinigames[gameType];
  if (!stage) {
    showNotification('Minigra', 'Ten tryb nie istnieje.', 'warning');
    return;
  }
  showMinigame(gameType, 1, stage);
}
window.startMinigame = startMinigame;
