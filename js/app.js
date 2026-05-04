/**
 * app.js
 * Controlador principal. Detecta la pagina actual y orquesta
 * la carga de datos y el renderizado de componentes.
 */

document.addEventListener('DOMContentLoaded', () => {
  const page = detectPage();
  switch (page) {
    case 'home':          initHome();          break;
    case 'partidos':      initPartidos();      break;
    case 'predicciones':  initPredicciones();  break;
    case 'clasificacion': initClasificacion(); break;
  }
});

function detectPage() {
  const p = window.location.pathname;
  if (p.includes('partidos'))      return 'partidos';
  if (p.includes('predicciones'))  return 'predicciones';
  if (p.includes('clasificacion')) return 'clasificacion';
  return 'home';
}

/* --------------------------------------------------------
   HOME
   -------------------------------------------------------- */
function initHome() {
  loadFeaturedMatches();
  loadTopLeaderboard();
}

async function loadFeaturedMatches() {
  const el = document.getElementById('featured-matches');
  if (!el) return;

  try {
    const matches = await API.getMatches();
    el.innerHTML = '';
    if (!matches.length) {
      el.innerHTML = emptyState('No hay partidos disponibles');
      return;
    }
    matches.slice(0, 6).forEach(m => el.appendChild(Predictions.createMatchCard(m)));
  } catch {
    el.innerHTML = emptyState('No se pudieron cargar los partidos');
  }
}

async function loadTopLeaderboard() {
  const el = document.getElementById('top-ranking');
  if (!el) return;

  try {
    const ranking = await API.getLeaderboard({ limit: 5 });
    if (!ranking.length) { el.innerHTML = emptyState('Sin datos aun'); return; }
    el.innerHTML = ranking.map((r, i) => renderRankRow(r, i)).join('');
  } catch {
    el.innerHTML = emptyState('Sin datos disponibles');
  }
}

/* --------------------------------------------------------
   PARTIDOS
   -------------------------------------------------------- */
function initPartidos() {
  loadPartidos();

  document.querySelectorAll('.filter-chip[data-group="liga"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-group="liga"]')
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadPartidos();
    });
  });
}

async function loadPartidos() {
  const el = document.getElementById('matches-list');
  if (!el) return;

  const active = document.querySelector('.filter-chip[data-group="liga"].active');
  const liga = active?.dataset.value || '';

  showSkeleton(el, 4);

  try {
    const matches = await API.getMatches({ liga });
    el.innerHTML = '';
    if (!matches.length) {
      el.innerHTML = emptyState('No hay partidos para este filtro');
      return;
    }
    matches.forEach(m => el.appendChild(Predictions.createMatchCard(m)));
  } catch {
    el.innerHTML = emptyState('Error al cargar los partidos');
  }
}

/* --------------------------------------------------------
   MIS PREDICCIONES
   -------------------------------------------------------- */
function initPredicciones() {
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
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

async function loadUserStats() {
  try {
    const preds = await API.getUserPredictions();
    const aciertos = preds.filter(p => p.estado === 'acierto').length;
    const puntos   = preds.reduce((a, p) => a + (p.puntos || 0), 0);
    const racha    = calcularRacha(preds);
    const pct      = preds.length ? Math.round(aciertos / preds.length * 100) : 0;

    setText('stat-puntos',   puntos);
    setText('stat-aciertos', aciertos);
    setText('stat-pct',      pct + '%');
    setText('stat-racha',    racha + (racha > 0 ? ' 🔥' : ''));
  } catch (e) { console.error(e); }
}

async function loadPendingPredictions() {
  const el = document.getElementById('predictions-pending');
  if (!el) return;
  try {
    const preds = await API.getUserPredictions({ estado: 'pendiente' });
    el.className = preds.length ? 'pred-list' : '';
    el.innerHTML = preds.length
      ? preds.map(renderPredRow).join('')
      : emptyState('No tenes predicciones pendientes');
  } catch { el.innerHTML = emptyState('Error al cargar'); }
}

async function loadHistoryPredictions() {
  const el = document.getElementById('predictions-history');
  if (!el) return;
  try {
    const preds = await API.getUserPredictions({ estado: 'resuelta' });
    el.className = preds.length ? 'pred-list' : '';
    el.innerHTML = preds.length
      ? preds.map(renderPredRow).join('')
      : emptyState('Todavia no tenes historial');
  } catch { el.innerHTML = emptyState('Error al cargar el historial'); }
}

function renderPredRow(pred) {
  const cls   = pred.estado === 'acierto' ? 'hit' : pred.estado === 'fallo' ? 'miss' : 'pending';
  const label = pred.estado === 'acierto' ? 'Acierto' : pred.estado === 'fallo' ? 'Fallo' : 'Pendiente';
  const pts   = pred.puntos > 0 ? `+${pred.puntos}` : '—';
  const score1 = pred.scoreEquipo1Pred ?? pred.scoreLocalPred ?? '?';
  const score2 = pred.scoreEquipo2Pred ?? pred.scoreVisitantePred ?? '?';
  const equipo1 = pred.equipo1 ?? pred.equipoLocal;
  const equipo2 = pred.equipo2 ?? pred.equipoVisitante;
  const score = `${score1}–${score2}`;

  const rowCls = pred.estado === 'acierto' ? 'is-hit' : pred.estado === 'fallo' ? 'is-miss' : '';
  return `
    <div class="pred-row ${rowCls}">
      <div class="pred-match">
        <div class="pred-match-name">${equipo1} vs ${equipo2}</div>
        <div class="pred-match-meta">${pred.liga} · Mi pred: ${score}</div>
      </div>
      <span class="pred-tag ${cls}">${label}</span>
      <span class="pred-pts ${pred.puntos > 0 ? 'positive' : ''}">${pts}</span>
    </div>
  `;
}

function calcularRacha(preds) {
  let r = 0;
  for (const p of [...preds].reverse()) { if (p.estado === 'acierto') r++; else break; }
  return r;
}

/* --------------------------------------------------------
   CLASIFICACION
   -------------------------------------------------------- */
function initClasificacion() {
  loadLeaderboard();

  document.querySelectorAll('.filter-chip[data-group="periodo"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-group="periodo"]')
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadLeaderboard();
    });
  });
}

