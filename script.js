// URLs des fichiers CSV
const BASE_URL_LOGOS = '/horairePortsduSud/cciacs/dataports/logos/Maritimes/';
const BASE_URL = '/horairePortsduSud/cciacs/dataports/';
const PORTS_CSV = `${BASE_URL}ports.csv`;
const PORT_JOURNA_CSV = `${BASE_URL}port_journa_imo.csv`;
const PREVI_PORT_CSV = `${BASE_URL}previPort_imo.csv`;
const LOGO_COMPAGNIE_CSV = `${BASE_URL}LogoCompagnie_new.csv`;
const CONTACT_PORTS_CSV = `${BASE_URL}contact_ports.csv`;
const SITE_MAP = { 1: 'AJACCIO', 2: 'PORTO-VECCHIO', 3: 'BONIFACIO', 4: 'PROPRIANO', 5: 'PROPRIANO' };

// ======================= TRADUCTIONS =======================
/**/const traductions = {
    fr: { ports: { 1: "AJACCIO", 2: "PORTO-VECCHIO", 3: "BONIFACIO", 4: "PROPRIANO", 5: "PROPRIANO" }, from: "De:", to: "Pour:", capacity: "Capacité:", seeMarineTraffic: "Voir sur MarineTraffic", config: "Configuration", textSize: "Taille de texte", darkMode: "Mode sombre", marineWeather: "Météo marine", favorites: "Mes favoris", noFavorites: "Aucune escale en favori<br>Appuyez sur l'étoile pour l'ajouter", searchTitle: "Recherche Prévisionnelle", search: "Rechercher", contact: "Contact" },
    en: { ports: { 1: "AJACCIO", 2: "PORTO-VECCHIO", 3: "BONIFACIO", 4: "PROPRIANO", 5: "PROPRIANO" }, from: "From:", to: "To:", capacity: "Capacity:", seeMarineTraffic: "View on MarineTraffic", config: "Settings", textSize: "Text size", darkMode: "Dark mode", marineWeather: "Marine weather", favorites: "My favorites", noFavorites: "No favorite stop<br>Tap the star to add it", searchTitle: "Forecast Search", search: "Search", contact: "Contact" },
    it: { ports: { 1: "AJACCIO", 2: "PORTO-VECCHIO", 3: "BONIFACIO", 4: "PROPRIANO", 5: "PROPRIANO" }, from: "Da:", to: "Per:", capacity: "Capacità:", seeMarineTraffic: "Vedi su MarineTraffic", config: "Impostazioni", textSize: "Dimensione testo", darkMode: "Modalità scura", marineWeather: "Meteo marino", favorites: "I miei preferiti", noFavorites: "Nessuna scalo preferita<br>Tocca la stella per aggiungerla", searchTitle: "Ricerca Previsionale", search: "Cerca", contact: "Contatti" },
    co: { ports: { 1: "AIACCIU", 2: "PORTIVECHJU", 3: "BUNIFAZIU", 4: "PRUPRIÀ", 5: "PRUPRIÀ" }, from: "Da:", to: "Versu:", capacity: "Capacità:", seeMarineTraffic: "Vede nantu à MarineTraffic", config: "Cunfigurazione", textSize: "Taglia di testu", darkMode: "Modu scuru", marineWeather: "Meteu marinu", favorites: "I mo preferiti", noFavorites: "Alcunu scalo preferitu<br>Appughjà nantu à a stella", searchTitle: "Ricerca Previstiunale", search: "Ricerca", contact: "Cuntatti" }
};


let currentLang = localStorage.getItem('lang') || 'fr';
function t(key) { return traductions[currentLang][key] || traductions.fr[key] || key; }

function formatTime(d) { return d && d.length >= 12 ? d.slice(8, 10) + ':' + d.slice(10, 12) : ''; }
function formatDate(d) { return d && d.length >= 8 ? d.slice(6, 8) + '/' + d.slice(4, 6) + '/' + d.slice(0, 4) : 'Date inconnue'; }

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add('active');
    if (tabName.startsWith('port')) {
        loadPortData(tabName);
        if (localStorage.getItem('meteoActive') === 'true') {
            const num = tabName.replace('port', '');
            chargerMeteo(num);
        }
    } else if (tabName === 'contact') loadContactData();
    else if (tabName === 'recherche') populateSiteSelect();
    else if (tabName === 'favoris') afficherFavoris();
}

