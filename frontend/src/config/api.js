export const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL

  // In production (e.g. deployed on Vercel), ALWAYS use relative URL '' (i.e. /api/...)
  // unless an external HTTPS URL that isn't localhost is explicitly configured
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.trim().replace(/\/$/, '')
    }
    return ''
  }

  // Local development
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '')
  }

  return 'http://localhost:5000'
}

export default getBackendUrl
