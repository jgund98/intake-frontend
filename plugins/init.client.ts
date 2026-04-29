import { defineNuxtPlugin, useRouter, useRoute } from '#app';
import { useRuntimeConfig } from '#imports';
import { useFormStore } from '~/stores/intakeFormStore';
import { useOrganizationStore } from '~/stores/organizationStore';
import { useUiStore } from '~/stores/uiStore';
import { useOrgData } from '~/composables/useOrgData';
import { isCategoryValid } from '~/data/forms/index';

let isInitialized = false;

export default defineNuxtPlugin(nuxtApp => {
  const formStore = useFormStore();
  const organizationStore = useOrganizationStore();
  const router = useRouter();
  const route = useRoute();

  // Initialize composable ONCE outside the hook to prevent duplicate calls
  const { orgData, fetchOrgData } = useOrgData();

  // Runs once after hydration (client-side only)
  nuxtApp.hooks.hook('app:mounted', async () => {
    // Prevent double initialization
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    try {
      // Initialize Pinia stores from localStorage
      formStore.initializeFromLocalStorage();

      // Fetch organization data from API (loading is handled inside composable)
      const success = await fetchOrgData();

      if (success && orgData.value) {
        // Store organization data in the store
        organizationStore.setOrgData(orgData.value);



        // Provide organization data to the app (for backward compatibility)
        nuxtApp.provide('orgData', orgData.value);

        // Get runtime config
        const {
          public: { defaultCategory },
        } = useRuntimeConfig();

        // Get category from URL or use default
        const categoryParam = String(route.query.category || '').trim();
        // Decode URL-encoded category (e.g., "wellness%20%2F%20protein%20products" -> "wellness / protein products")
        const urlCategory = categoryParam
          ? decodeURIComponent(categoryParam)
          : '';
        const storedCategory = localStorage.getItem('category');

        // Determine which category to use
        let category = urlCategory || storedCategory || defaultCategory;

        // Validate if category exists in categoryFormConfigs
        const isValid = isCategoryValid(category);

        // If category is not valid, use default category
        if (!isValid) {
          category = defaultCategory;
        }

        // If category changed from stored one, clear previous data
        if (storedCategory && storedCategory !== category) {
          formStore.resetForm();
        }

        // Store validated category in localStorage and organizationStore
        localStorage.setItem('category', category);
        organizationStore.setCategory(category);

        // Handle preselected product ID from URL
        const productIdParam = String(route.query.productId || '').trim();
        const storedProductId = localStorage.getItem('preselectedProductId');

        if (productIdParam) {
          // New productId from URL - validate it exists in productBundles
          const productBundles = orgData.value?.productBundles || [];
          const isValidProductId = productBundles.some(
            bundle => bundle.id === productIdParam
          );

          if (isValidProductId) {
            organizationStore.setPreselectedProductId(productIdParam);
          } else {
            // Invalid productId - clear any stored one
            organizationStore.clearPreselectedProduct();
          }
        } else if (storedProductId) {
          // No productId in URL, but have stored one - validate it still exists
          const productBundles = orgData.value?.productBundles || [];
          const isValidProductId = productBundles.some(
            bundle => bundle.id === storedProductId
          );

          if (isValidProductId) {
            organizationStore.initPreselectedProductFromStorage();
          } else {
            // Stored productId no longer valid - clear it
            organizationStore.clearPreselectedProduct();
          }
        }

        // Update URL with validated category and productId on index page
        // This ensures route matches the actual state being used
        if (route.path === '/') {
          const currentProductId = organizationStore.preselectedProductId;
          const urlProductId = route.query.productId;

          // Determine if URL needs updating
          const needsCategoryUpdate = !urlCategory || !isValid;
          const needsProductIdUpdate = currentProductId && !urlProductId;

          if (needsCategoryUpdate || needsProductIdUpdate) {
            const newQuery: Record<string, string> = {
              ...route.query,
              category,
            };

            // Add productId to URL if we have one stored but not in URL
            if (currentProductId && !urlProductId) {
              newQuery.productId = currentProductId;
            }

            router.replace({ query: newQuery });
          }
        }
      }
    } catch (e) {
      // Error is already handled via toast in composable
      console.warn('[init.client] Initialization error:', e);
    } finally {
      // Ensure loader is always stopped, even if something fails unexpectedly
      const uiStore = useUiStore();
      uiStore.stop();
    }
  });
});
