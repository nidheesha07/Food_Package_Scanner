export type VerdictLevel = 'green' | 'yellow' | 'red' | 'insufficient_data';

export type RuleVerdict = 'green' | 'yellow' | 'red' | 'unknown';

export interface AllergenMatch {
  allergen: string;
  synonym: string;
  foundIn: string; // e.g. "Ingredient: Casein" or "OFF Allergen Tag: en:milk"
}

export interface TracesWarning {
  allergen: string;
  source: string; // e.g. "Traces statement: en:hazelnut"
}

export interface RuleResult {
  ruleId: string;
  condition: string;
  nutrient: string;
  actualValue: number | null; // null if missing
  limitValue: number;
  unit: string;
  verdict: RuleVerdict;
  message: string;
  isInformational?: boolean; // T1D total carbs
  softWarning?: boolean; // Pregnancy undetectable items
}

export interface Alternative {
  name: string;
  type: 'generic' | 'product';
  description?: string;
  barcode?: string;
  verdict?: VerdictLevel;
}

export interface VerdictResult {
  overall: VerdictLevel;
  score: number; // 0-100
  allergenMatches: AllergenMatch[];
  tracesWarnings: TracesWarning[];
  ruleResults: RuleResult[];
  avoidIngredients: string[];
  missingNutrients: string[];
  softWarnings: string[];
  consequences: string[];
  alternatives?: Alternative[];
  rulesVersion: string;
}