// ======================= FAVORIS + NOTIFICATIONS =======================
const FAV_KEY = 'escales_favoris';
let favoris = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
function sauvegarderFavoris() { localStorage.setItem(FAV_KEY, JSON.stringify(favoris)); }
function ajouterBoutonFavori(escaleDiv, data) {
    const estFavori = favoris.some(f => f.id === data.id);
    const btn = document.createElement('button');
    btn.className = `fav-btn ${estFavori ? 'favori' : ''}`;
    btn.innerHTML = estFavori ? '★' : '☆';
    btn.onclick = e => {
        e.stopPropagation();
        const i = favoris.findIndex(f => f.id === data.id);
        if (i === -1) {
            favoris.push(data);
            btn.classList.add('favori');
            btn.innerHTML = '★';
            planifierNotification(data);
        } else {
            favoris.splice(i, 1);
            btn.classList.remove('favori');
            btn.innerHTML = '☆';
        }
        sauvegarderFavoris();
        afficherFavoris();
    };
    escaleDiv.style.position = 'relative';
    escaleDiv.appendChild(btn);
}
function afficherFavoris() {
    const c = document.getElementById('favoris-list');
    const n = document.getElementById('no-favoris');
    if (favoris.length === 0) {
        c.innerHTML = '';
        if (n) n.style.display = 'block';
        return;
    }
    if (n) n.style.display = 'none';
    c.innerHTML = favoris.map(f => `
        <div class="escale"><div class="port-depart">${t('from')} ${f.from} → ${f.to}</div>
        <div class="port-destination">${f.ship} • ${f.time}</div>
        <div class="navire-info"><span>${f.date}</span></div></div>`).join('');
}
function planifierNotification(escale) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const [d, m, y] = escale.date.split('/');
    const depart = new Date(`${y}-${m}-${d}T${escale.time}:00`);
    const delai = depart.getTime() - Date.now() - 30 * 60 * 1000;
    if (delai > 0) {
        setTimeout(() => new Notification('Départ dans 30 min !', {
            body: `${escale.ship} → ${escale.to}`,
            icon: BASE_URL_LOGOS + 'logo.png'
        }), delai);
    }
}
if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();

