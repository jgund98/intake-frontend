<script setup lang="ts">
// Types
interface Step {
  id: number;
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
  showLabel?: boolean;
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
});

// Common classes for step circles
const stepCircleBaseClasses =
  'w-10 h-10 rounded-full flex items-center justify-center subtitle2';

// State-specific classes for step circles
// State-specific classes for step circles
const stepCircleStateClasses = {
  completed: 'bg-primary-light text-gray-900 font-bold',
  
  active: 
    'font-bold text-gray-900 bg-primary-light shadow-[0_10px_15px_-3px_var(--color-primary-dark-4),0_4px_6px_-4px_var(--color-primary-dark-4)]',
    
  pending: 'bg-background-muted text-icon-inactive font-medium',
};

// Common classes for connector lines
const lineBaseClasses = 'w-[50px] h-[4px] rounded-full flex-shrink-0';

// State-specific classes for connector lines
const lineStateClasses = {
  completed: 'bg-primary-light',
  pending: 'bg-background-muted',
};

// Computed helpers
const isCompleted = (stepId: number): boolean => stepId < props.currentStep;
const isActive = (stepId: number): boolean => stepId === props.currentStep;

// Get step circle classes
const getStepCircleClasses = (stepId: number) => {
  return {
    [stepCircleBaseClasses]: true,
    [stepCircleStateClasses.completed]: isCompleted(stepId),
    [stepCircleStateClasses.active]: isActive(stepId),
    [stepCircleStateClasses.pending]: !isCompleted(stepId) && !isActive(stepId),
  };
};

// Get line classes
const getLineClasses = (stepId: number) => {
  return {
    [lineBaseClasses]: true,
    [lineStateClasses.completed]: isCompleted(stepId),
    [lineStateClasses.pending]: !isCompleted(stepId),
  };
};
</script>

<template>
  <div class="flex items-center gap-3">
    <template v-for="(step, index) in steps" :key="step.id">
      <!-- Step Circle with optional label -->
      <div class="flex items-center gap-2">
        <div :class="getStepCircleClasses(step.id)">
          <NuxtImg
            v-if="isCompleted(step.id)"
            src="/icons/completed.svg"
            alt="Completed"
            width="24"
            height="24"
            class="w-[24px] h-[24px] block"
          />
          <span v-else>{{ step.id }}</span>
        </div>

        <!-- Show label only for active step -->
        <!-- Hide between 1024px to 1280px -->
        <span
          v-if="showLabel && isActive(step.id)"
          class="body1 font-semibold text-gray-1 lg:hidden xl:block"
        >
          {{ step.label }}
        </span>
      </div>

      <!-- Connector Line (not after last step) -->
      <div
        v-if="index < steps.length - 1"
        :class="getLineClasses(step.id)"
      ></div>
    </template>
  </div>
</template>
