/**
 * mock-data.js
 * Partidos de ejemplo para probar la interfaz sin backend.
 * Se usa como fallback en api.js cuando no hay servidor disponible.
 */

/**
 * Colores y abreviaturas de equipos para generar escudos SVG.
 * bg:     color principal del club
 * stripe: color secundario (opcional → división vertical del escudo)
 * abbr:   abreviatura de 3 letras
 */
const TEAM_COLORS = {
  /* ── Equipos reales ── */
  'Inter de Milán':        { bg: '#0068A8', stripe: '#111111', abbr: 'INT' },
  'Borussia Dortmund':     { bg: '#FDE100',                   abbr: 'BVB' },
  'Manchester United':     { bg: '#DA291C',                   abbr: 'MAN' },
  'Chelsea':               { bg: '#034694',                   abbr: 'CHE' },
  'Real Madrid':           { bg: '#00529F', stripe: '#FEBE10', abbr: 'RMA' },
  'Manchester City':       { bg: '#6CABDD',                   abbr: 'MCI' },
  'Liverpool':             { bg: '#C8102E',                   abbr: 'LIV' },
  'Arsenal':               { bg: '#EF0107',                   abbr: 'ARS' },
  'Barcelona':             { bg: '#004D98', stripe: '#A50044', abbr: 'FCB' },
  'Atlético de Madrid':    { bg: '#CE3524',                   abbr: 'ATM' },
  'Boca Juniors':          { bg: '#003087', stripe: '#C8992C', abbr: 'BOC' },
  'Flamengo':              { bg: '#E82020', stripe: '#111111', abbr: 'FLA' },
  'PSG':                   { bg: '#003370', stripe: '#C5192D', abbr: 'PSG' },
  'Bayern Munich':         { bg: '#DC052D',                   abbr: 'BAY' },
  'Sevilla FC':            { bg: '#D91A21',                   abbr: 'SEV' },
  'Juventus':              { bg: '#1a1a1a',                   abbr: 'JUV' },
  'FC Porto':              { bg: '#003087', stripe: '#C8992C', abbr: 'POR' },
  'Tottenham Hotspur':     { bg: '#132257',                   abbr: 'TOT' },
  'Newcastle United':      { bg: '#1a1a1a',                   abbr: 'NEW' },
  'River Plate':           { bg: '#EE2523',                   abbr: 'RIV' },
  'Palmeiras':             { bg: '#006437',                   abbr: 'PAL' },
  /* ── Equipos ficticios ── */
  'Deportivo Asociación Cultural del Norte':   { bg: '#1B5E20', abbr: 'DCN' },
  'Club Atlético Independiente del Sur':       { bg: '#B71C1C', abbr: 'CIS' },
  'Unión Deportiva Internacional de Valencia': { bg: '#E65100', abbr: 'UDV' },
};

