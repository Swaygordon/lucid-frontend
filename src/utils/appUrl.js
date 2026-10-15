// Build absolute links for Supabase auth callbacks on both Vite dev and
// GitHub Pages. Vite's production BASE_URL contains the repository prefix;
// development routes already start at the origin.
export function getAppUrl(route) {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`
  const deploymentBase = import.meta.env.PROD
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : ''

  return `${window.location.origin}${deploymentBase}${normalizedRoute}`
}
