export type Product = Readonly<{
  id: string;
  name: string;
  priceCents: number;
}>;

export type CartItem = Readonly<{
  productId: string;
  quantity: number;
}>;

export type Cart = Readonly<{
  items: readonly CartItem[];
  couponCode?: string;
}>;

export type AuthenticatedUser = Readonly<{
  id: string;
  email: string;
}>;

export type AccessToken = Readonly<{
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}>;

export type Coupon = Readonly<{
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumSubtotalCents: number;
  expiresAt?: string;
}>;

export type CouponApplication = Readonly<{
  code: string;
  discountCents: number;
}>;

export type OrderSummary = Readonly<{
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  couponCode?: string;
  couponDiscountCents: number;
  totalCents: number;
}>;
