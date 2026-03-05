# AI Context Summary - Questionnaire Funnel System

This document provides context for AI assistants working on the frontend integration with this questionnaire system.

---

## System Architecture

### What This Application Does
This is a Nuxt 3 application that provides medical intake questionnaires for different product categories (weight loss, skin care, fungal health, etc.). Users complete questionnaires and then select products for purchase.

### Key Concept: Category-Based Routing
- **Single route** (`/`) handles ALL questionnaires
- **URL parameter** `?category=X` determines which questionnaire loads
- **Dynamic form rendering** based on JSON configuration files

---

## Critical Understanding: Category vs Product Tag

### The Two-Layer System

**Layer 1: Category (User-Facing)**
- Used in URLs, marketing, and user interface
- Examples: `"Branded Weight Loss"`, `"Fungal Health"`, `"Skin Care"`
- Flexible naming for marketing purposes

**Layer 2: Product Tag (Backend)**
- Used in Care360 database to tag products
- Examples: `"Weightloss"`, `"Foot & Nail Health"`, `"Skin Care"`
- Must match exactly what's in the database

### The Mapping System

**File:** `data/forms/index.ts`

```typescript
// Maps user-facing category names to backend product tags
const categoryToProductTag: Record<string, string> = {
  'branded weight loss': 'weightloss',      // Category → Tag
  'fungal health': 'foot & nail health',    // Category → Tag
  'skin care': 'skin care',                 // Category → Tag
  // etc.
};
```

**Why This Exists:**
- Marketing wants to use "Branded Weight Loss" in URLs
- Backend products are tagged as "Weightloss"
- Mapping bridges the gap

---

## Data Flow

### 1. User Arrives
```
URL: ?category=branded%20weight%20loss
```

### 2. Category Stored
```javascript
// plugins/init.client.ts
organizationStore.setCategory('Branded Weight Loss');
localStorage.setItem('category', 'Branded Weight Loss');
```

### 3. Form Config Loaded
```javascript
// data/forms/index.ts
getCurrentFormConfig('Branded Weight Loss')
// Returns: weightLossConfig.json
```

### 4. User Completes Questionnaire
- 5 steps with multiple substeps
- Data stored in Pinia store
- Validation at each step

### 5. Product Selection Page
```javascript
// components/panels/ProductSelection.vue
const category = 'Branded Weight Loss';
const productTag = getProductTagForCategory(category);
// Returns: 'weightloss'

// Filter products
products.filter(p => p.tag.toLowerCase() === 'weightloss');
```

### 6. Products Displayed
- Only products with matching tag shown
- User selects product and bundle
- Proceeds to payment

---

## File Structure

### Configuration Files
```
data/forms/
├── index.ts                    # Category mappings & product tag aliases
├── weightLossConfig.json       # Weight loss questionnaire
├── fungalHealthConfig.json     # Fungal health questionnaire
├── skinCareConfig.json         # Skin care questionnaire
├── mensHealthConfig.json       # Men's health questionnaire
├── wellnessConfig.json         # Wellness questionnaire
└── hairGrowthConfig.json       # Hair growth questionnaire
```

### Custom Components
```
components/panels/
├── ProductSelection.vue              # Product filtering & display
├── ConditionDetailsWithUpload.vue    # Custom: duration + diagnosis + upload
├── TwoDropdowns.vue                  # Custom: two related dropdowns
├── BMICalculator.vue                 # Height/weight/age with BMI
├── BasicInfo.vue                     # Name, DOB, address
├── UserDetails.vue                   # Email, phone, password
└── [other panel components]
```

### State Management
```
stores/
├── organizationStore.ts        # Org data, category, preselectedProductId
├── intakeFormStore.ts          # Form data, validation, progress
└── uiStore.ts                  # Loading states, toasts
```

### Core Logic
```
composables/
├── useFormRenderer.ts          # Dynamic form rendering engine
├── useOrgData.ts              # Fetch organization data from API
└── [other composables]

plugins/
└── init.client.ts             # App initialization, data loading
```

---

## Common Tasks & Solutions

### Task: Add New Category

**Steps:**
1. Create `data/forms/newCategoryConfig.json`
2. Import in `data/forms/index.ts`
3. Add to `categoryFormConfigs` mapping
4. Add to `categoryToProductTag` mapping
5. Ensure products exist in Care360 with matching tag

**Example:**
```typescript
// 1. Import
import allergyConfig from '~/data/forms/allergyConfig.json';

// 2. Add to form configs
const categoryFormConfigs: Record<string, any> = {
  'allergy': allergyConfig,
  'allergy treatment': allergyConfig,
};

// 3. Add to product tag mapping
const categoryToProductTag: Record<string, string> = {
  'allergy': 'allergy products',  // Must match Care360 tag!
};
```

### Task: Debug "No Products Showing"

**Check These:**
1. Console logs show product tags from Care360
2. Category maps to correct product tag in `categoryToProductTag`
3. Product tag spelling matches exactly (case-insensitive but must match)
4. Products exist in Care360 with that tag

**Console Output to Look For:**
```
=== PRODUCT FILTERING DEBUG ===
Selected Category: fungal health
Mapped Product Tag: foot & nail health
Available tags: ['Weightloss', 'Skin Care', 'Foot & Nail Health']
Filtered Products: 3
```

### Task: Create Custom Component

**Example: Combining Multiple Fields**

1. Create component in `components/panels/YourComponent.vue`
2. Use `v-model` for data binding
3. Emit validation state
4. Register in `composables/useFormRenderer.ts`

