import { AppError } from '../../shared/errors/app-error.js';
import type { Cart } from '../../shared/types/domain.js';
import type { ProductService } from '../products/product.service.js';
import type { CartRepository } from './cart.repository.js';

const MAX_QUANTITY = 20;

export class CartService {
  public constructor(
    private readonly repository: CartRepository,
    private readonly products: ProductService,
  ) {}

  public get(): Cart {
    return this.repository.get();
  }

  public add(productId: string, quantity: number): Cart {
    this.validateQuantity(quantity);
    this.products.getById(productId);
    const current = this.repository.get().items;
    const existing = current.find((item) => item.productId === productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    this.validateQuantity(nextQuantity);
    const next = existing
      ? current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: nextQuantity }
            : item,
        )
      : [...current, { productId, quantity }];
    return this.repository.replace(next);
  }

  public update(productId: string, quantity: number): Cart {
    this.validateQuantity(quantity);
    this.products.getById(productId);
    const current = this.repository.get().items;
    if (!current.some((item) => item.productId === productId))
      throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
    return this.repository.replace(
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  public remove(productId: string): Cart {
    const current = this.repository.get().items;
    if (!current.some((item) => item.productId === productId))
      throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
    return this.repository.replace(
      current.filter((item) => item.productId !== productId),
    );
  }

  private validateQuantity(quantity: number): void {
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      throw new AppError(
        `Quantity must be an integer between 1 and ${MAX_QUANTITY}`,
        400,
        'INVALID_QUANTITY',
      );
    }
  }
}
