// Form configurations
import weightLossConfig from '~/data/forms/weightLossConfig.json';
import hairGrowthConfig from '~/data/forms/hairGrowthConfig.json';
import skinCareConfig from '~/data/forms/skinCareConfig.json';
import mensHealthConfig from '~/data/forms/mensHealthConfig.json';
import wellnessConfig from '~/data/forms/wellnessConfig.json';

// Marketing form config
import marketingConfig from '~/data/forms/marketingConfig.json';

// Mapping of categories to form configurations
const categoryFormConfigs: Record<string, any> = {
  // Add more category mappings here as needed
  'hair growth': hairGrowthConfig,
  'skin care': skinCareConfig,
  "men's health": mensHealthConfig,
  'weight loss product': weightLossConfig,
  wellness: wellnessConfig,
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

export { marketingConfig, getCurrentFormConfig, isCategoryValid };
