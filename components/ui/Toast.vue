<template>
  <div
    class="fixed bottom-[50px] right-0 md:right-[50px] z-[9998] w-full md:w-auto px-4 md:px-0"
  >
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-3">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'relative w-full md:w-[400px] rounded-lg shadow-lg p-4 flex items-start gap-3',
          'transform transition-all duration-300 ease-in-out bg-white border-2',
          toastBorderClasses[toast.type],
        ]"
        role="alert"
      >
        <!-- Icon -->
        <div :class="['flex-shrink-0', toastIconColorClasses[toast.type]]">
          <svg
            v-if="toast.type === ResponseType.SUCCESS"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg
            v-else-if="toast.type === ResponseType.ERROR"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <svg
            v-else-if="toast.type === ResponseType.WARNING"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <svg
            v-else-if="toast.type === ResponseType.INFO"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4
            v-if="toast.title"
            class="font-semibold text-sm mb-1 text-gray-900"
          >
            {{ toast.title }}
          </h4>
          <p v-if="toast.description" class="text-sm text-gray-600">
            {{ toast.description }}
          </p>
        </div>

        <!-- Close button -->
        <button
          type="button"
          :class="[
            'flex-shrink-0 ml-2 hover:opacity-70 transition-opacity',
            toastIconColorClasses[toast.type],
          ]"
          aria-label="Close notification"
          @click="handleClose(toast.id)"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUiStore } from '~/stores/uiStore';
import { ResponseType } from '~/models/apiResponse.model';

const uiStore = useUiStore();
const toasts = computed(() => uiStore.toasts);

const toastBorderClasses: Record<ResponseType, string> = {
  [ResponseType.SUCCESS]: 'border-green-200',
  [ResponseType.ERROR]: 'border-red-200',
  [ResponseType.WARNING]: 'border-yellow-200',
  [ResponseType.INFO]: 'border-blue-200',
};

const toastIconColorClasses: Record<ResponseType, string> = {
  [ResponseType.SUCCESS]: 'text-green-500',
  [ResponseType.ERROR]: 'text-red-500',
  [ResponseType.WARNING]: 'text-yellow-500',
  [ResponseType.INFO]: 'text-blue-500',
};

const handleClose = (id: string) => {
  uiStore.removeToast(id);
};
</script>

<style scoped>
/* Toast transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
