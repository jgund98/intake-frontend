<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  iconColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Are you sure?',
  message: 'This action cannot be undone.',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  iconColor: 'bg-primary',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const isOpen = ref(props.modelValue);

watch(
  () => props.modelValue,
  newValue => {
    isOpen.value = newValue;
  }
);

const closeModal = () => {
  isOpen.value = false;
  emit('update:modelValue', false);
  emit('cancel');
};

const handleConfirm = () => {
  isOpen.value = false;
  emit('update:modelValue', false);
  emit('confirm');
};

const handleCancel = () => {
  closeModal();
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        @click.self="closeModal"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="relative bg-white rounded-3xl shadow-2xl max-w-[600px] w-full p-[34px]"
          >
            <!-- Close Button -->
            <button
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              @click="closeModal"
            >
              <NuxtImg
                src="/icons/close.svg"
                alt="Close"
                class="w-4 h-4"
                loading="eager"
              />
            </button>

            <!-- Icon -->
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              :class="iconColor"
            >
              <svg
                class="w-8 h-8"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- Title -->
            <h2 class="text-2xl font-bold text-gray-900 mb-3">
              {{ title }}
            </h2>

            <!-- Message -->
            <p class="text-base text-gray-600 mb-8 leading-relaxed">
              {{ message }}
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Cancel Button -->
              <button
                class="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>

              <!-- Confirm Button -->
              <button
                class="flex-1 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
