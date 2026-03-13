// ARMOR Shop & Production System v5.0

let currentDiscountState = { valid: false, discount: 0, code: '' };

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
  { id: 'vests', name: 'Kamizelki', icon: 'fa-shield-alt' },
  { id: 'magazines', name: 'Magazynki', icon: 'fa-box' },
  { id: 'lights', name: 'Oświetlenie', icon: 'fa-lightbulb' },
  { id: 'holsters', name: 'Kabury', icon: 'fa-gun' },
  { id: 'paint', name: 'Malowania', icon: 'fa-paint-brush' }
];

const workstations = {
  material: { name: 'Warsztat Materiałowy', icon: 'fa-boxes', desc: 'Surowce' },
  metal: { name: 'Warsztat Metalowy', icon: 'fa-industry', desc: 'Obróbka' },
  polymer: { name: 'Warsztat Polimerowy', icon: 'fa-vial', desc: 'Polimery' },
  assembly: { name: 'Stół Montażowy', icon: 'fa-wrench', desc: 'Montaż' },
  paint: { name: 'Lakiernia', icon: 'fa-spray-can', desc: 'Wykończenie' }
};

const productionData = {
  vest35: {
    id: 'vest35',
    name: 'Kamizelka 35%',
    desc: 'Podstawowa ochrona',
    image: '../images/Kamizelka35.png',
    price: 10000,
    difficulty: 'Łatwy',
    category: 'vests',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000, inputs: { 'włókno techniczne': 4, 'kevlar surowy': 2, 'stal surowa': 1 }, outputs: { 'pakiet surowców lekkich': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 18000, inputs: { 'pakiet surowców lekkich': 1 }, outputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 1, 'płyta ochronna lekka': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 16000, inputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 1 }, outputs: { 'panel przedni lekki': 1, 'panel tylny lekki': 1, 'pas mocujący': 2 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 20000, inputs: { 'panel przedni lekki': 1, 'panel tylny lekki': 1, 'pas mocujący': 2 }, outputs: { 'szkielet kamizelki lekkiej': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 10000, inputs: { 'szkielet kamizelki lekkiej': 1, 'płyta ochronna lekka': 1 }, outputs: { 'Kamizelka 35%': 1 } }
    ]
  },
  vest50: {
    id: 'vest50',
    name: 'Kamizelka 50%',
    desc: 'Średnia ochrona',
    image: '../images/Kamizelka50.png',
    price: 20000,
    difficulty: 'Średni',
    category: 'vests',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000, inputs: { 'włókno techniczne': 5, 'kevlar surowy': 4, 'stal surowa': 2, 'polimer': 2 }, outputs: { 'pakiet surowców standard': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 25000, inputs: { 'pakiet surowców standard': 1 }, outputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 2, 'płyta balistyczna standard': 2, 'klamry montażowe': 2 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 22000, inputs: { 'tkanina balistyczna': 2, 'arkusz kevlaru': 2, 'klamry montażowe': 2 }, outputs: { 'panel przedni standard': 1, 'panel tylny standard': 1, 'pasy boczne': 2, 'uchwyty taktyczne': 2 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 28000, inputs: { 'panel przedni standard': 1, 'panel tylny standard': 1, 'pasy boczne': 2, 'uchwyty taktyczne': 2 }, outputs: { 'korpus kamizelki standard': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 15000, inputs: { 'korpus kamizelki standard': 1, 'płyta balistyczna standard': 2 }, outputs: { 'Kamizelka 50%': 1 } }
    ]
  },
  vest75: {
    id: 'vest75',
    name: 'Kamizelka 75%',
    desc: 'Wysoka ochrona',
    image: '../images/Kamizelka75.png',
    price: 35000,
    difficulty: 'Trudny',
    category: 'vests',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000, inputs: { 'włókno techniczne': 6, 'kevlar surowy': 6, 'stal surowa': 3, 'polimer': 3, 'aluminium surowe': 2 }, outputs: { 'pakiet surowców ciężkich': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 30000, inputs: { 'pakiet surowców ciężkich': 1 }, outputs: { 'tkanina balistyczna premium': 2, 'arkusz kevlaru premium': 3, 'płyta balistyczna ciężka': 3, 'szyny MOLLE': 2 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 28000, inputs: { 'tkanina balistyczna premium': 2, 'arkusz kevlaru premium': 3, 'szyny MOLLE': 2 }, outputs: { 'panel przedni ciężki': 1, 'panel tylny ciężki': 1, 'system boczny': 2, 'moduł taktyczny MOLLE': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 35000, inputs: { 'panel przedni ciężki': 1, 'panel tylny ciężki': 1, 'system boczny': 2 }, outputs: { 'korpus kamizelki ciężkiej': 1, 'wkład ochronny ciężki': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 18000, inputs: { 'korpus kamizelki ciężkiej': 1, 'wkład ochronny ciężki': 1, 'moduł taktyczny MOLLE': 1 }, outputs: { 'Kamizelka 75%': 1 } }
    ]
  },
  kabura: {
    id: 'kabura',
    name: 'Kabura',
    desc: 'Kabura na broń',
    image: '../images/Kabura.png',
    price: 250000,
    difficulty: 'Elite',
    category: 'holsters',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000, inputs: { 'skóra techniczna': 4, 'polimer': 2, 'aluminium surowe': 1 }, outputs: { 'pakiet kabury': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 30000, inputs: { 'pakiet kabury': 1 }, outputs: { 'formowana skóra': 2, 'korpus polimerowy': 1, 'klips montażowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 28000, inputs: { 'formowana skóra': 2, 'korpus polimerowy': 1 }, outputs: { 'osłona kabury': 1, 'mocowanie pasa': 1, 'blokada kabury': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 35000, inputs: { 'osłona kabury': 1, 'mocowanie pasa': 1, 'blokada kabury': 1 }, outputs: { 'korpus kabury': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 18000, inputs: { 'korpus kabury': 1, 'klips montażowy': 1 }, outputs: { 'Kabura': 1 } }
    ]
  },
  latarka: {
    id: 'latarka',
    name: 'Latarka do broni',
    desc: 'Latarka taktyczna',
    image: '../images/latarka_broń.png',
    price: 25000,
    difficulty: 'Średni',
    category: 'lights',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000, inputs: { 'aluminium surowe': 2, 'szkło techniczne': 1, 'ogniwo zasilające': 2, 'polimer': 1 }, outputs: { 'pakiet oświetlenia taktycznego': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 25000, inputs: { 'pakiet oświetlenia taktycznego': 1 }, outputs: { 'obudowa latarki': 1, 'soczewka': 1, 'bateria robocza': 1, 'uchwyt montażowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 22000, inputs: { 'obudowa latarki': 1, 'soczewka': 1, 'bateria robocza': 1 }, outputs: { 'głowica światła': 1, 'moduł zasilania': 1, 'mocowanie do szyny': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 28000, inputs: { 'głowica światła': 1, 'moduł zasilania': 1, 'mocowanie do szyny': 1 }, outputs: { 'moduł latarki broniowej': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 15000, inputs: { 'moduł latarki broniowej': 1, 'uchwyt montażowy': 1 }, outputs: { 'Latarka do broni': 1 } }
    ]
  },
  latarka_reczna: {
    id: 'latarka_reczna',
    name: 'Latarka ręczna',
    desc: 'Latarka LED',
    image: '../images/Latarka.png',
    price: 50000,
    difficulty: 'Łatwy',
    category: 'lights',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000, inputs: { 'aluminium surowe': 2, 'szkło techniczne': 1, 'ogniwo zasilające': 2, 'polimer': 1 }, outputs: { 'pakiet oświetlenia ręcznego': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 18000, inputs: { 'pakiet oświetlenia ręcznego': 1 }, outputs: { 'obudowa ręczna': 1, 'soczewka': 1, 'bateria robocza': 1, 'przycisk zasilania': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 16000, inputs: { 'obudowa ręczna': 1, 'soczewka': 1, 'bateria robocza': 1 }, outputs: { 'głowica latarki': 1, 'moduł zasilania': 1, 'rękojeść': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 20000, inputs: { 'głowica latarki': 1, 'moduł zasilania': 1, 'rękojeść': 1 }, outputs: { 'korpus latarki': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 10000, inputs: { 'korpus latarki': 1 }, outputs: { 'Latarka ręczna': 1 } }
    ]
  },
  magazynek_pistolet: {
    id: 'magazynek_pistolet',
    name: 'Magazynek do pistoletu',
    desc: 'Standardowy magazynek',
    image: '../images/magazynek_pistolet.png',
    price: 3800,
    difficulty: 'Łatwy',
    category: 'magazines',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 15000, inputs: { 'stal surowa': 2, 'polimer': 1 }, outputs: { 'pakiet magazynka standard': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 18000, inputs: { 'pakiet magazynka standard': 1 }, outputs: { 'korpus magazynka': 1, 'sprężyna': 1, 'podajnik': 1, 'stopka magazynka': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 16000, inputs: { 'korpus magazynka': 1, 'sprężyna': 1, 'podajnik': 1 }, outputs: { 'moduł wewnętrzny magazynka': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 20000, inputs: { 'moduł wewnętrzny magazynka': 1, 'stopka magazynka': 1 }, outputs: { 'mechanizm magazynka': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 10000, inputs: { 'mechanizm magazynka': 1 }, outputs: { 'Magazynek do pistoletu': 1 } }
    ]
  },
  powiekszony_magazynek: {
    id: 'powiekszony_magazynek',
    name: 'Powiększony magazynek',
    desc: 'Większa pojemność',
    image: '../images/Pow_magazynek.png',
    price: 60000,
    difficulty: 'Średni',
    category: 'magazines',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 20000, inputs: { 'stal surowa': 3, 'polimer': 2, 'aluminium surowe': 1 }, outputs: { 'pakiet magazynka rozszerzonego': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'metal', duration: 25000, inputs: { 'pakiet magazynka rozszerzonego': 1 }, outputs: { 'wydłużony korpus magazynka': 1, 'sprężyna wzmocniona': 1, 'rozszerzona stopka': 1, 'adapter montażowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'polymer', duration: 22000, inputs: { 'wydłużony korpus magazynka': 1, 'sprężyna wzmocniona': 1, 'adapter montażowy': 1 }, outputs: { 'moduł dużej pojemności': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 28000, inputs: { 'moduł dużej pojemności': 1, 'rozszerzona stopka': 1 }, outputs: { 'mechanizm magazynka premium': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 15000, inputs: { 'mechanizm magazynka premium': 1 }, outputs: { 'Powiększony magazynek': 1 } }
    ]
  },
  zlote_malowanie: {
    id: 'zlote_malowanie',
    name: 'Złote malowanie',
    desc: 'Złoty wygląd broni',
    image: '../images/Złote_malowanie.png',
    price: 280000,
    difficulty: 'Elite',
    category: 'paint',
    stages: [
      { id: 1, name: 'ZBIERANIE', icon: 'fa-hand-holding', workstation: 'material', duration: 25000, inputs: { 'chemikalia przemysłowe': 2, 'pigment premium': 2, 'aluminium surowe': 1, 'szkło techniczne': 1 }, outputs: { 'pakiet lakierniczy premium': 1 } },
      { id: 2, name: 'PRZERÓBKA', icon: 'fa-cogs', workstation: 'polymer', duration: 30000, inputs: { 'pakiet lakierniczy premium': 1 }, outputs: { 'baza lakiernicza': 1, 'mieszanka pigmentu': 1, 'utwardzacz': 1, 'aplikator natryskowy': 1 } },
      { id: 3, name: 'CZĘŚCI', icon: 'fa-tools', workstation: 'metal', duration: 28000, inputs: { 'baza lakiernicza': 1, 'mieszanka pigmentu': 1, 'utwardzacz': 1 }, outputs: { 'zestaw lakierniczy premium': 1, 'warstwa podkładowa': 1 } },
      { id: 4, name: 'MONTAŻ', icon: 'fa-hammer', workstation: 'assembly', duration: 35000, inputs: { 'zestaw lakierniczy premium': 1, 'warstwa podkładowa': 1, 'aplikator natryskowy': 1 }, outputs: { 'pakiet malowania dekoracyjnego': 1 } },
      { id: 5, name: 'FINALIZACJA', icon: 'fa-check-circle', workstation: 'paint', duration: 18000, inputs: { 'pakiet malowania dekoracyjnego': 1 }, outputs: { 'Złote malowanie': 1 } }
    ]
  }
};

const shopProducts = [
  { id: 'vest35', name: 'Kamizelka 35%', price: 10000, image: '../images/Kamizelka35.png', desc: 'Podstawowa ochrona balistyczna' },
  { id: 'vest50', name: 'Kamizelka 50%', price: 20000, image: '../images/Kamizelka50.png', desc: 'Średnia ochrona balistyczna' },
  { id: 'vest75', name: 'Kamizelka 75%', price: 35000, image: '../images/Kamizelka75.png', desc: 'Wysoka ochrona balistyczna' },
  { id: 'kabura', name: 'Kabura', price: 250000, image: '../images/Kabura.png', desc: 'Kabura na broń' },
  { id: 'latarka', name: 'Latarka do broni', price: 25000, image: '../images/latarka_broń.png', desc: 'Latarka taktyczna' },
  { id: 'latarka_reczna', name: 'Latarka ręczna', price: 50000, image: '../images/Latarka.png', desc: 'Latarka LED' },
  { id: 'magazynek_pistolet', name: 'Magazynek do pistoletu', price: 3800, image: '../images/magazynek_pistolet.png', desc: 'Standardowy magazynek' },
  { id: 'powiekszony_magazynek', name: 'Powiększony magazynek', price: 60000, image: '../images/Pow_magazynek.png', desc: 'Większa pojemność' },
  { id: 'zlote_malowanie', name: 'Złote malowanie', price: 280000, image: '../images/Złote_malowanie.png', desc: 'Złoty wygląd broni' }
];

let playerInventory = {};
let productionProgress = {};
let currentTab = 'shop';
let minigameActive = false;
let currentMinigame = null;
let selectedCategory = 'all';

function safeText(value) {
  return String(value || '').replace(/[<>]/g, '').trim();
}

function formatPrice(price) {
  return '$' + Number(price || 0).toLocaleString('pl-PL');
}

function saveGame() {
  localStorage.setItem('armor_playerInventory', JSON.stringify(playerInventory));
  localStorage.setItem('armor_productionProgress', JSON.stringify(productionProgress));
  localStorage.setItem('armor_resources', JSON.stringify(resources));
  localStorage.setItem('armor_selectedCategory', selectedCategory);
  localStorage.setItem('armor_currentTab', currentTab);
  saveUserProduction(resources, {}, playerInventory);
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

  loadUserProduction().then(function(result) {
    if (result && result.data) {
      if (result.data.resources && Object.keys(result.data.resources).length > 0) {
        resources = result.data.resources;
      }
      if (result.data.inventory && Object.keys(result.data.inventory).length > 0) {
        playerInventory = result.data.inventory;
      }
      renderResources();
      renderShopProducts();
      renderProductionProducts();
      renderProductionPanel();
    }
  });
}

function showNotification(title, message, type) {
  const n = document.createElement('div');
  n.className = 'notification notification-' + type;
  n.innerHTML =
    '<div class="notification-icon"><i class="fas fa-' +
    (type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-circle' : 'info-circle') +
    '"></i></div><div class="notification-content"><div class="notification-title">' +
    title +
    '</div><div class="notification-message">' +
    message +
    '</div></div><button class="notification-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
  document.body.appendChild(n);
  setTimeout(function() {
    n.classList.add('notification-hide');
    setTimeout(function() { n.remove(); }, 300);
  }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
  loadGame();
  initStyles();
  initTabs();
  initCategoryFilters();
  renderProductionPanel();
  renderWorkstations();
  renderShopProducts();
  renderProductionProducts();
  renderResources();
  initChat();

  if (currentTab === 'production') {
    const tab = document.querySelector('[data-tab="production"]');
    if (tab) tab.click();
  }
});

function initStyles() {
  const s = document.createElement('style');
  s.textContent = '.notification{position:fixed;top:20px;right:20px;display:flex;align-items:center;gap:15px;padding:15px 20px;background:linear-gradient(135deg,rgba(14,18,28,.98),rgba(8,13,22,.99));border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.5);z-index:10000;animation:slideIn .3s ease;min-width:300px;border:1px solid #00eaff}.notification-success{border-color:#37ff9c}.notification-error{border-color:#ff4b73}.notification-info{border-color:#00eaff}.notification-warning{border-color:#ff9d00}.notification-icon{font-size:1.5rem;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0}.notification-success .notification-icon{background:rgba(55,255,156,.2);color:#37ff9c}.notification-error .notification-icon{background:rgba(255,75,115,.2);color:#ff4b73}.notification-info .notification-icon{background:rgba(0,234,255,.2);color:#00eaff}.notification-warning .notification-icon{background:rgba(255,157,0,.2);color:#ff9d00}.notification-content{flex:1}.notification-title{font-family:Orbitron,sans-serif;font-size:.9rem;color:#effbff;margin-bottom:3px}.notification-message{font-size:.8rem;color:rgba(239,251,255,.58)}.notification-close{background:none;border:none;color:rgba(239,251,255,.58);cursor:pointer;padding:5px}.notification-hide{animation:slideOut .3s ease forwards}@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}';
  document.head.appendChild(s);
}

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
      if (currentTab === 'production' && prodSection) {
        prodSection.classList.remove('hidden');
        updateProductionFlow();
      }
      if (currentTab === 'minigames' && miniSection) miniSection.classList.remove('hidden');

      saveGame();
    });
  });
}

function initCategoryFilters() {
  const buttons = document.querySelectorAll('[data-category]');
  if (!buttons.length) return;

  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedCategory = this.dataset.category;
      buttons.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      renderProductionProducts();
      saveGame();
    });
  });
}

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

  panel.innerHTML =
    '<div class="panel-stat"><div class="panel-stat-icon"><i class="fas fa-cogs"></i></div><div class="panel-stat-value">' + inProgress + '</div><div class="panel-stat-label">W produkcji</div></div>' +
    '<div class="panel-stat"><div class="panel-stat-icon"><i class="fas fa-check-circle"></i></div><div class="panel-stat-value">' + completed + '</div><div class="panel-stat-label">Ukończono</div></div>' +
    '<div class="panel-stat"><div class="panel-stat-icon"><i class="fas fa-boxes"></i></div><div class="panel-stat-value">' + ready + '</div><div class="panel-stat-label">Gotowe</div></div>';
}

function renderResources() {
  const container = document.getElementById('resources-panel') || document.getElementById('resourcesGrid');
  if (!container) return;

  const entries = Object.entries(resources);
  if (!entries.length) {
    container.innerHTML = '<div class="empty-state"><p>Brak zasobów</p></div>';
    return;
  }

  if (container.id === 'resourcesGrid') {
    container.innerHTML = entries.map(function(entry) {
      const isLow = entry[1] < 3;
      return '<article class="resource-card"><div class="resource-top"><div><div class="resource-icon"><i class="fas fa-cubes"></i></div><h3 class="inventory-name">' + entry[0] + '</h3></div><div class="resource-value' + (isLow ? ' low' : '') + '">' + entry[1] + '</div></div><p class="inventory-meta">' + (isLow ? 'Niski stan zasobu.' : 'Zasób gotowy do użycia.') + '</p></article>';
    }).join('');
    return;
  }

  container.innerHTML = entries.map(function(entry) {
    const isLow = entry[1] < 3;
    return '<div class="resource-item' + (isLow ? ' low' : '') + '"><span class="resource-name">' + entry[0] + '</span><span class="resource-qty">x' + entry[1] + '</span></div>';
  }).join('');
}

function canStartStage(stage) {
  return Object.entries(stage.inputs).every(function(entry) {
    return (resources[entry[0]] || 0) >= entry[1];
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
  showNotification('📦 Zasoby dodane', 'Dodano pakiet testowy surowców', 'success');
}

function updateProductionFlow() {
  const flow = document.getElementById('production-flow');
  if (!flow) return;

  const steps = [
    { id: 1, name: 'Surowce', icon: 'fa-cubes' },
    { id: 2, name: 'Przeróbka', icon: 'fa-cogs' },
    { id: 3, name: 'Części', icon: 'fa-tools' },
    { id: 4, name: 'Montaż', icon: 'fa-hammer' },
    { id: 5, name: 'Produkt', icon: 'fa-check-circle' }
  ];

  let activeStage = 0;
  Object.keys(productionProgress).forEach(function(key) {
    const prog = productionProgress[key];
    if (prog && prog.status === 'in_progress') activeStage = prog.currentStage;
  });

  flow.innerHTML = steps.map(function(step, idx) {
    let stepClass = '';
    if (activeStage > step.id) stepClass = 'completed';
    else if (activeStage === step.id) stepClass = 'active';
    return '<div class="flow-step ' + stepClass + '"><div class="flow-icon"><i class="fas ' + step.icon + '"></i></div><div class="flow-label">' + step.name + '</div></div>' + (idx < steps.length - 1 ? '<div class="flow-arrow">→</div>' : '');
  }).join('');
}

function renderWorkstations() {
  const container = document.getElementById('workstations') || document.getElementById('workstationsGrid');
  if (!container) return;

  if (container.id === 'workstationsGrid') {
    container.innerHTML = Object.keys(workstations).map(function(key) {
      const ws = workstations[key];
      return '<article class="workstation-card"><div class="workstation-icon"><i class="fas ' + ws.icon + '"></i></div><h3 class="workstation-name">' + ws.name + '</h3><p class="workstation-desc">' + ws.desc + '</p><div class="workstation-status">Gotowe do pracy</div></article>';
    }).join('');
    return;
  }

  container.innerHTML = Object.keys(workstations).map(function(key) {
    const ws = workstations[key];
    return '<div class="workstation"><div class="workstation-icon"><i class="fas ' + ws.icon + '"></i></div><div class="workstation-name">' + ws.name + '</div><div class="workstation-desc">' + ws.desc + '</div><div class="workstation-status">● Dostępne</div></div>';
  }).join('');
}

function renderShopProducts() {
  const grid = document.getElementById('shop-products') || document.getElementById('shopGrid');
  if (!grid) return;

  const isModernGrid = grid.id === 'shopGrid';

  grid.innerHTML = '';

  shopProducts.forEach(function(product) {
    const inInv = playerInventory[product.id] || 0;

    if (isModernGrid) {
      const article = document.createElement('article');
      article.className = 'shop-card';
      article.setAttribute('data-product-id', product.id);
      article.innerHTML =
        '<div class="shop-image-wrap"><img src="' + product.image.replace('..', '') + '" alt="' + product.name + '" /></div>' +
        '<div><h3 class="shop-name">' + product.name + '</h3><p class="shop-desc">' + product.desc + '</p><div class="shop-meta"><span class="tag"><i class="fas fa-box"></i> Na stanie: ' + inInv + '</span></div></div>' +
        '<div class="shop-side"><div class="price">' + formatPrice(product.price) + '</div><button class="buy-btn" type="button" onclick="initiatePurchase(\'' + product.id + '\')">Kup</button></div>';
      grid.appendChild(article);
    } else {
      const card = document.createElement('div');
      card.className = 'cennik-card';
      card.innerHTML =
        '<div class="product-image"><img src="' + product.image + '" alt="' + product.name + '" /></div>' +
        '<div class="product-info"><div class="product-name">' + product.name + '</div><div class="product-desc">' + product.desc + '</div><div class="inventory-badge">Na stanie: ' + inInv + '</div><div class="product-price">' + formatPrice(product.price) + '</div></div>' +
        '<button class="buy-btn" onclick="initiatePurchase(\'' + product.id + '\')">KUP</button>';
      grid.appendChild(card);
    }
  });
}

function renderProductionProducts() {
  const grid = document.getElementById('production-grid') || document.getElementById('recipesGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const products = Object.values(productionData);
  const filtered = selectedCategory === 'all' ? products : products.filter(function(p) { return p.category === selectedCategory; });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Brak produktów w tej kategorii</p></div>';
    return;
  }

  const isModernGrid = grid.id === 'recipesGrid';

  filtered.forEach(function(p) {
    const prog = productionProgress[p.id] || { currentStage: 1, stageProgress: 0, status: 'not_started' };
    const inInv = playerInventory[p.id] || 0;
    const totalTime = p.stages.reduce(function(sum, s) { return sum + s.duration; }, 0);

    let statusText = 'Nie rozpoczęto';
    let statusClass = 'not-started';

    if (prog.status === 'completed') {
      statusText = 'Gotowe';
      statusClass = 'completed';
    } else if (prog.status === 'in_progress') {
      statusText = 'Etap ' + prog.currentStage + '/5';
      statusClass = 'in-progress';
    }

    if (isModernGrid) {
      const article = document.createElement('article');
      article.className = 'recipe-card';
      article.innerHTML =
        '<div class="recipe-top">' +
        '<div class="recipe-image"><img src="' + p.image.replace('..', '') + '" alt="' + p.name + '" /></div>' +
        '<div><h3 class="recipe-title">' + p.name + '</h3><p class="recipe-desc">' + p.desc + '</p><div class="shop-meta" style="margin-top:10px;"><span class="difficulty-badge ' + mapDifficultyClass(p.difficulty) + '">' + p.difficulty + '</span><span class="station-badge"><i class="fas fa-clock"></i> ' + (totalTime / 1000).toFixed(0) + ' s</span></div></div>' +
        '<div class="recipe-right"><div class="recipe-status">' + statusText + (inInv > 0 ? ' | ' + inInv + ' szt.' : '') + '</div><div class="recipe-time">' + p.stages.length + ' etapów</div></div>' +
        '</div>' +
        '<div class="stage-list">' + renderModernStages(p.id) + '</div>' +
        '<div class="recipe-footer"><div class="shop-meta"><span class="reward-badge"><i class="fas fa-coins"></i> Wartość: ' + formatPrice(p.price) + '</span></div><button class="craft-btn" type="button" onclick="startProduction(\'' + p.id + '\')">Rozpocznij craft</button></div>';
      grid.appendChild(article);
    } else {
      const card = document.createElement('div');
      card.className = 'production-card ' + statusClass;
      card.id = 'prod-card-' + p.id;
      card.innerHTML =
        '<div class="product-header" data-product="' + p.id + '">' +
        '<div class="product-image-small"><img src="' + p.image + '" alt="' + p.name + '" /></div>' +
        '<div class="product-info"><div class="product-name">' + p.name + '</div>' +
        '<div class="product-meta"><span class="difficulty difficulty-' + p.difficulty.toLowerCase() + '">' + p.difficulty + '</span><span class="total-time"><i class="fas fa-clock"></i> ' + (totalTime / 1000).toFixed(0) + 's</span></div>' +
        '<div class="product-status ' + statusClass + '">' + statusText + (inInv > 0 ? ' | Wyprodukowano: ' + inInv : '') + '</div></div>' +
        '<div class="expand-icon"><i class="fas fa-chevron-down"></i></div></div>' +
        '<div class="product-body">' + renderStages(p.id) + '</div>';
      grid.appendChild(card);
    }
  });

  document.querySelectorAll('.product-header').forEach(function(header) {
    header.addEventListener('click', function() {
      toggleProductionProduct(this.dataset.product);
    });
  });
}

function mapDifficultyClass(diff) {
  const d = String(diff || '').toLowerCase();
  if (d === 'łatwy') return 'easy';
  if (d === 'średni') return 'medium';
  if (d === 'trudny') return 'hard';
  return 'elite';
}

function renderModernStages(productId) {
  const p = productionData[productId];
  return p.stages.slice(0, 2).map(function(stage) {
    const ws = workstations[stage.workstation];
    return '<article class="stage-item"><div class="stage-head"><div class="stage-title"><span class="stage-dot"><i class="fas ' + stage.icon + '"></i></span>' + stage.name + '</div><span class="station-badge"><i class="fas ' + ws.icon + '"></i> ' + ws.name + '</span></div><div class="stage-columns"><div class="io-card"><div class="io-label">Wejście</div>' +
      Object.entries(stage.inputs).map(function(item) {
        return '<div class="io-row"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join('') +
      '</div><div class="io-arrow"><i class="fas fa-arrow-right"></i></div><div class="io-card"><div class="io-label">Wynik</div>' +
      Object.entries(stage.outputs).map(function(item) {
        return '<div class="io-row"><span>' + item[0] + '</span><strong>+' + item[1] + '</strong></div>';
      }).join('') +
      '</div></div></article>';
  }).join('');
}

function renderStages(productId) {
  const p = productionData[productId];
  const prog = productionProgress[productId] || { currentStage: 1, stageProgress: 0, status: 'not_started' };
  const isFullyCompleted = prog.status === 'completed';
  const currentStageData = prog.status === 'completed' ? null : p.stages[(prog.currentStage || 1) - 1];
  const canStart = isFullyCompleted || (currentStageData && canStartStage(currentStageData));
  let html = '<div class="stages-container">';

  if (isFullyCompleted) {
    html += '<div class="produce-section"><button class="produce-btn completed-btn" onclick="event.stopPropagation(); startProduction(\'' + productId + '\')"><i class="fas fa-box"></i> Odbierz produkt</button></div>';
  } else if (canStart) {
    html += '<div class="produce-section"><button class="produce-btn" onclick="event.stopPropagation(); startProduction(\'' + productId + '\')"><i class="fas fa-play"></i> Rozpocznij etap ' + prog.currentStage + '</button></div>';
  } else {
    html += '<div class="produce-section blocked"><button class="produce-btn" disabled><i class="fas fa-lock"></i> Brak surowców</button></div>';
  }

  p.stages.forEach(function(stage, idx) {
    const ws = workstations[stage.workstation];
    let stageStatus = 'locked';
    if (prog.status === 'completed') stageStatus = 'completed';
    else if (idx + 1 < prog.currentStage) stageStatus = 'completed';
    else if (idx + 1 === prog.currentStage) stageStatus = 'active';

    const hasResources = canStartStage(stage);

    html += '<div class="stage ' + stageStatus + '" data-stage="' + stage.id + '">' +
      '<div class="stage-header" data-product="' + productId + '" data-stage="' + stage.id + '">' +
      '<div class="stage-number">' + (stageStatus === 'completed' ? '✓' : stage.id) + '</div>' +
      '<div class="stage-info"><div class="stage-name"><i class="fas ' + stage.icon + '"></i> ' + stage.name + '</div></div>' +
      '<div class="stage-workstation"><i class="fas ' + ws.icon + '"></i> ' + ws.name + '</div>' +
      (stageStatus === 'active' && !hasResources ? '<span class="no-resources"><i class="fas fa-exclamation-triangle"></i> Brak</span>' : '') +
      '</div><div class="stage-body"><div class="stage-time"><i class="fas fa-clock"></i> ' + (stage.duration / 1000).toFixed(1) + 's</div>' +
      '<div class="stage-flow"><div class="stage-io inputs"><div class="io-label"><i class="fas fa-sign-in-alt"></i> WEJŚCIE</div>' +
      Object.entries(stage.inputs).map(function(item) {
        const has = resources[item[0]] || 0;
        const needed = item[1];
        const hasEnough = has >= needed;
        return '<div class="io-item' + (hasEnough ? '' : ' insufficient') + '"><span>' + item[0] + '</span><span class="io-qty' + (hasEnough ? '' : ' insufficient') + '">' + has + '/' + needed + '</span></div>';
      }).join('') +
      '</div><div class="stage-arrow">→</div><div class="stage-io outputs"><div class="io-label"><i class="fas fa-sign-out-alt"></i> WYJŚCIE</div>' +
      Object.entries(stage.outputs).map(function(item) {
        return '<div class="io-item"><span>' + item[0] + '</span><span class="io-qty">x' + item[1] + '</span></div>';
      }).join('') +
      '</div></div></div></div>';
  });

  html += '</div>';
  return html;
}

function toggleProductionProduct(productId) {
  const card = document.getElementById('prod-card-' + productId);
  if (!card) return;
  const allCards = document.querySelectorAll('.production-card');
  allCards.forEach(function(c) {
    if (c.id !== 'prod-card-' + productId) c.classList.remove('expanded');
  });
  card.classList.toggle('expanded');
}

function getRequiredClicks(difficulty) {
  switch ((difficulty || '').toLowerCase()) {
    case 'łatwy': return 8;
    case 'średni': return 12;
    case 'trudny': return 16;
    case 'elite': return 22;
    default: return 10;
  }
}

function getQuality(clicks, required) {
  if (clicks >= required + 10) return 'Elite';
  if (clicks >= required + 5) return 'Premium';
  if (clicks >= required) return 'Standard';
  return 'Fail';
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

function startProduction(productId) {
  const p = productionData[productId];
  const prog = productionProgress[productId] || { currentStage: 1, stageProgress: 0, status: 'not_started' };

  if (prog.status === 'completed') {
    playerInventory[productId] = (playerInventory[productId] || 0) + 1;
    productionProgress[productId] = { currentStage: 1, stageProgress: 0, status: 'not_started' };
    showNotification('🎉 Produkcja zakończona!', 'Wyprodukowano: ' + p.name, 'success');
    renderProductionProducts();
    renderShopProducts();
    renderProductionPanel();
    saveGame();
    return;
  }

  const currentStageNum = prog.currentStage;
  if (currentStageNum > 5) return;

  const stage = p.stages[currentStageNum - 1];
  if (!hasEnoughResources(stage.inputs)) {
    showNotification('❌ Brak surowców!', 'Nie masz wymaganych materiałów do tego etapu.', 'error');
    return;
  }

  showMinigame(productId, currentStageNum, stage);
}

function showMinigame(productId, stageNum, stage) {
  if (minigameActive) {
    showNotification('⚠️ Minigra aktywna', 'Zakończ najpierw trwającą grę', 'error');
    return;
  }

  const existing = document.getElementById('minigame-modal');
  if (existing) existing.remove();

  minigameActive = true;
  currentMinigame = {
    productId: productId,
    stageNum: stageNum,
    score: 0,
    timeLeft: stage.duration / 1000,
    clicks: 0
  };

  const modal = document.createElement('div');
  modal.className = 'minigame-modal';
  modal.id = 'minigame-modal';
  modal.innerHTML =
    '<div class="minigame-content"><div class="minigame-header"><h2><i class="fas ' + stage.icon + '"></i> ' + stage.name + '</h2><p>Ukończ etap zanim skończy się czas.</p></div><div class="minigame-timer"><span id="timer-display">' + currentMinigame.timeLeft.toFixed(1) + 's</span></div><div class="click-area" id="click-area"><button class="click-target" id="click-target" onclick="hitTarget()">KLIKNIJ!</button></div><div class="minigame-info"><span>Klikaj przycisk!</span><div class="score">Kliknięcia: <span id="minigame-score">0</span></div></div><button class="cancel-btn" onclick="cancelMinigame()">Anuluj</button></div>';
  document.body.appendChild(modal);

  currentMinigame.timerInterval = setInterval(function() {
    currentMinigame.timeLeft -= 0.1;
    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.textContent = currentMinigame.timeLeft.toFixed(1) + 's';
    if (currentMinigame.timeLeft <= 0) finishMinigameClick();
  }, 100);

  moveClickTarget();
}

function moveClickTarget() {
  if (!minigameActive) return;
  const target = document.getElementById('click-target');
  const area = document.getElementById('click-area');
  if (!target || !area) return;

  const r = area.getBoundingClientRect();
  const maxX = Math.max(0, r.width - target.offsetWidth);
  const maxY = Math.max(0, r.height - target.offsetHeight);
  target.style.position = 'absolute';
  target.style.left = Math.random() * maxX + 'px';
  target.style.top = Math.random() * maxY + 'px';
  if (minigameActive) currentMinigame.moveTimeout = setTimeout(moveClickTarget, 800 + Math.random() * 700);
}

function hitTarget() {
  if (!minigameActive) return;
  currentMinigame.clicks++;
  const score = document.getElementById('minigame-score');
  if (score) score.textContent = currentMinigame.clicks;

  const target = document.getElementById('click-target');
  if (target) {
    target.style.transform = 'scale(0.95)';
    setTimeout(function() { target.style.transform = 'scale(1)'; }, 50);
  }

  clearTimeout(currentMinigame.moveTimeout);
  moveClickTarget();
}

function finishMinigameClick() {
  if (!minigameActive) return;

  clearInterval(currentMinigame.timerInterval);
  clearTimeout(currentMinigame.moveTimeout);
  minigameActive = false;

  const modal = document.getElementById('minigame-modal');
  if (modal) modal.remove();

  const clicks = currentMinigame.clicks;
  const product = productionData[currentMinigame.productId];
  const required = getRequiredClicks(product.difficulty);
  const stage = product.stages[currentMinigame.stageNum - 1];

  if (clicks >= required) {
    consumeResources(stage.inputs);
    addResources(stage.outputs);

    if (!productionProgress[currentMinigame.productId]) {
      productionProgress[currentMinigame.productId] = { currentStage: 1, stageProgress: 0, status: 'not_started' };
    }

    const prog = productionProgress[currentMinigame.productId];
    if (currentMinigame.stageNum >= 5) {
      prog.status = 'completed';
      prog.currentStage = 5;
      prog.stageProgress = 100;
    } else {
      prog.currentStage = currentMinigame.stageNum + 1;
      prog.stageProgress = 0;
      prog.status = 'in_progress';
    }

    const quality = getQuality(clicks, required);
    const outputText = Object.entries(stage.outputs).map(function(entry) {
      return entry[0] + ' x' + entry[1];
    }).join(', ');

    showNotification('🎉 Sukces!', 'Otrzymano: ' + outputText + ' | Jakość: ' + quality, 'success');
  } else {
    showNotification('❌ Porażka!', 'Zrobiłeś tylko ' + clicks + ' kliknięć. Wymagane: ' + required, 'error');
  }

  renderProductionProducts();
  renderProductionPanel();
  renderResources();
  updateProductionFlow();
  saveGame();
  currentMinigame = null;
}

function cancelMinigame() {
  if (!minigameActive) return;
  clearInterval(currentMinigame.timerInterval);
  clearTimeout(currentMinigame.moveTimeout);
  minigameActive = false;
  const modal = document.getElementById('minigame-modal');
  if (modal) modal.remove();
  currentMinigame = null;
  showNotification('ℹ️ Anulowano', 'Minigra została przerwana', 'info');
}

async function checkUserLogin() {
  try {
    const response = await fetch('/api/user');
    return await response.json();
  } catch (e) {
    return { loggedIn: false };
  }
}

async function loadUserProduction() {
  const user = await checkUserLogin();
  if (!user.loggedIn) return null;

  try {
    const response = await fetch('/api/user/production');
    const data = await response.json();
    return { user, data };
  } catch (e) {
    console.log('Error loading production:', e);
    return { user, data: null };
  }
}

async function saveUserProduction(resourcesData, equipment, inventory) {
  const user = await checkUserLogin();
  if (!user.loggedIn) return;

  try {
    await fetch('/api/user/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resources: resourcesData,
        equipment: equipment,
        inventory: inventory
      })
    });
  } catch (e) {
    console.log('Error saving production:', e);
  }
}

async function autoFillUserData() {
  const user = await checkUserLogin();
  if (user.loggedIn) {
    const discordInput = document.getElementById('buyer-discord');
    const nameInput = document.getElementById('buyer-name');

    if (discordInput && user.username) {
      discordInput.value = user.username + '#' + user.discriminator;
    }
    if (nameInput) nameInput.value = user.username;

    const form = document.getElementById('purchase-form');
    if (form && !form.querySelector('.login-indicator')) {
      const ind = document.createElement('div');
      ind.className = 'login-indicator';
      ind.style.cssText = 'background:rgba(0,255,136,0.15);border:1px solid #00ff88;border-radius:8px;padding:10px;margin-bottom:15px;color:#00ff88;text-align:center;';
      ind.innerHTML = '<i class="fas fa-check-circle"></i> Zalogowany jako ' + user.username;
      form.insertBefore(ind, form.firstChild);
    }
  }
  return user;
}

async function initiatePurchase(productId) {
  const product = shopProducts.find(function(p) { return p.id === productId; });
  if (!product) return;

  const user = await checkUserLogin();
  if (!user.loggedIn) {
    showNotification('⚠️ Wymagane logowanie', 'Zaloguj się przez Discord aby złożyć zamówienie', 'warning');
    return;
  }

  currentDiscountState = { valid: false, discount: 0, code: '' };

  const modal = document.createElement('div');
  modal.className = 'purchase-modal';
  modal.innerHTML =
    '<div class="purchase-content"><h2><i class="fas fa-shopping-cart"></i> Zakup Produktu</h2><div class="purchase-product"><img src="' + product.image + '" alt="' + product.name + '" /><div><h3>' + product.name + '</h3><p>' + product.desc + '</p><div class="price-display">Cena: ' + formatPrice(product.price) + '</div></div></div><form id="purchase-form"><div class="form-group"><label><i class="fas fa-user"></i> Imię i Nazwisko *</label><input type="text" id="buyer-name" required placeholder="Jan Kowalski" /></div><div class="form-group"><label><i class="fas fa-id-card"></i> Numer IC *</label><input type="text" id="buyer-ic" required placeholder="123456789" /></div><div class="form-group"><label><i class="fab fa-discord"></i> Discord *</label><input type="text" id="buyer-discord" required placeholder="username#1234" /></div><div class="form-group"><label><i class="fas fa-tag"></i> Kod Rabatowy</label><input type="text" id="discount-code" placeholder="Wpisz kod" /><small class="discount-info">Kod jest sprawdzany na serwerze</small></div><div class="discount-preview" id="discount-preview" style="display:none"><span class="discount-badge"></span><span class="discount-value"></span></div><div class="total-price"><span>Do zapłaty:</span><span id="final-price">' + formatPrice(product.price) + '</span></div><div class="form-buttons"><button type="button" class="cancel-btn" onclick="this.closest(\'.purchase-modal\').remove()">Anuluj</button><button type="submit" class="submit-btn"><i class="fas fa-check"></i> Zamawiam</button></div></form></div>';
  document.body.appendChild(modal);

  await autoFillUserData();

  const discountInput = document.getElementById('discount-code');
  const preview = document.getElementById('discount-preview');
  const finalPrice = document.getElementById('final-price');

  let discountTimeout = null;
  discountInput.addEventListener('input', function() {
    clearTimeout(discountTimeout);
    const code = safeText(this.value).toUpperCase();

    if (!code) {
      currentDiscountState = { valid: false, discount: 0, code: '' };
      preview.style.display = 'none';
      finalPrice.textContent = formatPrice(product.price);
      finalPrice.style.color = '';
      return;
    }

    discountTimeout = setTimeout(async function() {
      const result = await validateDiscountCode(code);
      if (result.valid) {
        currentDiscountState = { valid: true, discount: Number(result.discount || 0), code: code };
        const newPrice = Math.round(product.price * (1 - currentDiscountState.discount / 100));
        preview.style.display = 'flex';
        preview.querySelector('.discount-badge').textContent = 'Kod: ' + code;
        preview.querySelector('.discount-value').textContent = '-' + currentDiscountState.discount + '% = ' + formatPrice(newPrice);
        finalPrice.textContent = formatPrice(newPrice);
        finalPrice.style.color = '#37ff9c';
      } else {
        currentDiscountState = { valid: false, discount: 0, code: code };
        preview.style.display = 'none';
        finalPrice.textContent = formatPrice(product.price);
        finalPrice.style.color = '';
      }
    }, 300);
  });

  document.getElementById('purchase-form').addEventListener('submit', function(e) {
    e.preventDefault();
    submitOrder(productId);
  });
}

async function submitOrder(productId) {
  const product = shopProducts.find(function(p) { return p.id === productId; });
  if (!product) return;

  const customerName = safeText(document.getElementById('buyer-name').value);
  const customerNumber = safeText(document.getElementById('buyer-ic').value);
  const discountCode = safeText(document.getElementById('discount-code').value).toUpperCase();

  if (!customerName || !customerNumber) {
    showNotification('⚠️ Uzupełnij formularz', 'Wypełnij wszystkie wymagane pola.', 'warning');
    return;
  }

  let finalPrice = product.price;
  let validDiscountCode = '';

  if (discountCode) {
    const result = await validateDiscountCode(discountCode);
    if (result.valid) {
      finalPrice = Math.round(product.price * (1 - Number(result.discount || 0) / 100));
      validDiscountCode = discountCode;
    }
  }

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: [{ id: product.id, quantity: 1 }],
        customerName: customerName,
        customerNumber: customerNumber,
        discountCode: validDiscountCode || null,
        faction: 'Brak'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification('❌ Błąd zamówienia', data.error || 'Nie udało się złożyć zamówienia.', 'error');
      return;
    }

    const purchaseModal = document.querySelector('.purchase-modal');
    if (purchaseModal) purchaseModal.remove();

    showNotification('🎉 Zamówienie złożone!', 'Numer: ' + data.orderId, 'success');

    const sm = document.createElement('div');
    sm.className = 'success-modal';
    sm.innerHTML =
      '<div class="success-content"><div class="success-icon"><i class="fas fa-check-circle"></i></div><h2>Zamówienie Złożone!</h2><p>Numer: <strong>' + data.orderId + '</strong></p><p>Produkt: ' + product.name + '</p><p>Do zapłaty: <strong>' + formatPrice(data.total || finalPrice) + '</strong></p><div class="contact-buttons"><button class="contact-btn" onclick="openChat()"><i class="fas fa-comments"></i> Czat</button><a href="https://discord.gg/c8k8Mj868e" class="discord-btn" target="_blank" rel="noopener noreferrer"><i class="fab fa-discord"></i> Discord</a></div><button class="close-success" onclick="this.closest(\'.success-modal\').remove()">OK</button></div>';
    document.body.appendChild(sm);

    saveGame();
  } catch (error) {
    showNotification('❌ Błąd', 'Nie udało się połączyć z serwerem.', 'error');
  }
}

function initChat() {
  if (document.getElementById('chat-fab')) return;

  const cb = document.createElement('div');
  cb.className = 'chat-fab';
  cb.id = 'chat-fab';
  cb.innerHTML = '<i class="fas fa-comments"></i>';
  cb.onclick = function() { openChat(); };
  document.body.appendChild(cb);

  const cm = document.createElement('div');
  cm.className = 'chat-modal';
  cm.id = 'chat-modal';
  cm.style.display = 'none';
  cm.innerHTML = '<div class="chat-header"><span><i class="fas fa-headset"></i> Obsługa ARMOR</span><button class="chat-close" onclick="closeChat()"><i class="fas fa-times"></i></button></div><div class="chat-messages" id="chat-messages"><div class="chat-message system"><i class="fas fa-info-circle"></i> Witaj! Jak możemy pomóc?</div></div><div class="chat-input"><input type="text" id="chat-input" maxlength="500" placeholder="Napisz wiadomość..." /><button onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button></div>';
  document.body.appendChild(cm);
}

function openChat() {
  const chatModal = document.getElementById('chat-modal');
  const chatFab = document.getElementById('chat-fab');
  if (chatModal) chatModal.style.display = 'flex';
  if (chatFab) chatFab.style.display = 'none';
  const input = document.getElementById('chat-input');
  if (input) input.focus();
}

function closeChat() {
  const chatModal = document.getElementById('chat-modal');
  const chatFab = document.getElementById('chat-fab');
  if (chatModal) chatModal.style.display = 'none';
  if (chatFab) chatFab.style.display = 'flex';
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;

  const msg = safeText(input.value).slice(0, 500);
  if (!msg) return;

  const messagesDiv = document.getElementById('chat-messages');
  if (!messagesDiv) return;

  const m = document.createElement('div');
  m.className = 'chat-message user';
  m.innerHTML = '<i class="fas fa-user"></i> ' + msg;
  messagesDiv.appendChild(m);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  input.value = '';

  setTimeout(function() {
    const r = ['Dziękujemy!', 'Zgłoszenie przyjęte.', 'Skontaktuj się też na Discordzie!'];
    const rm = document.createElement('div');
    rm.className = 'chat-message support';
    rm.innerHTML = '<i class="fas fa-headset"></i> ' + r[Math.floor(Math.random() * r.length)];
    messagesDiv.appendChild(rm);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 1500);
}

document.addEventListener('click', function(e) {
  if (e.target.closest('[data-add-test]')) addTestResources();
  if (e.target.closest('[data-save-progress]')) {
    saveGame();
    showNotification('💾 Zapisano', 'Postęp został zapisany.', 'success');
  }
  if (e.target.closest('[data-refresh-shop]')) {
    renderShopProducts();
    showNotification('🔄 Odświeżono', 'Lista produktów została odświeżona.', 'info');
  }
});