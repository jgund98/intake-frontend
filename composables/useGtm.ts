import { useNuxtApp } from '#imports';

type DataLayerEvent = Record<string, unknown>;

type GtmClient = {
  pushEvent: (event: DataLayerEvent) => void;
};

const noopClient: GtmClient = {
  pushEvent: () => {
    /* noop when GTM not configured */
  },
};

export const useGtm = (): GtmClient => {
  const nuxtApp = useNuxtApp();
  return nuxtApp.$gtm || noopClient;
};