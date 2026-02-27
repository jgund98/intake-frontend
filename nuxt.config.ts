// nuxt.config.ts
import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';

// Automatically use the domain from environment or fall back to localhost
const currentHost = process.env.NUXT_PUBLIC_SITE_DOMAIN || 'localhost';
const projectName = process.env.NUXT_PROJECT_NAME;
const projectDomain = process.env.NUXT_PROJECT_DOMAIN;

export default defineNuxtConfig({
  compatibilityDate: '2025-08-29',

  nitro: {
    awsAmplify: {
      imageSettings: {
        dangerouslyAllowSVG: true, // Enable if SVG optimization is required
      },
    },
    minify: true,
    routeRules: {
      '/_nuxt/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      '/images/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      '/icons/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
    },
  },

  modules: ['@nuxt/image', '@pinia/nuxt', 'nuxt-swiper'],
  css: ['~/assets/css/main.css'],
  ssr: true,

  // Automatically trust images from the current host and localhost
  image: {
    domains: [currentHost, '127.0.0.1'],
  },

  runtimeConfig: {
    // Private runtime variables (server-side only)
    graphqlApiUrl: process.env.NUXT_PUBLIC_GRAPHQL_API_URL,
    linkName: process.env.NUXT_PUBLIC_GRAPHQL_LINK_NAME,
    care360Token: process.env.NUXT_PUBLIC_CARE360_TOKEN,

    // SMTP runtime variables
    hostName: process.env.SMTP_HOST,
    portName: process.env.SMTP_PORT,
    userId: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,

    // AWS S3 Configuration
    awsRegion: process.env.NUXT_AWS_REGION,
    awsAccessKeyId: process.env.NUXT_AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.NUXT_AWS_SECRET_ACCESS_KEY,
    awsS3BucketName: process.env.NUXT_AWS_S3_BUCKET_NAME,

    // Slack Notifications (server-side only)
    slackWebhookUrl: process.env.NUXT_SLACK_WEBHOOK_URL,

    public: {
      graphqlApiUrl: process.env.NUXT_PUBLIC_GRAPHQL_API_URL,
      care360Token: process.env.NUXT_PUBLIC_CARE360_TOKEN,
      linkName: process.env.NUXT_PUBLIC_GRAPHQL_LINK_NAME,

      nmiCollectJSKey: process.env.NUXT_PUBLIC_NMI_COLLECTJS_KEY,

      gtmId: process.env.NUXT_PUBLIC_GTM_ID,
      gtmPreview: process.env.NUXT_PUBLIC_GTM_PREVIEW,
      gtmCookiesWin: process.env.NUXT_PUBLIC_GTM_COOKIES_WIN,

      siteDomain: currentHost,

      originalDomain: process.env.NUXT_PROJECT_DOMAIN,
      projectName: process.env.NUXT_PROJECT_NAME,
      projectLogoUrl: process.env.NUXT_PROJECT_LOGO_URL,
      defaultCategory:
        process.env.NUXT_PUBLIC_DEFAULT_CATEGORY || 'Weight Loss',

      privacyPolicy: process.env.NUXT_PUBLIC_PRIVACY_POLICY,
    },
  },

  vite: {
    plugins: [tailwindcss(), svgLoader()],
    build: {
      cssCodeSplit: true, // Split CSS for better loading
      rollupOptions: {
        output: {
          manualChunks: {
            swiper: ['swiper/vue', 'swiper'],
          },
        },
      },
    },
  },

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      // Page title shown in browser tabs and search results
      title: projectName,

      // HTML language attribute for accessibility & SEO
      htmlAttrs: { lang: 'en' },

      meta: [
        // Character encoding for the document (UTF-8 supports all languages)
        { charset: 'utf-8' },

        // Responsive viewport settings for mobile devices
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },

        // SEO meta description — appears in Google search snippets
        {
          name: 'description',
          content: `${projectName} — personalized healthcare, simplified. Empowering patients with technology-driven care.`,
        },

        // Defines browser theme color (mobile address bar color, PWA splash, etc.)
        // Glowella Wellness - Primary Navy
        { name: 'theme-color', content: '#1A2C40' },

        // --- Open Graph (OG) meta tags for social media previews ---

        // Title shown when shared on social media (Facebook, LinkedIn, Slack, etc.)
        { property: 'og:title', content: projectName },

        // Description shown in social link previews
        {
          property: 'og:description',
          content: `Personalized healthcare powered by ${projectName} technology.`,
        },

        // Defines the OG object type (website, article, product, etc.)
        { property: 'og:type', content: 'website' },

        // Canonical page URL used for social sharing and SEO
        { property: 'og:url', content: `https://${projectDomain}` },

        // Default image thumbnail used in link previews
        { property: 'og:image', content: '/og-image.jpg' },
      ],

      link: [
        // --- Favicon (browser tab icon) ---
        // PNG format recommended for better quality across devices
        { rel: 'icon', type: 'image/ico', href: '/favicon.ico' },

        // --- Font performance optimizations ---
        // Preconnect to Google Fonts API domain (saves DNS + SSL handshake time)
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },

        // Preconnect to Google Fonts static content domain (font files)
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },

        // Load Domine (400–800) and Lora (200–800) font families from Google Fonts
        // "display=swap" ensures text is visible during font load (prevents invisible text flash)
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Domine:wght@400;700;800&family=Lora:wght@200;300;400;500;600;700;800&display=swap',
        },

        // --- Manifest for Progressive Web App (PWA) configuration ---
        // Enables installation prompts, icons, theme colors, etc.
        // { rel: 'manifest', href: '/manifest.json' },
      ],
    },
  },
});
