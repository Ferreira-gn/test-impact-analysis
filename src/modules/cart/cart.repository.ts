import type { Cart, CartItem } from '../../shared/types/domain.js';

export class CartRepository {
  private items: CartItem[] = [];

  public get(): Cart {
    return { items: this.items.map((item) => ({ ...item })) };
  }

  public replace(items: readonly CartItem[]): Cart {
    this.items = items.map((item) => ({ ...item }));
    return this.get();
  }

  public clear(): void {
    this.items = [];
  }
}
