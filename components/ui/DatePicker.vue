<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  name?: string;
  placeholder?: string;
  minDate?: string; // Format: YYYY-MM-DD
  maxDate?: string; // Format: YYYY-MM-DD
  fieldName: string;
  isPrimary?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select a date',
  isPrimary: true,
});

const modelValue = defineModel<Record<string, string>>({ default: {} });

const isOpen = ref(false);
const datePickerRef = ref<HTMLDivElement | null>(null);
const openUpward = ref(false);
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

// Current viewing month/year in calendar
const viewingDate = ref(new Date());

// View modes: 'date', 'month', 'year'
const viewMode = ref<'date' | 'month' | 'year'>('date');

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
};

const displayValue = computed(() => {
  const dateStr = modelValue.value[props.fieldName];
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

const currentMonth = computed(() => {
  return viewingDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
});

const currentYear = computed(() => {
  return viewingDate.value.getFullYear();
});

// Generate year range for year selector (current year ± 50 years)
const yearRange = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 100; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
});

const calendarDays = computed(() => {
  const year = viewingDate.value.getFullYear();
  const month = viewingDate.value.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: Array<{ date: Date; isCurrentMonth: boolean; dateStr: string }> =
    [];

  // Previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      dateStr: formatDate(date),
    });
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      dateStr: formatDate(date),
    });
  }

  // Next month's days to fill the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      dateStr: formatDate(date),
    });
  }

  return days;
});

const isDateDisabled = (dateStr: string): boolean => {
  if (!props.minDate && !props.maxDate) return false;

  const date = parseDate(dateStr);
  if (!date) return false;

  if (props.minDate) {
    const minDate = parseDate(props.minDate);
    if (minDate && date < minDate) return true;
  }

  if (props.maxDate) {
    const maxDate = parseDate(props.maxDate);
    if (maxDate && date > maxDate) return true;
  }

  return false;
};

const isSelectedDate = (dateStr: string): boolean => {
  return modelValue.value[props.fieldName] === dateStr;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const checkDropdownPosition = () => {
  if (!datePickerRef.value) return;

  const buttonRect = datePickerRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // Estimate calendar height (approx 320px)
  const estimatedCalendarHeight = 320;

  openUpward.value =
    spaceBelow < estimatedCalendarHeight && spaceAbove > spaceBelow;

  // Calculate dropdown position for fixed positioning
  if (openUpward.value) {
    dropdownPosition.value = {
      top: buttonRect.top - estimatedCalendarHeight - 8,
      left: buttonRect.left,
      width: buttonRect.width,
    };
  } else {
    dropdownPosition.value = {
      top: buttonRect.bottom + 8,
      left: buttonRect.left,
      width: buttonRect.width,
    };
  }
};

const toggleCalendar = (event: Event) => {
  event.stopPropagation();
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    // Reset to date view
    viewMode.value = 'date';
    // Set viewing date to selected date or today
    const dateStr = modelValue.value[props.fieldName];
    if (dateStr) {
      const selectedDate = parseDate(dateStr);
      if (selectedDate) {
        viewingDate.value = selectedDate;
      }
    } else {
      viewingDate.value = new Date();
    }
    setTimeout(() => checkDropdownPosition(), 10);
  }
};

const selectDate = (dateStr: string, event: Event) => {
  event.stopPropagation();
  if (isDateDisabled(dateStr)) return;
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: dateStr,
  };
  isOpen.value = false;
};

const previousMonth = (event: Event) => {
  event.stopPropagation();
  viewingDate.value = new Date(
    viewingDate.value.getFullYear(),
    viewingDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = (event: Event) => {
  event.stopPropagation();
  viewingDate.value = new Date(
    viewingDate.value.getFullYear(),
    viewingDate.value.getMonth() + 1,
    1
  );
};

const previousYear = (event: Event) => {
  event.stopPropagation();
  viewingDate.value = new Date(
    viewingDate.value.getFullYear() - 1,
    viewingDate.value.getMonth(),
    1
  );
};

const nextYear = (event: Event) => {
  event.stopPropagation();
  viewingDate.value = new Date(
    viewingDate.value.getFullYear() + 1,
    viewingDate.value.getMonth(),
    1
  );
};

const toggleMonthYearView = (event: Event) => {
  event.stopPropagation();
  if (viewMode.value === 'date') {
    viewMode.value = 'month';
  } else if (viewMode.value === 'month') {
    viewMode.value = 'year';
  } else {
    viewMode.value = 'date';
  }
};

const selectMonth = (monthIndex: number, event: Event) => {
  event.stopPropagation();
  viewingDate.value = new Date(viewingDate.value.getFullYear(), monthIndex, 1);
  viewMode.value = 'date';
};

const selectYear = (year: number, event: Event) => {
  event.stopPropagation();
  viewingDate.value = new Date(year, viewingDate.value.getMonth(), 1);
  viewMode.value = 'month';
};

// Close calendar when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (
    datePickerRef.value &&
    !datePickerRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
};

// Recalculate position on scroll or resize
const handlePositionUpdate = () => {
  if (isOpen.value) {
    checkDropdownPosition();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handlePositionUpdate, true);
  window.addEventListener('resize', handlePositionUpdate);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handlePositionUpdate, true);
  window.removeEventListener('resize', handlePositionUpdate);
});
</script>

