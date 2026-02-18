<script setup lang="ts">
interface Props {
  bundleId: string;
  bundleName: string;
  totalPrice: number;
  pricePerMonth: number;
  savePercentage?: number;
  saveAmount?: number;
  isMaxSavings?: boolean;
  isSelected: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [bundleId: string];
}>();

const handleSelect = (bundleId: string) => {
  emit('select', bundleId);
};
</script>

<template>
  <div
    class="relative rounded-[14px] cursor-pointer transition-all duration-200"
    :class="
      isSelected
        ? 'border-2 border-primary shadow-lg bg-primary-light-4'
        : 'border-2 border-gray-200 hover:border-gray-300 bg-white'
    "
    @click="handleSelect(bundleId)"
  >
    <!-- Max Saving Badge (positioned at top-left, overlapping border) -->
    <div v-if="isMaxSavings" class="absolute left-3 -top-3 z-10">
      <div
        class="bg-accent-tag rounded-sm px-2.5 py-1 flex items-center justify-center shadow-sm"
      >
        <span
          class="font-lora font-semibold caption text-white whitespace-nowrap"
        >
          Max Saving
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex items-center justify-between px-5 py-6">
      <!-- Left Section: Radio + Name + Save Badge -->
      <div class="flex items-center gap-3">
        <!-- Radio Button -->
        <div
          class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0"
          :class="
            isSelected
              ? 'border-primary bg-primary'
              : 'border-gray-400 bg-white'
          "
        >
          <div v-if="isSelected" class="w-2 h-2 rounded-full bg-white" />
        </div>

        <!-- Bundle Name -->
        <p class="font-lora font-semibold body1 text-gray-1 whitespace-nowrap">
          {{ bundleName }}
        </p>

        <!-- Save Badge (with dollar amount) -->
        <div
          v-if="saveAmount && saveAmount > 0"
          class="rounded-full border border-accent-tag px-2 py-0.5 flex items-center justify-center"
        >
          <p class="font-lora caption text-accent-tag whitespace-nowrap">
            <span class="font-semibold">Save </span>
            <span class="font-normal">${{ saveAmount }}</span>
          </p>
        </div>
      </div>

      <!-- Right Section: Pricing -->
      <div class="flex flex-col items-end">
        <p class="font-lora font-bold text-xl text-gray-1">${{ totalPrice }}</p>
        <p class="font-lora font-medium text-sm text-gray-11">
          ${{ pricePerMonth }}/mo
        </p>
      </div>
    </div>
  </div>
</template>
