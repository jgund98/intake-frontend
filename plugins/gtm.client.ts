type DataLayerEvent = Record<string, unknown>;

import type { Router } from 'vue-router';
import { useRouter, useRuntimeConfig } from '#imports';

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

type GtmConfig = {
  id: string;
  auth?: string;
  preview?: string;
  cookiesWin?: string;
};

const buildGtmUrl = ({ id, auth, preview, cookiesWin }: GtmConfig) => {
  const qs = new URLSearchParams({ id });

  if (auth && preview && cookiesWin) {
    qs.set('gtm_auth', auth);
    qs.set('gtm_preview', preview);
    qs.set('gtm_cookies_win', cookiesWin);
  }

  return `https://www.googletagmanager.com/gtm.js?${qs.toString()}`;
};

const ensureScriptInjected = (config: GtmConfig) => {
  if (document.getElementById('gtm-script')) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.id = 'gtm-script';
  script.src = buildGtmUrl(config);
  document.head.appendChild(script);
};

const isBrowser = () => typeof window !== 'undefined';

const setupPageviewListener = (router: Router, push: (event: DataLayerEvent) => void) => {
  router.afterEach(to => {
    push({
      event: 'page_view',
      page: {
        path: to.fullPath,
        name: to.name ?? undefined,
        title: document.title,
      },
    });
  });
};

export default defineNuxtPlugin(nuxtApp => {
  if (process.server || !isBrowser()) {
    return;
  }

  const {
    public: { gtmId, gtmAuth, gtmPreview, gtmCookiesWin },
  } = useRuntimeConfig();

  if (!gtmId) {
    return;
  }

  const dataLayer = (window.dataLayer = window.dataLayer || []);
  const push = (event: DataLayerEvent) => {
    dataLayer.push(event);
  };

  push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  ensureScriptInjected({
    id: gtmId,
    auth: gtmAuth,
    preview: gtmPreview,
    cookiesWin: gtmCookiesWin,
  });

  const router = useRouter();
  setupPageviewListener(router, push);

  nuxtApp.hook('app:mounted', () => {
    push({
      event: 'page_view',
      page: {
        path: window.location.pathname + window.location.search,
        name: router.currentRoute.value.name ?? undefined,
        title: document.title,
      },
    });
  });

  nuxtApp.provide('gtm', {
    pushEvent: push,
  });
});

declare module '#app' {
  interface NuxtApp {
    $gtm: {
      pushEvent: (event: DataLayerEvent) => void;
    };
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $gtm: {
      pushEvent: (event: DataLayerEvent) => void;
    };
  }
}