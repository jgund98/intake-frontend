<script setup lang="ts">
// components
import IconCard from '../cards/IconCard.vue';

interface Card {
  icon: string;
  label: string;
  value: string;
}

interface Props {
  options?: Card[];
  fieldName: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['handleSelect']);

const modelValue = defineModel<Record<string, string>>({ default: {} });

const handleSelect = (index: number, value: string) => {
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: value,
  };
  emit('handleSelect');
};
</script>
<template>
  <div
    v-if="options && options.length > 0"
    class="grid grid-cols-1 md:grid-cols-2 gap-3 mx-auto"
    v-bind="$attrs"
  >
    <template v-for="(card, index) in options" :key="index">
      <IconCard
        :icon="card.icon"
        :text="card.label"
        :is-selected="modelValue[fieldName] === card.value"
        @click="handleSelect(index, card.value)"
      />
    </template>
  </div>
</template>
