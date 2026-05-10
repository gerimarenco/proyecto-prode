/**
 * app.js
 * Controlador principal. Detecta la pagina actual y orquesta
 * la carga de datos reales desde el backend.
 */

document.addEventListener('DOMContentLoaded', () => {
  updateAuthNav();
  initAccountMenu();
  const page = detectPage();
  switch (page) {
    case 'home':          initHome();          break;
    case 'partidos':      initPartidos();      break;
    case 'predicciones':  initPredicciones();  break;
    case 'clasificacion': initClasificacion(); break;
    case 'auth':          initAuth();          break;
  }
});

function detectPage() {
  const p = window.location.pathname;
  if (p.includes('partidos'))      return 'partidos';
  if (p.includes('predicciones'))  return 'predicciones';
  if (p.includes('clasificacion')) return 'clasificacion';
  if (p.includes('auth'))          return 'auth';
  return 'home';
}

function updateAuthNav() {
  const user = API.getCurrentUser();
  document.querySelectorAll('[data-auth-link]').forEach(link => {
    link.textContent = user ? user.nombre || user.username : 'Ingresar';
    link.href = link.dataset.authHref || 'auth.html';
  });

  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.classList.toggle('hidden', !user);
    btn.addEventListener('click', () => {
      API.logout();
      window.location.href = authRelativePath('auth.html');
    });
  });
}

function initAccountMenu() {
  document.querySelectorAll('.navbar').forEach(navbar => {
    if (navbar.querySelector('[data-menu-toggle]')) return;

    const user = API.getCurrentUser();
    const menu = document.createElement('div');
    menu.className = 'account-menu';
    menu.innerHTML = `
      <button class="account-menu__button" data-menu-toggle aria-label="Abrir menú">
        <span>${initial(user?.nombre || user?.username || 'U')}</span>
      </button>
      <div class="account-drawer" data-menu-drawer>
        <div class="account-drawer__head">
          <strong>${escapeHtml(user?.nombre || user?.username || 'Invitado')}</strong>
          <small>${user ? 'Sesión activa' : 'Sin sesión'}</small>
        </div>
        <a href="${authRelativePath('auth.html')}">${user ? 'Mi cuenta' : 'Ingresar'}</a>
        <a href="${homeRelativePath()}">Competencias</a>
        <button class="${user ? '' : 'hidden'}" data-menu-logout>Cerrar Sesión</button>
      </div>
    `;
    navbar.appendChild(menu);
  });

  document.querySelectorAll('[data-menu-toggle]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      button.closest('.account-menu')?.classList.toggle('open');
    });
  });

  document.querySelectorAll('[data-menu-logout]').forEach(button => {
    button.addEventListener('click', () => {
      API.logout();
      window.location.href = authRelativePath('auth.html');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.account-menu.open').forEach(menu => menu.classList.remove('open'));
  });
}

function authRelativePath(path) {
  return window.location.pathname.includes('/pages/') ? path : `pages/${path}`;
}

function pagePath(path) {
  return window.location.pathname.includes('/pages/') ? path : `pages/${path}`;
}

function homeRelativePath(hash = '') {
  const base = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
  return `${base}${hash}`;
}

/* --------------------------------------------------------
   AUTH
   -------------------------------------------------------- */
function initAuth() {
  if (API.getToken()) {
    API.me().then(() => updateAuthNav()).catch(() => API.logout());
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setAuthError('');

    const form = new FormData(loginForm);
    try {
      await API.login({
        identificador: form.get('identificador'),
        password: form.get('password'),
      });
      window.location.href = '../index.html';
    } catch (error) {
      setAuthError(error.message);
    }
  });

  registerForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setAuthError('');

    const form = new FormData(registerForm);
    try {
      await API.register({
        username: form.get('username'),
        nombre: form.get('nombre'),
        email: form.get('email'),
        password: form.get('password'),
      });
      window.location.href = '../index.html';
    } catch (error) {
      setAuthError(error.message);
    }
  });
}