async function loadLeaderboard() {
  const podiumEl  = document.getElementById('podium');
  const rankingEl = document.getElementById('ranking-list');
  if (!rankingEl) return;

  const active  = document.querySelector('.filter-chip[data-group="periodo"].active');
  const periodo = active?.dataset.value || 'temporada';

  try {
    const ranking = await API.getLeaderboard({ periodo });

    // Podium top 3
    if (podiumEl) {
      const top = ranking.slice(0, 3);
      // Orden visual: 2º izquierda, 1º centro, 3º derecha
      const order   = [top[1], top[0], top[2]];
      const mClasses = ['medal medal-2', 'medal medal-1', 'medal medal-3'];
      const mNums    = ['2', '1', '3'];
      const classes  = ['podium-item--2', 'podium-item--1', 'podium-item--3'];

      podiumEl.innerHTML = order.map((r, i) => r ? `
        <div class="podium-item ${classes[i]}">
          <span class="${mClasses[i]}">${mNums[i]}</span>
          <div class="podium-avatar">${r.nombre[0].toUpperCase()}</div>
          <div class="podium-name">${r.nombre}</div>
          <div class="podium-pts">${r.puntos} pts</div>
          <div class="podium-bar"></div>
        </div>
      ` : '').join('');
    }

    // Lista 4+
    const rest = ranking.slice(3);
    rankingEl.innerHTML = rest.length
      ? rest.map((r, i) => renderRankRow(r, i + 3)).join('')
      : '';

  } catch {
    if (rankingEl) rankingEl.innerHTML = emptyState('No se pudo cargar el ranking');
  }
}

function renderRankRow(r, i) {
  // Top 3: badge con medalla; el resto: número simple
  const posEl = i === 0 ? `<span class="medal medal-1">1</span>`
              : i === 1 ? `<span class="medal medal-2">2</span>`
              : i === 2 ? `<span class="medal medal-3">3</span>`
              : `<span class="rank-pos">${i + 1}</span>`;
  return `
    <div class="ranking-row">
      ${posEl}
      <div class="rank-avatar">${r.nombre[0].toUpperCase()}</div>
      <div class="rank-info">
        <div class="rank-name">${r.nombre}</div>
        <div class="rank-sub">${r.aciertos ?? 0} aciertos</div>
      </div>
      <div class="rank-right">
        <div class="rank-pts">${r.puntos}</div>
        <span class="rank-pts-label">pts</span>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------
   UTILS
   -------------------------------------------------------- */
function showSkeleton(container, count) {
  container.innerHTML = `
    <div class="skeleton-wrap" style="border-radius:var(--radius-lg);overflow:hidden;border:none;background:transparent">
      ${Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
          <div class="skel" style="width:38%;height:8px;margin-bottom:.75rem;border-radius:4px"></div>
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
            <div class="skel" style="width:38px;height:38px;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1"><div class="skel" style="height:11px;border-radius:4px"></div></div>
            <div class="skel" style="width:58px;height:34px;border-radius:8px;flex-shrink:0"></div>
            <div style="flex:1"><div class="skel" style="height:11px;border-radius:4px"></div></div>
            <div class="skel" style="width:38px;height:38px;border-radius:50%;flex-shrink:0"></div>
          </div>
          <div class="skel" style="height:34px;border-radius:6px"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function emptyState(msg) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">⚽</div>
      <p>${msg}</p>
    </div>
  `;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
