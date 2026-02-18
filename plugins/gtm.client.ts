export default defineNuxtPlugin(() => {
  const { public: { gtmId } } = useRuntimeConfig()
  if (!gtmId) return

  // Prevent double-injection
  if (document.getElementById('gtm-script')) return

  // dataLayer bootstrap
  ;(window as any).dataLayer = (window as any).dataLayer || []
  ;(window as any).dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  // Main GTM script
  const s = document.createElement('script')
  s.id = 'gtm-script'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  document.head.appendChild(s)

  // Optional noscript iframe (good practice)
  const ns = document.createElement('noscript')
  ns.innerHTML = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
  `
  document.body.prepend(ns)
})