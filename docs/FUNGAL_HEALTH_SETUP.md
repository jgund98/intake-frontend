# Fungal Health Category - Product Tag Debugging Guide

## Issue: No Products Showing on Medication Selection Page

When you complete the fungal health questionnaire and reach the product selection page, no products are displayed. This happens because products need to have a matching `tag` field in the organization's backend data.

## How Product Filtering Works

The product filtering logic in `components/panels/ProductSelection.vue` filters products by matching the `tag` field:

```typescript
bundle?.tag?.toLowerCase() === category.toLowerCase()
```

For the fungal health category, products need to have:
```json
{
  "tag": "fungal health"
}
```

## Step 1: Check What Tags Your Organization Has

I've added comprehensive debug logging. Here's how to see what's happening:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your browser to:** `http://localhost:3000/?category=fungal%20health`

3. **Open Browser Developer Console** (F12 or Right-click → Inspect → Console)

4. **Look for the initial data load:**
   ```
   === ORGANIZATION DATA LOADED ===
   Organization: [Your Org Name]
   Link Name: nyxara
   Total Product Bundles: X
   Product Bundle Tags:
     - Product Name 1: tag="weight loss"
     - Product Name 2: tag="hair growth"
     - Product Name 3: tag="NO TAG"
   ================================
   ```

   This shows you ALL products and their tags when the app loads.

5. **Complete the fungal health questionnaire**

6. **On the product selection page, look for:**
   ```
   === PRODUCT FILTERING DEBUG ===
   Selected Category: fungal health
   Total Bundles Available: X
   Bundle Tags: [...]
   Filtered Products: 0
   ⚠️ No products found with tag "fungal health"
   Available tags: ["weight loss", "hair growth", "skin care"]
   ```

   This shows you exactly what category is being used and what tags are available.

## Step 2: Solution Options

### Option 1: Add Products with "fungal health" Tag (Recommended)

In your Care360 organization settings, add or update product bundles to include the tag `"fungal health"`:

1. Go to your Care360 admin panel
2. Navigate to Product Bundles
3. Create new products for antifungal treatments OR update existing products
4. Set the `tag` field to `"fungal health"` (case-insensitive)

Example products that should have this tag:
- Terbinafine (oral antifungal)
- Fluconazole (oral antifungal)
- Topical antifungal creams
- Combination antifungal bundles

### Option 2: Use Existing Product Tag

If you already have antifungal products with a different tag (e.g., "antifungal", "fungal treatment"), you can update the category mapping:

**File:** `data/forms/index.ts`

```typescript
const categoryFormConfigs: Record<string, any> = {
  'hair growth': hairGrowthConfig,
  'skin care': skinCareConfig,
  "men's health": mensHealthConfig,
  'weight loss product': weightLossConfig,
  wellness: wellnessConfig,
  'fungal health': fungalHealthConfig,  // ← Change this key to match your product tag
  default: weightLossConfig,
};
```

Change `'fungal health'` to match whatever tag your antifungal products use.

### Option 3: Update URL Parameter

If you want to use a different category name in the URL, update the query parameter:

Instead of:
```
?category=fungal health
```

Use:
```
?category=your-product-tag-name
```

## Current Behavior (No Fallback)

The system will show NO products if the tag doesn't match. This is intentional because:
- Users are always redirected with proper URL parameters
- Invalid categories default to "weight loss"
- No user should reach this stage without a valid category mapping

If you see an empty product page, it means the products in your Care360 organization don't have the matching tag configured.

## Testing

To test the fungal health category:

1. Navigate to: `http://localhost:3000/?category=fungal%20health`
2. Complete the questionnaire
3. Check the product selection page
4. Open browser console to see debug information

## Category to Tag Mapping

Current category mappings in the application:

| Category URL Parameter | Form Config | Expected Product Tag |
|------------------------|-------------|---------------------|
| `hair growth` | hairGrowthConfig | `hair growth` |
| `skin care` | skinCareConfig | `skin care` |
| `men's health` | mensHealthConfig | `men's health` |
| `weight loss product` | weightLossConfig | `weight loss product` |
| `wellness` | wellnessConfig | `wellness` |
| `fungal health` | fungalHealthConfig | `fungal health` |

## Organization Configuration

Your current organization: **nyxara**
- GraphQL Link Name: `nyxara`
- API URL: `https://api.care360-next.carevalidate.com`

Contact your Care360 administrator to configure product bundles with the appropriate tags.

## Related Files

- `components/panels/ProductSelection.vue` - Product filtering logic
- `data/forms/index.ts` - Category to form config mapping
- `data/forms/fungalHealthConfig.json` - Fungal health questionnaire
- `stores/organizationStore.ts` - Organization data store
- `models/apiResponse.model.ts` - ProductBundle type definition

## Need Help?

If you continue to see no products:
1. Check the browser console for the debug output
2. Verify product tags in Care360 admin panel
3. Ensure products are not marked as `isSoldOut: true`
4. Confirm the organization data is loading correctly
