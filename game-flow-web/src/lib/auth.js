import { request } from './api.js'

const TOKEN_STORAGE_KEY = 'cv_auth_token'
const USER_STORAGE_KEY = 'cv_auth_user'

function parseJson(value) {
  try { return value ? JSON.parse(value) : null } catch { return null }
}

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
export const getStoredUser = () => parseJson(localStorage.getItem(USER_STORAGE_KEY))
export const persistAuthSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}
export const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export const signIn = (input) => request('/auth/signin', { method: 'POST', body: input })
export const signUp = (input) => request('/auth/signup', { method: 'POST', body: input })
export const fetchCurrentUser = (token) => request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