function setAuthError(message) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('hidden', !message);
}

/* --------------------------------------------------------
   HOME: COMPETENCIAS -> PREDICCIONES / TORNEOS DE AMIGOS
   -------------------------------------------------------- */
function initHome() {
  loadCompetencias();
  document.getElementById('create-torneo-form')?.addEventListener('submit', handleCreateTorneo);
  document.querySelector('[data-back-to-competencias]')?.addEventListener('click', () => showCompetitionPicker());
  document.querySelectorAll('[data-home-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchHomeTab(btn.dataset.homeTab));
  });
  document.querySelectorAll('.filter-chip[data-group="estado"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-group="estado"]')
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadPartidos();
    });
  });
  window.addEventListener('hashchange', () => {
    const competencia = API.getSelectedCompetencia();
    if (!competencia) return;
    selectCompetencia(competencia, window.location.hash.replace('#', ''));
  });
}

async function loadCompetencias() {
  const listEl = document.getElementById('competencias-list');
  if (!listEl) return;

  showSkeleton(listEl, 3);
  setHomeError('');

  try {
    const competencias = await API.getCompetencias();
    if (!competencias.length) {
      listEl.innerHTML = emptyState('No hay competencias disponibles.');
      return;
    }

    const selected = API.getSelectedCompetencia();
    const active = competencias.find(c => c.id === selected?.id);
    listEl.innerHTML = competencias.map(c => renderCompetenciaCard(c, c.id === active?.id)).join('');
    listEl.querySelectorAll('[data-competencia-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const competencia = competencias.find(c => c.id === btn.dataset.competenciaId);
        selectCompetencia(competencia);
      });
    });

    if (active && window.location.hash) {
      selectCompetencia(active, window.location.hash.replace('#', ''));
    } else {
      showCompetitionPicker();
    }
  } catch (error) {
    listEl.innerHTML = errorState(error.message);
    setHomeError(error.message);
  }
}

function showCompetitionPicker() {
  document.getElementById('competition-picker')?.classList.remove('hidden');
  document.getElementById('competencia-workspace')?.classList.add('hidden');
  history.replaceState(null, '', 'index.html');
}

async function selectCompetencia(competencia, preferredTab = 'predicciones') {
  if (!competencia) return;
  API.setSelectedCompetencia(competencia);
  document.getElementById('competition-picker')?.classList.add('hidden');
  document.getElementById('competencia-workspace')?.classList.remove('hidden');
  setText('competencia-title', competencia.nombre);
  switchHomeTab(preferredTab === 'torneos' ? 'torneos' : 'predicciones');
  await loadPartidos();
  await loadTorneosForCompetencia(competencia);
}

function renderCompetenciaCard(competencia, active) {
  return `
    <button class="competition-card ${active ? 'active' : ''}" data-competencia-id="${competencia.id}">
      <span class="competition-card__name">${escapeHtml(competencia.nombre)}</span>
      <span class="competition-card__slug">${escapeHtml(competencia.slug)}</span>
    </button>
  `;
}

async function loadTorneosForCompetencia(competencia = API.getSelectedCompetencia()) {
  const listEl = document.getElementById('torneos-list');
  const formEl = document.getElementById('create-torneo-form');
  if (!listEl || !competencia) return;

  showSkeleton(listEl, 2);
  formEl?.classList.toggle('hidden', !API.getToken());

  try {
    const torneos = await API.getTorneosDeAmigos({ competenciaId: competencia.id });
    if (!torneos.length) {
      listEl.innerHTML = emptyState('Todavía no hay Torneos de Amigos para esta competencia.');
      return;
    }

    const selected = API.getSelectedTorneo();
    listEl.innerHTML = torneos.map(t => renderTorneoCard(t, t.id === selected?.id)).join('');
    listEl.querySelectorAll('[data-torneo-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const torneo = torneos.find(t => t.id === btn.dataset.torneoId);
        API.setSelectedTorneo(torneo);
        window.location.href = pagePath('clasificacion.html');
      });
    });
  } catch (error) {
    listEl.innerHTML = errorState(error.message);
  }
}

