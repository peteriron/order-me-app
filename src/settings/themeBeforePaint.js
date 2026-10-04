// Apply a saved light theme before first paint, so it doesn't flash dark while the app loads. Inlined into
// index.html's <head> by vite.config.ts (and allowed by its hash in the Content-Security-Policy).
try {
  var theme = JSON.parse(localStorage.getItem('order-me') || '{}').settings?.theme
  if (theme === 'system') theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  if (theme === 'light') document.documentElement.dataset.theme = 'light'
} catch {}
