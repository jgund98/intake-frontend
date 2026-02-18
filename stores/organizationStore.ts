import { defineStore } from 'pinia';
import type { OrgVariables } from '~/models/apiResponse.model';

export const useOrganizationStore = defineStore('organizationStore', {
  state: () => ({
    orgData: null as OrgVariables | null,
    category: null as string | null,
    preselectedProductId: null as string | null,
  }),

  getters: {
    hasOrgData: state => state.orgData !== null,
    hasCategory: state => state.category !== null,
    hasPreselectedProduct: state => state.preselectedProductId !== null,
  },

  actions: {
    setOrgData(data: OrgVariables) {
      this.orgData = data;
    },

    setCategory(category: string) {
      this.category = category;
    },

    setPreselectedProductId(productId: string | null) {
      this.preselectedProductId = productId;
      if (productId) {
        localStorage.setItem('preselectedProductId', productId);
      } else {
        localStorage.removeItem('preselectedProductId');
      }
    },

    initPreselectedProductFromStorage() {
      const stored = localStorage.getItem('preselectedProductId');
      if (stored) {
        this.preselectedProductId = stored;
      }
    },

    clearPreselectedProduct() {
      this.preselectedProductId = null;
      localStorage.removeItem('preselectedProductId');
    },

    clearAll() {
      this.orgData = null;
      this.category = null;
      this.preselectedProductId = null;
      localStorage.removeItem('orgData');
      localStorage.removeItem('category');
      localStorage.removeItem('preselectedProductId');
    },
  },
});
