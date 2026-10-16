export type ServingUnit = 'per100g' | 'per100ml';

export interface NutrientData {
  energy_kcal?: number;
  sugar_g?: number;
  added_sugar_g?: number;
  saturated_fat_g?: number;
  total_fat_g?: number;
  sodium_mg?: number; // always normalized to milligrams
  fiber_g?: number;
  protein_g?: number;
  carbs_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  caffeine_mg?: number;
  [key: string]: number | undefined;
}

export interface Product {
  barcode?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  source: 'openfoodfacts' | 'ocr' | 'manual';
  servingUnit: ServingUnit;
  servingSize?: string; // e.g. "30g" or "250ml"
  nutrients: NutrientData;
  ingredients: string[]; // extracted array of ingredient strings
  ingredientsRaw?: string; // raw ingredients text
  allergenTags: string[]; // e.g. ["en:milk", "en:gluten"]
  tracesTags: string[]; // e.g. ["en:peanuts", "en:nuts"]
  additives: string[];
  novaGroup?: number;
  nutriscoreGrade?: string;
  category?: string;
}
