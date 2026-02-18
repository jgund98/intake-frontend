<script setup lang="ts">
// Components
import BooleanFieldCard from '~/components/cards/BooleanFieldCard.vue';

interface BooleanOption {
  icon: string;
  label: string;
  value: string;
}

interface Props {
  options?: BooleanOption[];
  fieldName: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['handleSelect']);

// defineModel for v-model binding
const modelValue = defineModel<Record<string, string>>({ default: {} });

const handleSelect = (value: string) => {
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
    class="flex flex-wrap gap-4 w-full items-stretch"
    v-bind="$attrs"
  >
    <div
      v-for="(option, index) in options"
      :key="index"
      class="flex-1 sm:min-w-[160px] flex"
      @click="handleSelect(option.value)"
    >
      <BooleanFieldCard
        :icon="option.icon"
        :text="option.label"
        :selected="modelValue[props.fieldName] === option.value"
      />
    </div>
  </div>
</template>
