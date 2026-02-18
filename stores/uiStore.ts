import { defineStore } from 'pinia';
import { ResponseType } from '~/models/apiResponse.model';

export interface Toast {
  id: string;
  title: string | null;
  description: string | null;
  type: ResponseType;
}

export const useUiStore = defineStore('uiStore', {
  state: () => ({
    isLoading: true,
    toasts: [] as Toast[],
  }),
  actions: {
    start() {
      this.isLoading = true;
    },
    stop() {
      this.isLoading = false;
    },
    showToast(
      title: string | null = null,
      description: string | null = null,
      type: ResponseType = ResponseType.SUCCESS
    ) {
      const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        title,
        description,
        type,
      };
      this.toasts.push(toast);

      // Auto remove toast after 5 seconds
      setTimeout(() => {
        this.removeToast(toast.id);
      }, 5000);
    },
    removeToast(id: string) {
      const index = this.toasts.findIndex(toast => toast.id === id);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    },
  },
});