**Template:**
```vue
<script setup lang="ts">
const modelValue = defineModel<Record<string, any>>({ default: {} });
const props = defineProps<{ fieldName: string }>();

const isComplete = computed(() => {
  return !!(modelValue.value[props.fieldName]?.field1 && 
            modelValue.value[props.fieldName]?.field2);
});

watch(isComplete, (complete) => {
  if (complete) {
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: { field1: '...', field2: '...' }
    };
  }
});
</script>
```

**Register:**
```typescript
// composables/useFormRenderer.ts
case 'YourComponent':
  return {
    component: resolveComponent('YourComponent'),
    validation: z.object({
      field1: z.string().min(1),
      field2: z.string().min(1),
    }),
  };
```

### Task: Update Product Tag Mapping

**Scenario:** Care360 admin changed product tags

**Solution:**
1. Run app and check console for new tags
2. Update `categoryToProductTag` in `data/forms/index.ts`
3. Test each category

**Example:**
```typescript
// Old mapping
'fungal health': 'foot & nail health',

// Care360 changed tag to "Antifungal Products"
'fungal health': 'antifungal products',  // Update this
```

---

## Important Patterns

### Pattern 1: URL Encoding
Always URL-encode category parameters:
```javascript
// ✅ Correct
const url = `/?category=${encodeURIComponent('fungal health')}`;
// Result: /?category=fungal%20health

// ❌ Wrong
const url = `/?category=fungal health`;
// Breaks with spaces
```

### Pattern 2: Case-Insensitive Matching
All category and tag matching is case-insensitive:
```typescript
category.toLowerCase().trim()
```

### Pattern 3: LocalStorage Persistence
Category and productId persist across sessions:
```javascript
localStorage.setItem('category', category);
localStorage.setItem('preselectedProductId', productId);
```

### Pattern 4: Validation Before Navigation
Always validate form data before allowing navigation:
```typescript
const isStepComplete = computed(() => {
  return Object.keys(currentStepData.value).length > 0;
});
```

---

## API Integration

### Organization Data Fetch
```
Client → /api/getOrgData → Care360 GraphQL API
```

**Returns:**
- Organization settings
- Product bundles (with tags)
- Form configurations
- FAQ data

**Key Fields:**
```typescript
interface ProductBundle {
  id: string;
  name: string;
  tag: string;           // ← Used for filtering!
  price: number;
  imageUrl: string;
  // ... more fields
}
```

---

## Debugging Tools

### Console Logs Added

**On App Load:**
```
=== ORGANIZATION DATA LOADED ===
Organization: Nyxara
Total Product Bundles: 21
Product Bundle Tags:
  - Semaglutide: tag="Weightloss"
  - Tretinoin: tag="Skin Care"
  - Terbinafine: tag="Foot & Nail Health"
```

**On Product Page:**
```
=== PRODUCT FILTERING DEBUG ===
Selected Category: fungal health
Mapped Product Tag: foot & nail health
Total Bundles Available: 21
Filtered Products: 3
```

### Browser DevTools
- **Application → Local Storage:** Check stored category/productId
- **Network → getOrgData:** Verify API response
- **Vue DevTools:** Inspect Pinia stores

---

## Common Pitfalls

### Pitfall 1: Forgetting URL Encoding
```javascript
// ❌ Breaks
<a href="/?category=fungal health">

// ✅ Works
<a href="/?category=fungal%20health">
```

### Pitfall 2: Mismatched Product Tags
```typescript
// Category mapping says:
'fungal health': 'foot & nail health'

// But Care360 products have:
tag: 'Antifungal'

// Result: No products show!
```

### Pitfall 3: Not Clearing LocalStorage
Old category persists even after URL change. Solution:
```javascript
// Clear localStorage when testing
localStorage.clear();
```

### Pitfall 4: Case Sensitivity Assumptions
Product tags ARE case-sensitive in Care360, but our matching is case-insensitive:
```typescript
// These all match:
'Weightloss' === 'weightloss' === 'WEIGHTLOSS'
```

---

## Testing Checklist

When integrating frontend:

- [ ] Test each category URL loads correct questionnaire
- [ ] Test product filtering shows correct products
- [ ] Test productId parameter pre-selects product
- [ ] Test URL encoding with spaces and special chars
- [ ] Test localStorage persistence across page reloads
- [ ] Test invalid category defaults to weight loss
- [ ] Test invalid productId is ignored gracefully
- [ ] Check console logs for errors/warnings
- [ ] Verify all form validations work
- [ ] Test mobile responsive design

---

## Environment Variables

```env
# Required
NUXT_PUBLIC_GRAPHQL_API_URL=https://api.care360-next.carevalidate.com
NUXT_PUBLIC_GRAPHQL_LINK_NAME=your-org-name
NUXT_PUBLIC_CARE360_TOKEN=your-token

# Optional
NUXT_PUBLIC_DEFAULT_CATEGORY=Weightloss
NUXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## Key Takeaways for AI Assistants

1. **Category ≠ Product Tag** - They're mapped via `categoryToProductTag`
2. **Single route, multiple questionnaires** - All use `/?category=X`
3. **Product filtering is strict** - Tags must match exactly
4. **Console logs are your friend** - Debug info shows everything
5. **LocalStorage persists state** - Clear it when testing
6. **URL encoding matters** - Always encode category parameters
7. **Case-insensitive matching** - But tags must exist in Care360

---

**For Questions:**
- Check `docs/INTEGRATION_GUIDE.md` for frontend integration
- Check `docs/FUNGAL_HEALTH_SETUP.md` for product tag debugging
- Check console logs for real-time debugging info

**Last Updated:** March 2026
