const KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  userId: 'user_id',
  isAdmin: 'is_admin',
  nickname: 'user_nickname',
};

const AUTH_CHANGED = 'auth:changed';

function emitChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED));
}

export function getAccessToken() {
  return localStorage.getItem(KEYS.access);
}

export function getRefreshToken() {
  return localStorage.getItem(KEYS.refresh);
}

export function setAccessToken(token) {
  localStorage.setItem(KEYS.access, token);
}

export function getUserId() {
  return localStorage.getItem(KEYS.userId);
}

export function getNickname() {
  return localStorage.getItem(KEYS.nickname);
}

export function isLoggedIn() {
  return !!getAccessToken();
}

export function isAdmin() {
  return localStorage.getItem(KEYS.isAdmin) === '1';
}

export function setSession({ accessToken, refreshToken, userId }) {
  localStorage.setItem(KEYS.access, accessToken);
  localStorage.setItem(KEYS.refresh, refreshToken);
  localStorage.setItem(KEYS.userId, userId);
  emitChanged();
}

export function setProfile({ nickname, isAdmin: admin }) {
  if (nickname != null) localStorage.setItem(KEYS.nickname, nickname);
  if (admin != null) localStorage.setItem(KEYS.isAdmin, admin ? '1' : '0');
  emitChanged();
}

export function clearSession() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  emitChanged();
}

export function onAuthChanged(handler) {
  window.addEventListener(AUTH_CHANGED, handler);
  return () => window.removeEventListener(AUTH_CHANGED, handler);
}
