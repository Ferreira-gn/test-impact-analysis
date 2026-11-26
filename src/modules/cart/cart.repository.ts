import type { Cart, CartItem } from '../../shared/types/domain.js';

export class CartRepository {
  private items: CartItem[] = [];
  private couponCode: string | undefined;

  public get(): Cart {
    return {
      items: this.items.map((item) => ({ ...item })),
      ...(this.couponCode ? { couponCode: this.couponCode } : {}),
    };
  }

  public replace(items: readonly CartItem[]): Cart {
    this.items = items.map((item) => ({ ...item }));
    return this.get();
  }

  public clear(): void {
    this.items = [];
    this.couponCode = undefined;
  }

  public setCoupon(code: string): Cart {
    this.couponCode = code;
    return this.get();
  }

  public clearCoupon(): Cart {
    this.couponCode = undefined;
    return this.get();
  }
}
