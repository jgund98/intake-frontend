<script setup lang="ts">
import { ref, watch, computed } from 'vue';

interface Props {
  modelValue: boolean;
  saveAmount?: number;
  sixMonthBundleName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  saveAmount: 0,
  sixMonthBundleName: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  keepSixMonth: [];
  continueWithSelected: [];
}>();

const isOpen = ref(props.modelValue);

watch(
  () => props.modelValue,
  newValue => {
    isOpen.value = newValue;
  }
);

const formattedSaveAmount = computed(() => {
  return props.saveAmount > 0 ? `$${props.saveAmount.toFixed(0)}` : '';
});

const benefits = computed(() => {
  const list = [
    {
      key: 'lock_price',
      text: "Lock in today's price - protected from future increases",
    },
  ];

  if (props.saveAmount > 0) {
    list.push({
      key: 'save_amount',
      text: `Save ${formattedSaveAmount.value} compared to monthly`,
    });
  }

  list.push({
    key: 'no_reorder',
    text: 'No need to reorder every month - convenient delivery',
  });

  return list;
});

const closeModal = () => {
  isOpen.value = false;
  emit('update:modelValue', false);
};

const handleKeepSixMonth = () => {
  isOpen.value = false;
  emit('update:modelValue', false);
  emit('keepSixMonth');
};

const handleContinueWithSelected = () => {
  isOpen.value = false;
  emit('update:modelValue', false);
  emit('continueWithSelected');
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
            class="relative bg-white rounded-3xl shadow-2xl max-w-[500px] w-full p-6 sm:p-8"
          >
            <!-- Close Button -->
            <button
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              @click="closeModal"
            >
              <NuxtImg
                src="/icons/close.svg"
                alt="close icon"
                class="w-4 h-4"
                loading="eager"
              />
            </button>

            <!-- Shield Icon -->
            <div
              class="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-primary"
            >
              <NuxtImg
                src="/icons/shield.svg"
                alt="Shield"
                class="w-7 h-7 icon-white"
                loading="eager"
              />
            </div>

            <!-- Title -->
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Wait! You're About to Miss Out
            </h2>

            <!-- Subtitle -->
            <p class="text-sm text-gray-600 mb-4">
              With the 6-Month Plan, you get:
            </p>

            <!-- Benefits List -->
            <div class="space-y-3 mb-6">
              <div
                v-for="benefit in benefits"
                :key="benefit.key"
                class="flex items-start gap-3"
              >
                <div class="flex-shrink-0 mt-0.5">
                  <NuxtImg
                    src="/icons/check-primary.svg"
                    alt="Check"
                    class="w-5 h-5 icon-primary"
                    loading="eager"
                  />
                </div>
                <span class="text-sm text-gray-700">
                  {{ benefit.text }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-3">
              <!-- Keep 6-Month Button (Primary) -->
              <button
                class="w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
                @click="handleKeepSixMonth"
              >
                Keep 6-Month Plan
              </button>

              <!-- Continue with Selected Button (Secondary) -->
              <button
                class="w-full px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                @click="handleContinueWithSelected"
              >
                Continue with Monthly
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
