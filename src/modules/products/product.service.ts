import { AppError } from '../../shared/errors/app-error.js';
import type { Product } from '../../shared/types/domain.js';
import type { ProductRepository } from './product.repository.js';

export class ProductService {
  public constructor(private readonly repository: ProductRepository) {}

  public list(): readonly Product[] {
    return this.repository.list();
  }

  public getById(id: string): Product {
    const product = this.repository.findById(id);
    if (!product)
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    return product;
  }
}