function switchHomeTab(tab) {
  const next = tab === 'torneos' ? 'torneos' : 'predicciones';
  document.querySelectorAll('[data-home-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.homeTab === next);
  });
  document.getElementById('home-tab-predicciones')?.classList.toggle('hidden', next !== 'predicciones');
  document.getElementById('home-tab-torneos')?.classList.toggle('hidden', next !== 'torneos');
  if (!document.getElementById('competencia-workspace')?.classList.contains('hidden')) {
    history.replaceState(null, '', `index.html#${next}`);
  }
}

function renderTorneoCard(torneo, active) {
  const miembros = torneo.miembrosCount === 1 ? '1 miembro' : `${torneo.miembrosCount ?? 0} miembros`;
  return `
    <button class="tournament-card ${active ? 'active' : ''}" data-torneo-id="${torneo.id}">
      <span>
        <strong>${escapeHtml(torneo.nombre)}</strong>
        <small>${escapeHtml(torneo.competencia?.nombre || '')}</small>
      </span>
      <span class="tournament-card__meta">${miembros}</span>
    </button>
  `;
}

async function handleCreateTorneo(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const input = form.querySelector('[name="nombre"]');
  const competencia = API.getSelectedCompetencia();
  const listEl = document.getElementById('torneos-list');
  if (!competencia || !input?.value.trim()) return;

  submit.disabled = true;
  submit.textContent = 'Creando...';

  try {
    const torneo = await API.createTorneoDeAmigos({
      nombre: input.value.trim(),
      competenciaId: competencia.id,
    });
    API.setSelectedTorneo(torneo);
    form.reset();
    await loadTorneosForCompetencia(competencia);
  } catch (error) {
    if (listEl) listEl.innerHTML = errorState(error.message);
  } finally {
    submit.disabled = false;
    submit.textContent = 'Crear';
  }
}

function setHomeError(message) {
  const el = document.getElementById('home-error');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('hidden', !message);
}

/* --------------------------------------------------------
   PARTIDOS
   -------------------------------------------------------- */
function initPartidos() {
  renderSelectedContext();
  loadPartidos();

  document.querySelectorAll('.filter-chip[data-group="estado"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-group="estado"]')
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadPartidos();
    });
  });
}

async function loadPartidos() {
  const el = document.getElementById('matches-list');
  if (!el) return;

  const competencia = API.getSelectedCompetencia();
  if (!competencia) {
    el.innerHTML = emptyState('Elegí una competencia para ver partidos.');
    return;
  }

  const active = document.querySelector('.filter-chip[data-group="estado"].active');
  const estado = active?.dataset.value || '';

  showSkeleton(el, 4);

  try {
    const matches = await API.getMatches({ competenciaId: competencia.id, estado });
    el.innerHTML = '';
    if (!matches.length) {
      el.innerHTML = emptyState('No hay partidos para este filtro.');
      return;
    }
    matches.forEach(m => el.appendChild(Predictions.createMatchCard(m)));
  } catch (error) {
    el.innerHTML = errorState(error.message);
  }
}

/* --------------------------------------------------------
   MIS PREDICCIONES
   -------------------------------------------------------- */
function initPredicciones() {
  renderSelectedContext();
  loadUserStats();
  loadPendingPredictions();
  loadHistoryPredictions();

  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
}

async function loadUserStats() {
  try {
    const preds = await API.getUserPredictions();
    const aciertos = preds.filter(p => p.estado === 'acierto').length;
    const puntos   = preds.reduce((a, p) => a + (p.puntos || 0), 0);
    const racha    = calcularRacha(preds);
    const cerradas = preds.filter(p => p.estado !== 'pendiente').length;
    const pct      = cerradas ? Math.round(aciertos / cerradas * 100) : 0;

    setText('stat-puntos',   puntos);
    setText('stat-aciertos', aciertos);
    setText('stat-pct',      pct + '%');
    setText('stat-racha',    racha);
  } catch (error) {
    setPrediccionesError(error.message);
  }
}

