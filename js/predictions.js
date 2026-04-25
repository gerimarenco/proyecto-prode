/**
 * predictions.js
 * Renderizado de tarjetas de partido según estado:
 *   - proximo:    spinners de marcador + botón guardar
 *   - en-vivo:    marcador actual con minuto (solo lectura)
 *   - finalizado: resultado final + feedback de predicción
 */

const Predictions = (() => {

  // matchId → { local: number, visitante: number, saved: boolean }
  const state = new Map();

  // ─── SVG paths del escudo ─────────────────────────────────────────
  const SHIELD   = 'M3,2 H33 L33,26 Q33,37 18,39 Q3,37 3,26 Z';
  const SHIELD_R = 'M18,2 H33 L33,26 Q33,37 18,39 Z'; // mitad derecha (para stripe)

  /**
   * Genera un escudo SVG para el equipo dado.
   * Usa TEAM_COLORS si está disponible; si no, genera un color
   * determinista a partir del nombre.
   */
  function teamCrest(teamName) {
    const data = (typeof TEAM_COLORS !== 'undefined') && TEAM_COLORS[teamName];

    if (!data) {
      // Fallback: color determinista + iniciales
      const hue  = nameToHue(teamName);
      const abbr = abbrev(teamName);
      return svgShield(`hsl(${hue},52%,28%)`, null, abbr);
    }

    return svgShield(data.bg, data.stripe || null, data.abbr);
  }

  /**
   * Construye el HTML del escudo SVG.
   */
  function svgShield(bg, stripe, abbr) {
    // Luminancia del fondo (solo válida para hex)
    let fg = '#fff';
    let fgStroke = 'rgba(0,0,0,0.35)';
    if (bg.startsWith('#') && bg.length === 7) {
      const r = parseInt(bg.slice(1,3), 16);
      const g = parseInt(bg.slice(3,5), 16);
      const b = parseInt(bg.slice(5,7), 16);
      const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
      if (lum > 0.58) { fg = '#1a1a1a'; fgStroke = 'rgba(255,255,255,0.35)'; }
    }
    // Con stripe siempre blanco (mezcla de colores)
    if (stripe) { fg = '#fff'; fgStroke = 'rgba(0,0,0,0.4)'; }

    const stripeEl = stripe
      ? `<path d="${SHIELD_R}" fill="${stripe}" opacity="0.88"/>`
      : '';

    return (
      `<svg class="team__badge" viewBox="0 0 36 41" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<path d="${SHIELD}" fill="${bg}"/>` +
      stripeEl +
      `<path d="${SHIELD}" fill="none" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>` +
      `<text x="18" y="20" text-anchor="middle" dominant-baseline="central"` +
      ` fill="${fg}" stroke="${fgStroke}" stroke-width="0.7" paint-order="stroke"` +
      ` font-size="8.5" font-weight="900"` +
      ` font-family="Inter,system-ui,sans-serif" letter-spacing="-0.3">${abbr}</text>` +
      `</svg>`
    );
  }

  /** Hash del nombre → tono HSL (0–359) */
  function nameToHue(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = ((h << 5) - h + name.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 360;
  }

  /** Iniciales del equipo (máx 3 chars) — solo para fallback */
  function abbrev(name) {
    return name.split(' ')
      .filter(w => w.length > 1)
      .map(w => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || name.slice(0, 3).toUpperCase();
  }

  // ─── Dispatcher principal ─────────────────────────────────────────
  function createMatchCard(match) {
    if (match.estado === 'en-vivo')    return createLiveCard(match);
    if (match.estado === 'finalizado') return createFinishedCard(match);
    return createUpcomingCard(match);
  }

  // ─── PARTIDO PRÓXIMO ──────────────────────────────────────────────
  function createUpcomingCard(match) {
    const card = document.createElement('div');
    card.classList.add('match-card');
    card.dataset.matchId = match.id;

    const fecha = new Date(match.fecha).toLocaleString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });

    card.innerHTML = `
      <div class="match-card__meta">
        <span class="badge badge-league">${match.liga}</span>
        <span class="badge badge-soon">Próximo</span>
        <span class="match-card__time">${fecha}</span>
      </div>

      <div class="match-card__body">
        <div class="team">
          ${teamCrest(match.equipoLocal)}
          <div class="team__name">${match.equipoLocal}</div>
        </div>

        <div class="score-input">
          <div class="score-spinner" data-side="local">
            <button class="spin-btn spin-inc" aria-label="Mas goles local">+</button>
            <span class="spin-value" aria-live="polite">0</span>
            <button class="spin-btn spin-dec" aria-label="Menos goles local">−</button>
          </div>
          <div class="score-sep">:</div>
          <div class="score-spinner" data-side="visitante">
            <button class="spin-btn spin-inc" aria-label="Mas goles visitante">+</button>
            <span class="spin-value" aria-live="polite">0</span>
            <button class="spin-btn spin-dec" aria-label="Menos goles visitante">−</button>
          </div>
        </div>

        <div class="team">
          ${teamCrest(match.equipoVisitante)}
          <div class="team__name">${match.equipoVisitante}</div>
        </div>
      </div>

      <button class="btn-save" aria-label="Guardar prediccion para ${match.equipoLocal} vs ${match.equipoVisitante}">
        Guardar prediccion
      </button>
    `;

    state.set(match.id, { local: 0, visitante: 0, saved: false });

    card.querySelectorAll('.score-spinner').forEach(spinner => {
      const side  = spinner.dataset.side;
      const valEl = spinner.querySelector('.spin-value');

      spinner.querySelector('.spin-inc').addEventListener('click', () => {
        const s = state.get(match.id);
        if (s[side] < 20) { s[side]++; animateValue(valEl, s[side]); markDirty(card); }
      });

      spinner.querySelector('.spin-dec').addEventListener('click', () => {
        const s = state.get(match.id);
        if (s[side] > 0) { s[side]--; animateValue(valEl, s[side]); markDirty(card); }
      });
    });

    card.querySelector('.btn-save').addEventListener('click', () => onSave(card, match.id));
    return card;
  }

  // ─── PARTIDO EN VIVO ──────────────────────────────────────────────
  function createLiveCard(match) {
    const card = document.createElement('div');
    card.classList.add('match-card', 'is-live');
    card.dataset.matchId = match.id;

    card.innerHTML = `
      <div class="match-card__meta">
        <span class="badge badge-league">${match.liga}</span>
        <span class="badge badge-live">En Vivo</span>
      </div>

      <div class="match-card__body">
        <div class="team">
          ${teamCrest(match.equipoLocal)}
          <div class="team__name">${match.equipoLocal}</div>
        </div>

        <div class="match-score">
          <div class="match-score__nums">
            <span class="match-score__num">${match.scoreLocal}</span>
            <span class="match-score__sep">:</span>
            <span class="match-score__num">${match.scoreVisitante}</span>
          </div>
          <span class="match-score__minute">${match.minuto}</span>
        </div>

        <div class="team">
          ${teamCrest(match.equipoVisitante)}
          <div class="team__name">${match.equipoVisitante}</div>
        </div>
      </div>
    `;

    return card;
  }

  // ─── PARTIDO FINALIZADO ───────────────────────────────────────────
  function createFinishedCard(match) {
    const card = document.createElement('div');
    card.classList.add('match-card', 'is-done');
    card.dataset.matchId = match.id;

    const fecha = new Date(match.fecha).toLocaleString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short',
    });

    const pred = match.userPred;
    let feedbackHtml = '';

    if (pred) {
      const isExact    = pred.puntos === 5;
      const badgeCls   = isExact ? 'exact' : pred.estado === 'acierto' ? 'hit' : 'miss';
      const badgeLabel = isExact ? 'Exacto' : pred.estado === 'acierto' ? 'Acierto' : 'Fallo';
      const ptsLabel   = pred.puntos > 0 ? `+${pred.puntos} pts` : '—';

      feedbackHtml = `
        <div class="match-feedback ${badgeCls}">
          <span class="match-feedback__label">Tu pred:</span>
          <span class="match-feedback__score">${pred.scoreLocal}–${pred.scoreVisitante}</span>
          <span class="match-feedback__badge ${badgeCls}">${badgeLabel}</span>
          <span class="match-feedback__pts ${pred.puntos > 0 ? 'positive' : ''}">${ptsLabel}</span>
        </div>
      `;

      if (isExact) card.classList.add('is-exact');
      else if (pred.estado === 'acierto') card.classList.add('is-hit');
      else card.classList.add('is-miss');
    }

    card.innerHTML = `
      <div class="match-card__meta">
        <span class="badge badge-league">${match.liga}</span>
        <span class="badge badge-done">Finalizado</span>
        <span class="match-card__time">${fecha}</span>
      </div>

      <div class="match-card__body">
        <div class="team">
          ${teamCrest(match.equipoLocal)}
          <div class="team__name">${match.equipoLocal}</div>
        </div>

        <div class="match-score">
          <div class="match-score__nums">
            <span class="match-score__num">${match.scoreLocal}</span>
            <span class="match-score__sep">–</span>
            <span class="match-score__num">${match.scoreVisitante}</span>
          </div>
        </div>

        <div class="team">
          ${teamCrest(match.equipoVisitante)}
          <div class="team__name">${match.equipoVisitante}</div>
        </div>
      </div>

      ${feedbackHtml}
    `;

    return card;
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  function animateValue(el, val) {
    el.textContent = val;
    el.classList.remove('changed');
    void el.offsetWidth;
    el.classList.add('changed');
  }

  function markDirty(card) {
    card.classList.remove('pred-saved');
    const btn = card.querySelector('.btn-save');
    if (btn) btn.textContent = 'Guardar prediccion';
  }

  async function onSave(card, matchId) {
    const s   = state.get(matchId);
    const btn = card.querySelector('.btn-save');

    btn.disabled    = true;
    btn.textContent = 'Guardando…';

    const prediccion = s.local > s.visitante ? 'local'
                     : s.local < s.visitante ? 'visitante'
                     : 'empate';

    try {
      await API.savePrediction({ matchId, scoreLocal: s.local, scoreVisitante: s.visitante, prediccion });
    } catch (err) {
      console.warn('API no disponible, guardado localmente:', err.message);
    } finally {
      s.saved = true;
      card.classList.add('pred-saved', 'just-saved');
      btn.disabled    = false;
      btn.textContent = '✓ Guardado';
      setTimeout(() => card.classList.remove('just-saved'), 500);
    }
  }

  /**
   * Calcula puntos de una predicción.
   * +5 marcador exacto · +3 resultado correcto · 0 fallo
   */
  function calcularPuntos({ scoreLocalPred, scoreVisitantePred, scoreLocalReal, scoreVisitanteReal }) {
    const predRes = scoreLocalPred > scoreVisitantePred ? 'local'
                  : scoreLocalPred < scoreVisitantePred ? 'visitante' : 'empate';
    const realRes = scoreLocalReal > scoreVisitanteReal ? 'local'
                  : scoreLocalReal < scoreVisitanteReal ? 'visitante' : 'empate';
    if (predRes !== realRes) return 0;
    return (scoreLocalPred === scoreLocalReal && scoreVisitantePred === scoreVisitanteReal) ? 5 : 3;
  }

  return { createMatchCard, calcularPuntos };
})();
