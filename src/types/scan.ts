import { Product } from './product';
import { VerdictResult } from './verdict';

export type ScanSource = 'openfoodfacts' | 'ocr' | 'manual';

export interface ScanRecord {
  id: string;
  userId: string;
  barcode?: string;
  source: ScanSource;
  product: Product;
  verdict: VerdictResult;
  explanation: string | null;
  rulesVersion: string;
  scannedAt: string;
}