async function loadPendingPredictions() {
  const el = document.getElementById('predictions-pending');
  if (!el) return;
  try {
    const preds = await API.getUserPredictions({ estado: 'pendiente' });
    el.className = preds.length ? 'pred-list' : '';
    el.innerHTML = preds.length
      ? preds.map(renderPredRow).join('')
      : emptyState('No tenés predicciones pendientes.');
  } catch (error) { el.innerHTML = errorState(error.message); }
}

async function loadHistoryPredictions() {
  const el = document.getElementById('predictions-history');
  if (!el) return;
  try {
    const preds = (await API.getUserPredictions()).filter(p => p.estado !== 'pendiente');
    el.className = preds.length ? 'pred-list' : '';
    el.innerHTML = preds.length
      ? preds.map(renderPredRow).join('')
      : emptyState('Todavía no tenés historial.');
  } catch (error) { el.innerHTML = errorState(error.message); }
}

function setPrediccionesError(message) {
  const pending = document.getElementById('predictions-pending');
  const history = document.getElementById('predictions-history');
  if (pending) pending.innerHTML = errorState(message);
  if (history) history.innerHTML = errorState(message);
}

function renderPredRow(pred) {
  const cls   = pred.estado === 'acierto' ? 'hit' : pred.estado === 'fallo' ? 'miss' : 'pending';
  const label = pred.estado === 'acierto' ? 'Acierto' : pred.estado === 'fallo' ? 'Fallo' : 'Pendiente';
  const pts   = pred.puntos > 0 ? `+${pred.puntos}` : '-';
  const score = `${pred.scoreEquipo1Pred ?? '?'}-${pred.scoreEquipo2Pred ?? '?'}`;

  const rowCls = pred.estado === 'acierto' ? 'is-hit' : pred.estado === 'fallo' ? 'is-miss' : '';
  return `
    <div class="pred-row ${rowCls}">
      <div class="pred-match">
        <div class="pred-match-name">${escapeHtml(pred.equipo1)} vs ${escapeHtml(pred.equipo2)}</div>
        <div class="pred-match-meta">${escapeHtml(pred.liga || '')} · Mi pred: ${score}</div>
      </div>
      <span class="pred-tag ${cls}">${label}</span>
      <span class="pred-pts ${pred.puntos > 0 ? 'positive' : ''}">${pts}</span>
    </div>
  `;
}

function calcularRacha(preds) {
  let r = 0;
  for (const p of [...preds].reverse()) { if (p.estado === 'acierto') r++; else if (p.estado === 'fallo') break; }
  return r;
}

/* --------------------------------------------------------
   CLASIFICACION
   -------------------------------------------------------- */
function initClasificacion() {
  renderSelectedContext();
  loadSelectedTorneoHeader();
  loadLeaderboard();
}

async function loadSelectedTorneoHeader() {
  const title = document.getElementById('torneo-title');
  const subtitle = document.getElementById('torneo-subtitle');
  const selected = API.getSelectedTorneo();
  if (!selected) return;
  try {
    const torneo = await API.getTorneoDeAmigos(selected.id);
    API.setSelectedTorneo(torneo);
    if (title) title.textContent = torneo.nombre;
    if (subtitle) subtitle.textContent = torneo.competencia?.nombre || 'Torneo de Amigos';
  } catch {
    if (title) title.textContent = selected.nombre || 'Torneo de Amigos';
  }
}

