export interface RoutineStep {
  stepNumber: number;
  category: string;
  action: string;
  productsOrIngredients: string;
}

export interface TargetIngredient {
  name: string;
  purpose: string;
  howToUse: string;
}

export interface RecommendedProduct {
  category: string;
  productName: string;
  activeIngredients: string;
  advice: string;
}

export interface SkinScanResult {
  skinType: string;
  skinTypeDescription: string;
  detectedConcerns: string[];
  concernAnalysis: string;
  morningRoutine: RoutineStep[];
  nightRoutine: RoutineStep[];
  targetIngredients: TargetIngredient[];
  recommendedProducts: RecommendedProduct[];
  lifestyleTips: string[];
  analysisDate: string;
}

export interface CuratedLookPiece {
  item: string;
  styleTip: string;
}

export interface CuratedLook {
  name: string;
  description: string;
  pieces: CuratedLookPiece[];
  accessories: string[];
  colorPalette: string[];
}

export interface StyleSuggestionResult {
  bodyType: string;
  styleVibe: string;
  occasion: string;
  analysis: string;
  curatedLooks: CuratedLook[];
  keyTrends: string[];
  styleDos: string[];
  styleDonts: string[];
  recommendationDate: string;
}

export interface SavedLook {
  id: string;
  title: string;
  bodyType: string;
  styleVibe: string;
  occasion: string;
  result: StyleSuggestionResult;
  savedAt: string;
}

export interface SavedScan {
  id: string;
  imageUrl?: string;
  result: SkinScanResult;
  savedAt: string;
}
