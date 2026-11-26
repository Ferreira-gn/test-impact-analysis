import type { Product } from '../../shared/types/domain.js';

const initialProducts: readonly Product[] = [
  { id: 'coffee', name: 'Café especial', priceCents: 2490 },
  { id: 'tea', name: 'Chá verde', priceCents: 1590 },
  { id: 'mug', name: 'Caneca térmica', priceCents: 4990 },
  { id: 'cookie', name: 'Cookie artesanal', priceCents: 890 },
];

export class ProductRepository {
  public list(): readonly Product[] {
    return initialProducts;
  }

  public findById(id: string): Product | undefined {
    return initialProducts.find((product) => product.id === id);
  }
}
