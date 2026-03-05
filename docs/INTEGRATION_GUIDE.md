# Integration Guide - Connecting Frontend to Questionnaire Funnel

This guide explains how to integrate your marketing/product frontend with the questionnaire funnel system.

---

## Overview

The questionnaire system is a single-page application that dynamically loads different questionnaires based on URL parameters. All categories use the same route with different query parameters.

---

## URL Structure

### Base Route
```
https://your-domain.com/
```

### Query Parameters

#### 1. `category` (Required)
Determines which questionnaire to load.

**Format:** URL-encoded string (case-insensitive)

**Examples:**
```
?category=weightloss
?category=branded%20weight%20loss
?category=skin%20care
?category=fungal%20health
```

#### 2. `productId` (Optional)
Pre-selects a specific product on the medication selection page.

**Format:** Product bundle ID from Care360

**Example:**
```
?category=weightloss&productId=abc123def456
```

---

## Available Categories & Routes

### Weight Loss
```
?category=weightloss
?category=branded%20weight%20loss
?category=weight%20loss
```
**Maps to Product Tag:** `Weightloss`

### Skin Care
```
?category=skin%20care
?category=skincare
```
**Maps to Product Tag:** `Skin Care`

### Men's Health / Sexual Health
```
?category=mens%20health
?category=sexual%20health
```
**Maps to Product Tag:** `Sexual Health`

### Wellness / Anti-Aging
```
?category=wellness
?category=anti-aging
```
**Maps to Product Tag:** `Anti-Aging & Peptides`

### Fungal Health
```
?category=fungal%20health
?category=foot%20%26%20nail%20health
?category=antifungal
```
**Maps to Product Tag:** `Foot & Nail Health`

### Hair Growth
```
?category=hair%20growth
```
**Maps to Product Tag:** `Hair Growth` (if available in Care360)

---

## How to Redirect Users from Your Frontend

### Option 1: Simple Link (No Product Preselection)

```html
<a href="https://your-domain.com/?category=weightloss">
  Start Weight Loss Questionnaire
</a>
```

### Option 2: Link with Product Preselection

```html
<a href="https://your-domain.com/?category=weightloss&productId=abc123">
  Get Semaglutide
</a>
```

### Option 3: JavaScript Redirect

```javascript
// Simple redirect
window.location.href = 'https://your-domain.com/?category=skin%20care';

// With product preselection
const category = 'weightloss';
const productId = 'abc123def456';
window.location.href = `https://your-domain.com/?category=${category}&productId=${productId}`;
```

### Option 4: React/Vue Router

```javascript
// React Router
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/?category=fungal%20health');

// Vue Router
import { useRouter } from 'vue-router';

const router = useRouter();
router.push({ path: '/', query: { category: 'fungal health' } });
```

---

## Product ID Usage

### What is Product ID?

The `productId` parameter allows you to **pre-select a specific product bundle** when the user reaches the medication selection page after completing the questionnaire.

### When to Use Product ID

1. **Direct Product Links:** User clicks "Get Semaglutide" on your marketing site
2. **Email Campaigns:** Link directly to a specific product
3. **Ads/Landing Pages:** Deep link to specific medication
4. **Upsell Flows:** Suggest specific products based on user behavior

### How It Works

1. User clicks link with `productId` parameter
2. System validates the product ID exists in Care360
3. Product ID is stored in localStorage
4. After completing questionnaire, the specific product is auto-selected
5. User can still change selection if desired

### Example Flow

```
User Journey:
1. Clicks: "Get Semaglutide 3-Month Supply"
   URL: ?category=weightloss&productId=sema-3month-id

2. Completes weight loss questionnaire (5 steps)

3. Reaches product selection page
   → Semaglutide is auto-selected
   → 3-month bundle is pre-selected
   → User can change if desired

4. Proceeds to payment
```

### Getting Product IDs

Product IDs come from your Care360 organization data. To find them:

1. Open browser console on the questionnaire page
2. Look for the debug output:
   ```
   === ORGANIZATION DATA LOADED ===
   Product Bundle Tags:
     - Semaglutide 3-month: tag="Weightloss", id="abc123"
     - Finasteride: tag="Hair Growth", id="def456"
   ```
3. Use the `id` field in your links

---

## Category to Product Tag Mapping

The system uses an alias system to map category names to Care360 product tags.

**File:** `data/forms/index.ts`

```typescript
const categoryToProductTag: Record<string, string> = {
  'branded weight loss': 'weightloss',
  'skin care': 'skin care',
  "men's health": 'sexual health',
  'wellness': 'anti-aging & peptides',
  'fungal health': 'foot & nail health',
  // ... more mappings
};
```

### Why This Matters

- **Category** = What you use in URLs and marketing
- **Product Tag** = What's configured in Care360 backend

The mapping allows flexible naming in your frontend while matching backend data.

---

## Adding New Categories

To add a new category (e.g., "Allergy Treatment"):

### Step 1: Create Form Config
Create `data/forms/allergyConfig.json` with questionnaire structure.

### Step 2: Import in index.ts
```typescript
import allergyConfig from '~/data/forms/allergyConfig.json';
```

### Step 3: Add to Category Mapping
```typescript
const categoryFormConfigs: Record<string, any> = {
  // ... existing categories
  'allergy': allergyConfig,
  'allergy treatment': allergyConfig,
};
```

### Step 4: Add Product Tag Mapping
```typescript
const categoryToProductTag: Record<string, string> = {
  // ... existing mappings
  'allergy': 'allergy products',  // Must match Care360 tag
  'allergy treatment': 'allergy products',
};
```

### Step 5: Ensure Products Exist in Care360
Products must have `tag: "Allergy Products"` in Care360 backend.

---

## Testing Your Integration

### 1. Test Category Loading
```
Navigate to: ?category=your-category
Expected: Questionnaire loads with correct questions
```

### 2. Test Product Filtering
```
Complete questionnaire
Expected: Products with matching tag appear on selection page
```

### 3. Test Product Preselection
```
Navigate to: ?category=your-category&productId=valid-id
Complete questionnaire
Expected: Specific product is auto-selected
```

### 4. Check Console Logs
Open browser console to see:
- Organization data loaded
- Category mapping
- Product filtering results
- Any errors or warnings

---

## Common Integration Patterns

### Pattern 1: Category Landing Pages

```html
<!-- Weight Loss Landing Page -->
<section class="hero">
  <h1>Transform Your Health with GLP-1</h1>
  <a href="/?category=weightloss" class="cta-button">
    Get Started
  </a>
