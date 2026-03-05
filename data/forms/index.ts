// Form configurations
import weightLossConfig from '~/data/forms/weightLossConfig.json';
import hairGrowthConfig from '~/data/forms/hairGrowthConfig.json';
import skinCareConfig from '~/data/forms/skinCareConfig.json';
import mensHealthConfig from '~/data/forms/mensHealthConfig.json';
import wellnessConfig from '~/data/forms/wellnessConfig.json';
import fungalHealthConfig from '~/data/forms/fungalHealthConfig.json';

// Marketing form config
import marketingConfig from '~/data/forms/marketingConfig.json';

// Category to Product Tag mapping
// Maps the category name used in URLs/forms to the actual product tag in Care360
const categoryToProductTag: Record<string, string> = {
  'branded weight loss': 'weightloss',
  'weight loss': 'weightloss',
  'weight loss product': 'weightloss',
  'weightloss': 'weightloss',
  
  'skin care': 'skin care',
  'skincare': 'skin care',
  
  "men's health": 'sexual health',
  'mens health': 'sexual health',
  'sexual health': 'sexual health',
  
  'wellness': 'anti-aging & peptides',
  'anti-aging & peptides': 'anti-aging & peptides',
  'anti-aging': 'anti-aging & peptides',
  
  'fungal health': 'fungal health',
  'foot & nail health': 'foot & nail health',
  'antifungal': 'foot & nail health',
  
  'hair growth': 'hair growth', // No matching tag found yet, keeping as-is
};

// Get product tag for a given category
const getProductTagForCategory = (category?: string): string | null => {
  if (!category) return null;
  const normalizedCategory = category.toLowerCase().trim();
  return categoryToProductTag[normalizedCategory] || null;
};

// Mapping of categories to form configurations
const categoryFormConfigs: Record<string, any> = {
  // Weight Loss - matches "Weightloss" tag from Care360
  'weightloss': weightLossConfig,
  'weight loss': weightLossConfig,
  'weight loss product': weightLossConfig,
  'branded weight loss': weightLossConfig,
  
  // Hair Growth - no matching tag found yet
  'hair growth': hairGrowthConfig,
  
  // Skin Care - matches "Skin Care" tag from Care360
  'skin care': skinCareConfig,
  'skincare': skinCareConfig,
  
  // Men's Health / Sexual Health - matches "Sexual Health" tag from Care360
  "men's health": mensHealthConfig,
  'mens health': mensHealthConfig,
  'sexual health': mensHealthConfig,
  
  // Wellness / Anti-Aging - matches "Anti-Aging & Peptides" tag from Care360
  wellness: wellnessConfig,
  'anti-aging & peptides': wellnessConfig,
  'anti-aging': wellnessConfig,
  
  // Fungal Health - matches "Foot & Nail Health" tag from Care360
  'fungal health': fungalHealthConfig,
  'foot & nail health': fungalHealthConfig,
  'antifungal': fungalHealthConfig,
  
  default: weightLossConfig,
};

// Get current form config based on category
const getCurrentFormConfig = (category?: string) => {
  if (!category) {
    return categoryFormConfigs['default'];
  }

  // Normalize category (lowercase, trim)
  const normalizedCategory = category.toLowerCase().trim();

  // Return matching config or default
  return (
    categoryFormConfigs[normalizedCategory] || categoryFormConfigs['default']
  );
};

// Validate if a category exists in the configuration
const isCategoryValid = (category: string): boolean => {
  if (!category) return false;
  const normalizedCategory = category.toLowerCase().trim();
  return categoryFormConfigs[normalizedCategory] !== undefined;
};

export { marketingConfig, getCurrentFormConfig, isCategoryValid, getProductTagForCategory };
