import { Product } from '../types/product';
import { HealthProfile } from '../types/profile';
import { Alternative } from '../types/verdict';
import { normalizeOffProduct } from '../engine/unitNormalizer';
import { runVerdictEngine } from '../engine/verdictEngine';

const USER_AGENT = 'SHEScan/1.0 (contact@shescan.app)';

export async function fetchVerifiedGreenAlternatives(
  categoryTag: string,
  profile: HealthProfile
): Promise<Alternative[]> {
  if (!categoryTag || !categoryTag.trim()) return [];

  try {
    const cleanTag = encodeURIComponent(categoryTag.trim());
    const url = `https://world.openfoodfacts.org/category/${cleanTag}.json?page_size=6`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const products: any[] = data.products || [];

    const greenAlternatives: Alternative[] = [];

    for (const raw of products) {
      const normalized = normalizeOffProduct(raw);
      const verdict = runVerdictEngine(normalized, profile);

      if (verdict.overall === 'green') {
        greenAlternatives.push({
          name: normalized.name,
          type: 'product',
          barcode: normalized.barcode,
          verdict: 'green',
          description: `${normalized.brand ? normalized.brand + ' • ' : ''}Sugar: ${normalized.nutrients.sugar_g ?? 0}g, Sodium: ${normalized.nutrients.sodium_mg ?? 0}mg`,
        });
      }

      if (greenAlternatives.length >= 3) break;
    }

    return greenAlternatives;
  } catch {
    return [];
  }
}