// ======================= MÉTÉO MARINE =======================
const METEO_COORDS = { '1': [41.9186, 8.7381], '2': [41.5890, 9.2800], '3': [41.3860, 9.1590], '4': [42.0833, 8.7500], '5': [42.0833, 8.7500] };
async function chargerMeteo(portNum) {
    const coords = METEO_COORDS[portNum]; if (!coords) return;
    const [lat, lon] = coords;
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wind_speed_10m,wind_direction_10m&timezone=Europe%2FParis`;
    try {
        const r = await fetch(url); const d = await r.json();
        const h = new Date().getHours();
        const ventKn = (d.hourly.wind_speed_10m[h] * 1.94384).toFixed(1);
        const dir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'][Math.round(d.hourly.wind_direction_10m[h] / 22.5) % 16];
        const html = `<div class="meteo-info"><span>🌊 ${d.hourly.wave_height[h].toFixed(1)} m</span><span>💨 ${ventKn} kn ${dir}</span></div>`;
        const titre = document.getElementById(`port${portNum}-title`);
        let div = titre.querySelector('.meteo-info');
        if (!div) { div = document.createElement('div'); titre.appendChild(div); }
        div.outerHTML = html;
    } catch (e) { console.log('Météo indisponible'); }
}

// ======================= ESCALES DU JOUR =======================
async function loadPortData(portTab) {
    const portNum = portTab.replace('port', '');
    const [j, l, p] = await Promise.all([fetch(PORT_JOURNA_CSV), fetch(LOGO_COMPAGNIE_CSV), fetch(PORTS_CSV)]);
    const journa = await j.text(), logos = await l.text(), ports = await p.text();
    const rows = journa.split('\n').map(r => r.split(',').map(c => c.replace(/"/g, '').trim()));
    const filtered = rows.filter(r => r[2] === portNum);
    const logoMap = new Map(logos.split('\n').map(l => l.split(',').map(c => c.replace(/"/g, '').trim())).map(([n, , f]) => [n.toLowerCase(), BASE_URL_LOGOS + f]));
    const portsMap = new Map(ports.split('\n').map(l => l.split(',').map(c => c.replace(/"/g, '').trim())).map(([id, n]) => [id, n]));
    const container = document.getElementById(`${portTab}-data`); container.innerHTML = '';
    filtered.forEach(r => {
        const [idDep, idDest, , , arrival, departure, type, ship, company, cap, imo] = r;
        const from = portsMap.get(idDep) || idDep, to = portsMap.get(idDest) || idDest, logo = logoMap.get(company.toLowerCase()) || '';
        const div = document.createElement('div');
        div.className = `escale ${type === 'Croisière' ? 'croisiere-background' : ''}`;
        div.innerHTML = `
            <div class="port-depart">${t('from')} ${from}<span class="horaire">(${formatTime(arrival)})</span></div>
            <div class="port-destination">${t('to')} ${to}<span class="horaire">(${formatTime(departure)})</span></div>
            <div class="navire-info">
                <img src="${logo}" alt="${company}" onerror="this.style.display='none'">
                <span>${ship}</span>
                ${type === 'Croisière' ? `<span class="capacite">${t('capacity')}: ${cap}</span>` : ''}
            </div>
            ${imo ? `<a href="https://www.marinetraffic.com/fr/ais/details/ships/imo:${imo}" target="_blank" class="btn-marinetraffic">${t('seeMarineTraffic')}</a>` : ''}
        `;
        const data = { id: `${arrival}-${departure}-${ship}`, from, to, ship, time: formatTime(departure), date: new Date().toLocaleDateString('fr-FR') };
        ajouterBoutonFavori(div, data);
        container.appendChild(div);
    });
    if (localStorage.getItem('meteoActive') === 'true') chargerMeteo(portNum);
}

// ======================= RECHERCHE =======================
document.getElementById('search-form').addEventListener('submit', async e => {
    e.preventDefault();
    const site = document.getElementById('search-site').value;
    const type = document.getElementById('search-type').value;
    const ds = document.getElementById('search-date-start').value.replace(/-/g, '');
    const de = document.getElementById('search-date-end').value.replace(/-/g, '');
    const mode = document.getElementById('search-arrival-departure').value;
    const [previ, ports, logo] = await Promise.all([fetch(PREVI_PORT_CSV), fetch(PORTS_CSV), fetch(LOGO_COMPAGNIE_CSV)]);
    const previT = await previ.text(), portsT = await ports.text(), logoT = await logo.text();
    const rows = previT.split('\n').map(r => r.replace(/^"|"$/g, '').split(','));
    const portsMap = new Map(portsT.split('\n').map(l => l.split(',').map(c => c.replace(/"/g, '').trim())).map(([id, n]) => [id, n]));
    const logoMap = new Map(logoT.split('\n').map(l => l.split(',').map(c => c.replace(/"/g, '').trim())).map(([n, , f]) => [n.toLowerCase(), BASE_URL_LOGOS + f]));
    const container = document.getElementById('search-results'); container.innerHTML = '';
    rows.forEach(r => {
        if (r.length < 11) return;
        const [idDep, idDest, idSite, , arrival, departure, typeEscale, ship, company, cap, imo] = r;
        const check = mode === 'arrival' ? arrival : departure;
        if ((site && idSite !== site) || (type && typeEscale !== type) || (ds && check < ds) || (de && check > de)) return;
        const from = portsMap.get(idDep) || idDep, to = portsMap.get(idDest) || idDest, logo = logoMap.get(company.toLowerCase()) || '';
        const div = document.createElement('div');
        div.className = `escale ${typeEscale === 'Croisière' ? 'croisiere-background' : ''}`;
        div.innerHTML = `
            <div class="port-depart">${t('from')} ${from} <span class="horaire">(${formatTime(arrival)})</span> <strong>${formatDate(arrival)}</strong></div>
            <div class="port-destination">${t('to')} ${to} <span class="horaire">(${formatTime(departure)})</span> <strong>${formatDate(departure)}</strong></div>
            <div class="navire-info">
                <img src="${logo}" alt="${company}" onerror="this.style.display='none'">
                <span>${ship}</span>
                <span>${traductions[currentLang].ports[idSite] || SITE_MAP[idSite] || idSite}</span>
                ${typeEscale === 'Croisière' ? `<span class="capacite">${t('capacity')} ${cap}</span>` : ''}
            </div>
            ${imo ? `<a href="https://www.marinetraffic.com/fr/ais/details/ships/imo:${imo}" target="_blank" class="btn-marinetraffic">${t('seeMarineTraffic')}</a>` : ''}
        `;
        const data = { id: `${arrival}-${departure}-${ship}-${idSite}`, from, to, ship, time: formatTime(departure), date: formatDate(arrival) };
        ajouterBoutonFavori(div, data);
        container.appendChild(div);
    });
});

// ======================= INITIALISATION =======================
function updatePortTitles() {
    const today = new Date().toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : currentLang === 'en' ? 'en-GB' : currentLang === 'it' ? 'it-IT' : 'fr-FR');
    const ports = traductions[currentLang].ports;
    Object.entries(ports).forEach(([num, name]) => {
        const titleEl = document.getElementById(`port${num === '5' ? '4' : num}-title`);
        if (titleEl) titleEl.innerHTML = `<h2>${name} - ${today.includes('Invalid') ? new Date().toLocaleDateString('fr-FR') : today}</h2>`;

        // Traduit aussi le bouton de l'onglet
        const tabBtn = document.querySelector(`button[onclick="openTab('port${num === '5' ? '4' : num}')"]`);
        if (tabBtn) tabBtn.textContent = name;
    });
}

function populateSiteSelect() {
    const s = document.getElementById('search-site');
    s.innerHTML = `<option value="">${t('all') || 'Tous'}</option>`;
    Object.entries(traductions[currentLang].ports).forEach(([id, name]) => s.innerHTML += `<option value="${id}">${name}</option>`);
}

document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;

    // Langue
    currentLang = localStorage.getItem('lang') || 'fr';
    document.getElementById('lang-select').value = currentLang;
    function appliquerLangue(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        // CONFIG —
        const settings = document.querySelectorAll('#config .setting-item span');
        if (settings[0]) settings[0].textContent = t('textSize');      // Taille de texte
        if (settings[1]) settings[1].textContent = t('darkMode');      // Mode sombre
        if (settings[3]) settings[3].textContent = t('marineWeather'); // Météo marine
        //  if (settings[3]) settings[3].textContent = "Langue";           // Langue (fixe)

        document.querySelector('#config h2').textContent = t('config');

        // Favoris
        document.querySelector('#favoris h2').textContent = t('favorites');
        const noFav = document.getElementById('no-favoris');
        if (noFav) noFav.innerHTML = t('noFavorites');

        // Recherche
        document.querySelector('#recherche h2').textContent = t('searchTitle');
        document.querySelector('#search-form button').textContent = t('search');

        // Titres des ports + rechargement du port actif
        updatePortTitles();
        populateSiteSelect();

        // Recharge le port actif pour que "De:", "Pour:", etc. soient traduits
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.getAttribute('onclick')?.includes('port')) {
            const tabName = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
            loadPortData(tabName);
        }
    }

    document.getElementById('lang-select').addEventListener('change', e => appliquerLangue(e.target.value));
    appliquerLangue(currentLang);

    // Taille police
    const btns = document.querySelectorAll('.font-btn');
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    html.classList.add(`font-${savedSize}`);
    document.querySelector(`.font-btn[data-size="${savedSize}"]`)?.classList.add('active');
    btns.forEach(b => b.addEventListener('click', () => {
        html.classList.remove('font-small', 'font-medium', 'font-large');
        btns.forEach(x => x.classList.remove('active'));
        const sz = b.dataset.size;
        html.classList.add(`font-${sz}`);
        b.classList.add('active');
        localStorage.setItem('fontSize', sz);
    }));

    // Dark mode
    const dt = document.getElementById('dark-mode-toggle');
    const sd = localStorage.getItem('darkMode') === 'true';
    if (sd) { document.body.classList.add('dark-mode'); if (dt) dt.checked = true; }
    if (dt) dt.addEventListener('change', e => { document.body.classList.toggle('dark-mode', e.target.checked); localStorage.setItem('darkMode', e.target.checked); });

    // Météo marine
    const meteoToggle = document.getElementById('meteo-toggle');
    const meteoActive = localStorage.getItem('meteoActive') === 'true';
    if (meteoToggle) {
        meteoToggle.checked = meteoActive;
        meteoToggle.addEventListener('change', function () {
            localStorage.setItem('meteoActive', this.checked);
            if (this.checked) {
                const activeBtn = document.querySelector('.tab.active');
                if (activeBtn && activeBtn.onclick.toString().includes('port')) {
                    const num = activeBtn.onclick.toString().match(/port(\d)/)[1];
                    chargerMeteo(num);
                }
            } else {
                document.querySelectorAll('.meteo-info').forEach(el => el.remove());
            }
        });
    }
    if (meteoActive) setTimeout(() => chargerMeteo('1'), 1000);

    // Démarrage
    updatePortTitles();
    loadPortData('port1');
    populateSiteSelect();
    afficherFavoris();
});
// ======================= SWIPE ENTRE ONGLETS (mobile) =======================
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // pixels minimum pour déclencher le swipe

document.querySelector('.container').addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.querySelector('.container').addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    if (Math.abs(touchStartX - touchEndX) < swipeThreshold) return;

    const tabs = Array.from(document.querySelectorAll('.tab'));
    const activeTab = document.querySelector('.tab.active');
    const currentIndex = tabs.indexOf(activeTab);

    let newIndex;

    if (touchEndX < touchStartX) {
        // swipe gauche → onglet suivant
        newIndex = (currentIndex + 1) % tabs.length;
    } else if (touchEndX > touchStartX) {
        // swipe droite → onglet précédent
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (newIndex !== undefined && tabs[newIndex]) {
        const newTabName = tabs[newIndex].getAttribute('onclick').match(/'([^']+)'/)[1];
        openTab(newTabName);
    }

}
