/**
 * api.js
 * Capa de acceso a datos. Conecta con el backend cuando está disponible;
 * si no, cae automáticamente en MockData (mock-data.js).
 */

const API = (() => {

  const BASE_URL = 'http://localhost:3000/api';
  const TOKEN_KEY = 'once_metros_token';
  const USER_KEY = 'once_metros_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
  }

  function setSession({ token, usuario }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Error ${res.status}`);
    }
    return res.json();
  }

  function buildQuery(params = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, value);
      }
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  }

  // --- PARTIDOS ---

  async function getMatches({ liga, fecha, estado, competenciaId } = {}) {
    try {
      return await request(`/partidos${buildQuery({ liga, fecha, estado, competenciaId })}`);
    } catch {
      return MockData.getMatches({ liga, fecha, estado });
    }
  }

  async function getMatch(id) {
    try { return await request(`/partidos/${id}`); }
    catch { return null; }
  }

  async function cerrarPartido(id, { golesEquipo1, golesEquipo2 }) {
    return request(`/partidos/${id}/cerrar`, {
      method: 'POST',
      body: JSON.stringify({ golesEquipo1, golesEquipo2 }),
    });
  }

  // --- PREDICCIONES ---

  async function savePrediction({ matchId, scoreEquipo1, scoreEquipo2, scoreLocal, scoreVisitante }) {
    if (!getToken()) throw new Error('Tenes que iniciar sesion para guardar predicciones');

    return request('/predicciones', {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        scoreEquipo1: scoreEquipo1 ?? scoreLocal,
        scoreEquipo2: scoreEquipo2 ?? scoreVisitante,
      }),
    });
  }

  async function updatePrediction(id, { scoreEquipo1, scoreEquipo2 }) {
    return request(`/predicciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ scoreEquipo1, scoreEquipo2 }),
    });
  }

  // --- USUARIOS ---

  async function getUsuario(id) {
    return request(`/usuarios/${id}`);
  }

  async function updateUsuario(id, data) {
    return request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- COMPETENCIAS ---

  async function getCompetencias() {
    return request('/competencias');
  }

  async function getCompetencia(id) {
    return request(`/competencias/${id}`);
  }

  // --- EQUIPOS ---

  async function getEquipos({ tipo, q } = {}) {
    return request(`/equipos${buildQuery({ tipo, q })}`);
  }

  async function getEquipo(id) {
    return request(`/equipos/${id}`);
  }

  // --- TORNEOS DE AMIGOS ---

  async function getTorneosDeAmigos({ mias } = {}) {
    return request(`/torneos${buildQuery({ mias })}`);
  }

  async function getTorneoDeAmigos(id) {
    return request(`/torneos/${id}`);
  }

  async function createTorneoDeAmigos({ nombre, competenciaId }) {
    return request('/torneos', {
      method: 'POST',
      body: JSON.stringify({ nombre, competenciaId }),
    });
  }

  async function unirseATorneoDeAmigos(id) {
    return request(`/torneos/${id}/unirse`, { method: 'POST' });
  }

  async function getTablaTorneoDeAmigos(id) {
    return request(`/torneos/${id}/tabla`);
  }

  async function getMisPrediccionesEnTorneoDeAmigos(id) {
    return request(`/torneos/${id}/mis-predicciones`);
  }

  // --- AUTH ---

  async function register({ username, nombre, email, password }) {
    const session = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, nombre, email, password }),
    });
    setSession(session);
    return session;
  }

  async function login({ identificador, username, email, password }) {
    const session = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador: identificador ?? username ?? email, password }),
    });
    setSession(session);
    return session;
  }

  async function me() {
    const response = await request('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
    return response.usuario;
  }

  function logout() {
    clearSession();
  }

  // --- DEPRECADOS (cae a MockData) ---
  // El backend ya no expone /clasificacion ni /predicciones/me globales:
  // ahora son por TorneoDeAmigos. Estas funciones quedan como compat:
  // tiran 404 y caen al mock para no romper la UI vieja.

  async function getLeaderboard({ periodo, liga, limit = 50 } = {}) {
    try {
      return await request(`/clasificacion${buildQuery({ periodo, liga, limit })}`);
    } catch {
      return MockData.getLeaderboard({ periodo, liga, limit });
    }
  }

  async function getUserPredictions({ estado } = {}) {
    if (!getToken()) return [];
    try {
      return await request(`/predicciones/me${buildQuery({ estado })}`);
    } catch {
      return MockData.getUserPredictions({ estado });
    }
  }

  return {
    cerrarPartido,
    clearSession,
    createTorneoDeAmigos,
    getCompetencia,
    getCompetencias,
    getCurrentUser,
    getEquipo,
    getEquipos,
    getLeaderboard,
    getMatch,
    getMatches,
    getMisPrediccionesEnTorneoDeAmigos,
    getTablaTorneoDeAmigos,
    getToken,
    getTorneoDeAmigos,
    getTorneosDeAmigos,
    getUserPredictions,
    getUsuario,
    login,
    logout,
    me,
    register,
    savePrediction,
    unirseATorneoDeAmigos,
    updatePrediction,
    updateUsuario,
  };
})();
