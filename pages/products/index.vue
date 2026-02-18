<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFormStore } from '~/stores/intakeFormStore';
import ProductSelection from '~/components/panels/ProductSelection.vue';

const router = useRouter();
const formStore = useFormStore();

// Product selection data
const productData = computed({
  get: () => formStore.formData,
  set: value => formStore.setFormData(value),
});

// Check if form is completed
const isFormCompleted = computed(() => {
  return formStore.isFormCompleted;
});

// Redirect if form is not completed OR payment already completed
onMounted(() => {
  if (!isFormCompleted.value) {
    router.push({ path: '/' }); // Redirect without query params (category will be auto-added by plugin)
    return;
  }

  // Redirect to success page if payment is already completed
  if (formStore.isPaymentCompleted) {
    router.push('/payment/success');
  }
});
</script>

<template>
  <div class="w-full max-w-4xl mx-auto">
    <ProductSelection v-model="productData" field-name="productSelection" />
  </div>
</template>
