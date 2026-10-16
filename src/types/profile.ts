export type LifeStage = 'pcos' | 'pregnancy' | 'breastfeeding';

export type DiabetesType = 'none' | 'type1' | 'type2';

export type Allergen =
  | 'peanuts'
  | 'tree_nuts'
  | 'milk'
  | 'eggs'
  | 'soy'
  | 'wheat_gluten'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export interface HealthProfile {
  id: string; // auth.uid() or local UUID for guest
  displayName: string | null;
  email?: string | null;
  isAnonymous?: boolean;
  lifeStages: LifeStage[];
  diabetesType: DiabetesType;
  lactoseIntolerant: boolean;
  allergies: Allergen[];
  customAllergies: string[];
  consentGiven: boolean;
  createdAt: string;
  updatedAt: string;
}

export const COMMON_ALLERGENS: { id: Allergen; label: string; icon: string }[] = [
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'tree_nuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'milk', label: 'Milk / Dairy', icon: '🥛' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'wheat_gluten', label: 'Wheat / Gluten', icon: '🌾' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'sesame', label: 'Sesame', icon: '🌱' },
];
