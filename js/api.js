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
    if (!getToken()) throw new Error('Tenes que iniciar sesion para guardar predicciones');

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
    } catch (error) {
      throw error;
    }
  }

  async function getUserPredictions({ estado } = {}) {
    if (!getToken()) return [];

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

  return {
    clearSession,
    getCurrentUser,
    getLeaderboard,
    getMatch,
    getMatches,
    getToken,
    getUserPredictions,
    login,
    logout,
    me,
    register,
    savePrediction,
  };
})();