const MockData = (() => {

  const matches = [

    /* ─────────── EN VIVO ─────────── */
    {
      id: 'm1',
      liga: 'Champions League',
      equipoLocal: 'Inter de Milán',
      equipoVisitante: 'Borussia Dortmund',
      estado: 'en-vivo',
      minuto: "67'",
      scoreLocal: 1,
      scoreVisitante: 0,
      fecha: '2026-04-13T21:00:00',
    },
    {
      id: 'm2',
      liga: 'Premier League',
      equipoLocal: 'Manchester United',
      equipoVisitante: 'Chelsea',
      estado: 'en-vivo',
      minuto: "45+2'",
      scoreLocal: 0,
      scoreVisitante: 0,
      fecha: '2026-04-13T19:30:00',
    },
    {
      id: 'm3',
      liga: 'Copa Libertadores',
      equipoLocal: 'Deportivo Asociación Cultural del Norte',
      equipoVisitante: 'Club Atlético Independiente del Sur',
      estado: 'en-vivo',
      minuto: "23'",
      scoreLocal: 1,
      scoreVisitante: 1,
      fecha: '2026-04-13T20:00:00',
    },

    /* ─────────── PRÓXIMOS ─────────── */
    {
      id: 'm4',
      liga: 'Champions League',
      equipoLocal: 'Real Madrid',
      equipoVisitante: 'Manchester City',
      estado: 'proximo',
      fecha: '2026-04-13T21:00:00',
    },
    {
      id: 'm5',
      liga: 'Premier League',
      equipoLocal: 'Liverpool',
      equipoVisitante: 'Arsenal',
      estado: 'proximo',
      fecha: '2026-04-13T19:30:00',
    },
    {
      id: 'm6',
      liga: 'La Liga',
      equipoLocal: 'Barcelona',
      equipoVisitante: 'Atlético de Madrid',
      estado: 'proximo',
      fecha: '2026-04-14T20:00:00',
    },
    {
      id: 'm7',
      liga: 'Copa Libertadores',
      equipoLocal: 'Boca Juniors',
      equipoVisitante: 'Flamengo',
      estado: 'proximo',
      fecha: '2026-04-14T22:00:00',
    },
    {
      id: 'm8',
      liga: 'Champions League',
      equipoLocal: 'PSG',
      equipoVisitante: 'Bayern Munich',
      estado: 'proximo',
      fecha: '2026-04-15T21:00:00',
    },

    /* ─────────── FINALIZADOS ─────────── */
    {
      id: 'm9',
      liga: 'La Liga',
      equipoLocal: 'Unión Deportiva Internacional de Valencia',
      equipoVisitante: 'Sevilla FC',
      estado: 'finalizado',
      scoreLocal: 2,
      scoreVisitante: 1,
      fecha: '2026-04-12T20:00:00',
      // pred 2-1 vs real 2-1 → marcador exacto → +5 pts
      userPred: { scoreLocal: 2, scoreVisitante: 1, estado: 'acierto', puntos: 5 },
    },
    {
      id: 'm10',
      liga: 'Champions League',
      equipoLocal: 'Juventus',
      equipoVisitante: 'FC Porto',
      estado: 'finalizado',
      scoreLocal: 1,
      scoreVisitante: 0,
      fecha: '2026-04-12T21:00:00',
      // pred 2-0 vs real 1-0 → resultado correcto (local) → +3 pts
      userPred: { scoreLocal: 2, scoreVisitante: 0, estado: 'acierto', puntos: 3 },
    },
    {
      id: 'm11',
      liga: 'Premier League',
      equipoLocal: 'Tottenham Hotspur',
      equipoVisitante: 'Newcastle United',
      estado: 'finalizado',
      scoreLocal: 3,
      scoreVisitante: 1,
      fecha: '2026-04-12T17:30:00',
      // pred 2-1 vs real 3-1 → resultado correcto (local) → +3 pts
      userPred: { scoreLocal: 2, scoreVisitante: 1, estado: 'acierto', puntos: 3 },
    },
    {
      id: 'm12',
      liga: 'Copa Libertadores',
      equipoLocal: 'River Plate',
      equipoVisitante: 'Palmeiras',
      estado: 'finalizado',
      scoreLocal: 0,
      scoreVisitante: 2,
      fecha: '2026-04-12T22:00:00',
      // pred 1-0 vs real 0-2 → resultado incorrecto → 0 pts
      userPred: { scoreLocal: 1, scoreVisitante: 0, estado: 'fallo', puntos: 0 },
    },
  ];

  const leaderboard = [
    { id: 'u1', nombre: 'Alejandro M.',     puntos: 142, aciertos: 31 },
    { id: 'u2', nombre: 'Victoria R.',      puntos: 128, aciertos: 27 },
    { id: 'u3', nombre: 'Santiago B.',      puntos: 115, aciertos: 24 },
    { id: 'u4', nombre: 'Lucía Fernández',  puntos: 98,  aciertos: 20 },
    { id: 'u5', nombre: 'Matías C.',        puntos: 87,  aciertos: 18 },
    { id: 'u6', nombre: 'Valentina O.',     puntos: 76,  aciertos: 16 },
    { id: 'u7', nombre: 'Nicolás P.',       puntos: 64,  aciertos: 13 },
  ];

  // Predicciones del usuario (derivadas de partidos finalizados con userPred)
  const userPredictions = matches
    .filter(m => m.userPred)
    .map(m => ({
      matchId: m.id,
      equipoLocal: m.equipoLocal,
      equipoVisitante: m.equipoVisitante,
      liga: m.liga,
      scoreLocalPred: m.userPred.scoreLocal,
      scoreVisitantePred: m.userPred.scoreVisitante,
      estado: m.userPred.estado,
      puntos: m.userPred.puntos,
    }));

  // Mapa de valores de chip → liga exacta (para filtros)
  const ligaMap = {
    champions:    'champions league',
    laliga:       'la liga',
    premier:      'premier league',
    seriea:       'serie a',
    bundesliga:   'bundesliga',
    libertadores: 'copa libertadores',
  };

  function getMatches({ liga, fecha, estado } = {}) {
    let result = [...matches];
    if (liga) {
      const target = ligaMap[liga] || liga.toLowerCase();
      result = result.filter(m => m.liga.toLowerCase() === target);
    }
    if (estado) result = result.filter(m => m.estado === estado);
    return Promise.resolve(result);
  }

  function getLeaderboard({ periodo, limit = 50 } = {}) {
    return Promise.resolve(leaderboard.slice(0, limit));
  }

  function getUserPredictions({ estado } = {}) {
    if (estado === 'resuelta') return Promise.resolve(userPredictions);
    if (estado === 'pendiente') return Promise.resolve([]);
    return Promise.resolve(userPredictions);
  }

  function savePrediction(data) {
    return Promise.resolve({ ok: true, ...data });
  }

  return { getMatches, getLeaderboard, getUserPredictions, savePrediction };
})();
