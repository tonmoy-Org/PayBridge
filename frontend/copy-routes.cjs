const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, 'dist')
const indexHtml = path.join(distDir, 'index.html')

if (fs.existsSync(indexHtml)) {
  const routes = ['success', 'login', 'tracker', 'error']
  routes.forEach((route) => {
    // 1. Create dist/route.html (e.g. dist/success.html)
    fs.copyFileSync(indexHtml, path.join(distDir, `${route}.html`))

    // 2. Create dist/route/index.html (e.g. dist/success/index.html)
    const routeDir = path.join(distDir, route)
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true })
    }
    fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'))
  })
  console.log('Generated static SPA route fallbacks in dist: success, login, tracker, error')
}
