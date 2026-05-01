import { isLoggedIn, isAdmin } from './session.js';

export function requireAuth(redirectTo = '/login.html') {
  if (!isLoggedIn()) {
    location.replace(redirectTo);
    return false;
  }
  return true;
}

export function requireAdmin(redirectTo = '/') {
  if (!isLoggedIn()) {
    location.replace('/login.html');
    return false;
  }
  if (!isAdmin()) {
    alert('관리자 권한이 필요합니다.');
    location.replace(redirectTo);
    return false;
  }
  return true;
}
