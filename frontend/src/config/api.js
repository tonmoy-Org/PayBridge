export const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '')
  }
  // In production (e.g., deployed on Vercel), default to relative path so it calls same-origin /api
  if (import.meta.env.PROD) {
    return ''
  }
  // Local development default
  return 'http://localhost:5000'
}

export default getBackendUrl
