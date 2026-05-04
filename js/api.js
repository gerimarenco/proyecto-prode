/**
 * api.js
 * Capa de acceso a datos. Conecta con el backend cuando está disponible;
 * si no, cae automáticamente en MockData (mock-data.js).
 */

const API = (() => {

  const BASE_URL = 'http://localhost:3000/api';

  async function request(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Error ${res.status}`);
    }
    return res.json();
  }

  // --- PARTIDOS ---

  async function getMatches({ liga, fecha, estado } = {}) {
    try {
      const params = new URLSearchParams();
      if (liga)   params.set('liga', liga);
      if (fecha)  params.set('fecha', fecha);
      if (estado) params.set('estado', estado);
      return await request(`/partidos?${params}`);
    } catch {
      return MockData.getMatches({ liga, fecha, estado });
    }
  }

  async function getMatch(id) {
    try { return await request(`/partidos/${id}`); }
    catch { return null; }
  }

  // --- PREDICCIONES ---

  async function savePrediction({ matchId, prediccion, scoreEquipo1, scoreEquipo2, scoreLocal, scoreVisitante }) {
    const body = {
      matchId,
      prediccion,
      scoreEquipo1: scoreEquipo1 ?? scoreLocal,
      scoreEquipo2: scoreEquipo2 ?? scoreVisitante,
    };

    try {
      return await request('/predicciones', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch {
      return MockData.savePrediction(body);
    }
  }

  async function getUserPredictions({ estado } = {}) {
    try {
      const params = new URLSearchParams();
      if (estado) params.set('estado', estado);
      return await request(`/predicciones/me?${params}`);
    } catch {
      return MockData.getUserPredictions({ estado });
    }
  }

  // --- CLASIFICACION ---

  async function getLeaderboard({ periodo, liga, limit = 50 } = {}) {
    try {
      const params = new URLSearchParams({ limit });
      if (periodo) params.set('periodo', periodo);
      if (liga)    params.set('liga', liga);
      return await request(`/clasificacion?${params}`);
    } catch {
      return MockData.getLeaderboard({ periodo, liga, limit });
    }
  }

  // --- AUTH ---

  async function register({ nombre, email, password }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password }),
    });
  }

  async function login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  return { getMatches, getMatch, savePrediction, getUserPredictions, getLeaderboard, register, login };
})();