</section>
```

### Pattern 2: Product Cards

```html
<!-- Product Grid -->
<div class="product-grid">
  <div class="product-card">
    <h3>Semaglutide</h3>
    <p>$299/month</p>
    <a href="/?category=weightloss&productId=sema-id">
      Select This Product
    </a>
  </div>
  
  <div class="product-card">
    <h3>Tirzepatide</h3>
    <p>$399/month</p>
    <a href="/?category=weightloss&productId=tirz-id">
      Select This Product
    </a>
  </div>
</div>
```

### Pattern 3: Dynamic Category Selection

```javascript
// User selects category from dropdown
const categories = [
  { label: 'Weight Loss', value: 'weightloss' },
  { label: 'Skin Care', value: 'skin care' },
  { label: 'Hair Growth', value: 'hair growth' },
  { label: 'Fungal Health', value: 'fungal health' },
];

function startQuestionnaire(categoryValue) {
  window.location.href = `/?category=${encodeURIComponent(categoryValue)}`;
}
```

### Pattern 4: Email Campaign Links

```html
<!-- Email Template -->
<a href="https://your-domain.com/?category=fungal%20health&productId=terb-oral-id&utm_source=email&utm_campaign=fungal-launch">
  Treat Your Nail Fungus - Get Started
</a>
```

---

## Debugging

### No Products Showing

**Check:**
1. Console logs show available product tags
2. Category maps to correct product tag
3. Products exist in Care360 with matching tag
4. Product tag spelling/capitalization matches exactly

**Console Output:**
```
=== PRODUCT FILTERING DEBUG ===
Selected Category: fungal health
Mapped Product Tag: foot & nail health
Total Bundles Available: 21
Filtered Products: 3
```

### Wrong Questionnaire Loading

**Check:**
1. Category parameter is URL-encoded
2. Category exists in `categoryFormConfigs`
3. Form config file is imported correctly

### Product Not Pre-selecting

**Check:**
1. Product ID is valid (exists in Care360)
2. Product ID matches exactly (case-sensitive)
3. Console shows product validation
4. localStorage has `preselectedProductId`

---

## Environment Configuration

### .env File

```env
# Default category when no parameter provided
NUXT_PUBLIC_DEFAULT_CATEGORY=Weightloss

# Care360 API Configuration
NUXT_PUBLIC_GRAPHQL_API_URL=https://api.care360-next.carevalidate.com
NUXT_PUBLIC_GRAPHQL_LINK_NAME=your-org-name
NUXT_PUBLIC_CARE360_TOKEN=your-token-here
```

---

## Key Files Reference

### Category Configuration
- `data/forms/index.ts` - Category mappings and product tag aliases
- `data/forms/weightLossConfig.json` - Weight loss questionnaire
- `data/forms/fungalHealthConfig.json` - Fungal health questionnaire
- `data/forms/skinCareConfig.json` - Skin care questionnaire
- etc.

### Product Selection
- `components/panels/ProductSelection.vue` - Product filtering and display
- `stores/organizationStore.ts` - Category and product ID storage
- `plugins/init.client.ts` - Initial data loading and validation

### Routing
- `pages/index.vue` - Main questionnaire page
- `pages/products/index.vue` - Product selection page
- `pages/payment/index.vue` - Payment page

---

## Support

If you encounter issues:

1. Check browser console for debug logs
2. Verify product tags in Care360 match your mappings
3. Ensure category is URL-encoded in links
4. Test with different categories to isolate issues

For questions about Care360 configuration, contact your administrator.

---

## Quick Reference

### URL Format
```
https://your-domain.com/?category={category-name}&productId={optional-product-id}
```

### Available Categories
- `weightloss` / `branded weight loss`
- `skin care`
- `mens health` / `sexual health`
- `wellness` / `anti-aging`
- `fungal health` / `foot & nail health`
- `hair growth`

### Product Tags (Care360)
- `Weightloss`
- `Skin Care`
- `Sexual Health`
- `Anti-Aging & Peptides`
- `Foot & Nail Health`
- `Hair Growth`

---

**Last Updated:** March 2026
**Version:** 1.0
