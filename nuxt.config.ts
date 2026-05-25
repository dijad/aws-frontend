// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-10-01',
  devtools: { enabled: true },
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    'nuxt-tiptap-editor',
  ],

  css: ['~/assets/css/main.css'],

  tiptap: {
    prefix: 'Tiptap',
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    langDir: 'locales',
    locales: [{ code: 'en', name: 'English', file: 'en.json' }],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001/api',
      wsBase: process.env.NUXT_PUBLIC_WS_BASE ?? 'http://localhost:3001',
      authDisabled:
        process.env.NUXT_PUBLIC_AUTH_DISABLED === 'true' ||
        process.env.NUXT_PUBLIC_AUTH_DISABLED === '1',
    },
  },

  app: {
    head: {
      title: 'AWS Workspace',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('aws-theme');document.documentElement.setAttribute('data-theme',t==='dark'||t==='light'?t:'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          type: 'text/javascript',
          tagPosition: 'head',
        },
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
  },
});