<template>
  <div v-bind="$attrs">
    <div ref="datePickerRef" class="relative overflow-visible min-w-0">
      <!-- Input Field -->
      <button
        type="button"
        class="w-full flex items-center px-3 rounded-input border-2 bg-transparent shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] cursor-pointer relative z-10 text-left transition-colors h-[42px]"
        :class="
          isPrimary
            ? 'border-primary-dark-5 focus:border-primary hover:border-primary'
            : 'border-gray-300 focus:border-gray-500 hover:border-gray-500'
        "
        @click="toggleCalendar"
      >
        <input
          :value="displayValue"
          :name="fieldName"
          :placeholder="placeholder"
          type="text"
          readonly
          class="flex-1 min-w-0 bg-transparent outline-none border-none text-base-input text-gray-1 placeholder-gray-11 cursor-pointer"
        />
        <NuxtImg
          src="/icons/calendar.svg"
          alt="Calendar"
          width="16"
          height="16"
          class="w-4 h-4 flex-shrink-0"
        />
      </button>

      <!-- Calendar Dropdown with Teleport -->
      <Teleport to="body">
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="fixed z-[9999] bg-white rounded-2xl shadow-lg border border-gray-200 p-4"
            :style="{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: '320px',
              maxWidth: '400px',
            }"
          >
            <!-- Navigation Header -->
            <div class="flex items-center justify-between mb-4">
              <button
                type="button"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                @click="
                  viewMode === 'year'
                    ? previousYear($event)
                    : previousMonth($event)
                "
              >
                <NuxtImg
                  src="/icons/chevron-left.svg"
                  alt="Previous"
                  width="16"
                  height="16"
                  class="w-4 h-4"
                />
              </button>

              <button
                type="button"
                class="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
                @click="toggleMonthYearView"
              >
                {{ viewMode === 'year' ? 'Select Year' : currentMonth }}
              </button>

              <button
                type="button"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                @click="
                  viewMode === 'year' ? nextYear($event) : nextMonth($event)
                "
              >
                <NuxtImg
                  src="/icons/chevron-right.svg"
                  alt="Next"
                  width="16"
                  height="16"
                  class="w-4 h-4"
                />
              </button>
            </div>

            <!-- Date View -->
            <template v-if="viewMode === 'date'">
              <!-- Days of Week -->
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div
                  v-for="day in daysOfWeek"
                  :key="day"
                  class="text-center text-xs font-medium text-gray-500 py-1"
                >
                  {{ day }}
                </div>
              </div>

              <!-- Calendar Grid -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="(day, index) in calendarDays"
                  :key="index"
                  type="button"
                  :disabled="isDateDisabled(day.dateStr)"
                  class="aspect-square p-2 text-sm rounded-lg transition-all"
                  :class="[
                    isDateDisabled(day.dateStr)
                      ? 'opacity-40 cursor-not-allowed text-gray-400'
                      : !day.isCurrentMonth
                        ? 'text-gray-400'
                        : isSelectedDate(day.dateStr)
                          ? 'bg-primary text-white font-semibold'
                          : isToday(day.date)
                            ? 'bg-primary-dark-2 text-primary font-semibold'
                            : 'text-gray-700 hover:bg-gray-100',
                    isDateDisabled(day.dateStr) ? '' : 'cursor-pointer',
                  ]"
                  @click="selectDate(day.dateStr, $event)"
                >
                  {{ day.date.getDate() }}
                </button>
              </div>
            </template>

            <!-- Month View -->
            <template v-else-if="viewMode === 'month'">
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="(month, index) in monthNames"
                  :key="index"
                  type="button"
                  class="p-3 text-sm rounded-lg transition-all"
                  :class="
                    viewingDate.getMonth() === index
                      ? 'bg-primary text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  "
                  @click="selectMonth(index, $event)"
                >
                  {{ month.substring(0, 3) }}
                </button>
              </div>
            </template>

            <!-- Year View -->
            <template v-else-if="viewMode === 'year'">
              <div
                class="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto custom-scrollbar"
              >
                <button
                  v-for="year in yearRange"
                  :key="year"
                  type="button"
                  class="p-3 text-sm rounded-lg transition-all"
                  :class="
                    currentYear === year
                      ? 'bg-primary text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  "
                  @click="selectYear(year, $event)"
                >
                  {{ year }}
                </button>
              </div>
            </template>
          </div>
        </transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
