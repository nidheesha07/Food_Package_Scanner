import { Product } from '../types/product';
import { normalizeOffProduct } from '../engine/unitNormalizer';

const USER_AGENT = 'SHEScan/1.0 (contact@shescan.app)';
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';

// In-memory session cache to prevent redundant network requests
const productMemoryCache = new Map<string, Product>();

export interface FetchProductResult {
  product: Product | null;
  status: 'success' | 'not_found' | 'network_error' | 'rate_limited';
  error?: string;
}

export async function fetchProductByBarcode(barcode: string): Promise<FetchProductResult> {
  const cleanBarcode = barcode.trim();

  // 1. Check memory cache first
  if (productMemoryCache.has(cleanBarcode)) {
    return {
      product: productMemoryCache.get(cleanBarcode)!,
      status: 'success',
    };
  }

  // 2. Check offline status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      product: null,
      status: 'network_error',
      error: 'Device is offline. Internet connection required to query product database.',
    };
  }

  try {
    const response = await fetch(`${OFF_API_BASE}/${cleanBarcode}.json`, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return { product: null, status: 'not_found' };
    }

    if (response.status === 429) {
      return {
        product: null,
        status: 'rate_limited',
        error: 'Open Food Facts is receiving too many requests. Please wait a moment.',
      };
    }

    if (!response.ok) {
      return {
        product: null,
        status: 'network_error',
        error: `Product server returned error ${response.status}`,
      };
    }

    const json = await response.json();

    if (!json || json.status === 0 || !json.product) {
      return { product: null, status: 'not_found' };
    }

    const normalized = normalizeOffProduct(json.product);
    productMemoryCache.set(cleanBarcode, normalized);

    return {
      product: normalized,
      status: 'success',
    };
  } catch (err: any) {
    return {
      product: null,
      status: 'network_error',
      error: err.message || 'Unable to connect to Open Food Facts database.',
    };
  }
}
