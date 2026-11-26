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
}>;

export type OrderSummary = Readonly<{
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}>;