async function loadLeaderboard() {
  const podiumEl  = document.getElementById('podium');
  const rankingEl = document.getElementById('ranking-list');
  if (!rankingEl) return;

  if (!API.getSelectedTorneo()) {
    if (podiumEl) podiumEl.innerHTML = '';
    rankingEl.innerHTML = emptyState('Elegí un Torneo de Amigos para ver el ranking.');
    return;
  }

  try {
    const ranking = await API.getLeaderboard();

    if (!ranking.length) {
      if (podiumEl) podiumEl.innerHTML = '';
      rankingEl.innerHTML = emptyState('Todavía no hay puntajes en este torneo.');
      return;
    }

    if (podiumEl) {
      const top = ranking.slice(0, 3);
      const order   = [top[1], top[0], top[2]];
      const mClasses = ['medal medal-2', 'medal medal-1', 'medal medal-3'];
      const mNums    = ['2', '1', '3'];
      const classes  = ['podium-item--2', 'podium-item--1', 'podium-item--3'];

      podiumEl.innerHTML = order.map((r, i) => r ? `
        <div class="podium-item ${classes[i]}">
          <span class="${mClasses[i]}">${mNums[i]}</span>
          <div class="podium-avatar">${initial(r.nombre)}</div>
          <div class="podium-name">${escapeHtml(r.nombre)}</div>
          <div class="podium-pts">${r.puntos} pts</div>
          <div class="podium-bar"></div>
        </div>
      ` : '').join('');
    }

    const rest = ranking.slice(3);
    rankingEl.innerHTML = rest.length
      ? rest.map((r, i) => renderRankRow(r, i + 3)).join('')
      : '';

  } catch (error) {
    if (podiumEl) podiumEl.innerHTML = '';
    rankingEl.innerHTML = errorState(error.message);
  }
}

function renderRankRow(r, i) {
  const posEl = i === 0 ? `<span class="medal medal-1">1</span>`
              : i === 1 ? `<span class="medal medal-2">2</span>`
              : i === 2 ? `<span class="medal medal-3">3</span>`
              : `<span class="rank-pos">${i + 1}</span>`;
  return `
    <div class="ranking-row">
      ${posEl}
      <div class="rank-avatar">${initial(r.nombre)}</div>
      <div class="rank-info">
        <div class="rank-name">${escapeHtml(r.nombre)}</div>
        <div class="rank-sub">${r.aciertos ?? 0} aciertos · ${r.exactos ?? 0} exactos</div>
      </div>
      <div class="rank-right">
        <div class="rank-pts">${r.puntos}</div>
        <span class="rank-pts-label">pts</span>
      </div>
    </div>
  `;
}

function renderSelectedContext() {
  const el = document.getElementById('selected-context');
  if (!el) return;
  const competencia = API.getSelectedCompetencia();
  const torneo = API.getSelectedTorneo();
  const isPredictionsView = window.location.pathname.includes('partidos');

  if (isPredictionsView) {
    el.innerHTML = `
      <span>${escapeHtml(competencia?.nombre || 'Sin competencia')}</span>
      <a class="btn btn-outline btn-sm" href="${homeRelativePath('#predicciones')}">Cambiar</a>
    `;
    return;
  }

  el.innerHTML = `
    <span>${escapeHtml(competencia?.nombre || 'Sin competencia')}</span>
    <strong>${escapeHtml(torneo?.nombre || 'Sin torneo')}</strong>
    <a class="btn btn-outline btn-sm" href="${homeRelativePath('#torneos')}">Cambiar</a>
  `;
}

/* --------------------------------------------------------
   UTILS
   -------------------------------------------------------- */
function showSkeleton(container, count) {
  container.innerHTML = `
    <div class="skeleton-wrap">
      ${Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
          <div class="skel" style="width:42%;height:10px;margin-bottom:.75rem;border-radius:4px"></div>
          <div class="skel" style="width:100%;height:36px;border-radius:8px"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function emptyState(msg) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">!</div>
      <p>${escapeHtml(msg)}</p>
    </div>
  `;
}

function errorState(msg) {
  return `
    <div class="empty-state error-state">
      <div class="empty-state-icon">!</div>
      <p>${escapeHtml(msg)}</p>
    </div>
  `;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function initial(value) {
  return String(value || '?').trim()[0]?.toUpperCase() || '?';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
