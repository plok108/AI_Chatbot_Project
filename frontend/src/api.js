// src/api.js
// 공통 API 베이스 URL과 JWT 토큰 관리 헬퍼.
// 백엔드 주소가 바뀌어도 이 파일만 수정하면 된다.

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = 'access_token';

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// 토큰이 있으면 Authorization 헤더를 추가한 헤더 객체를 반환한다.
export function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}
