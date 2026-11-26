export function calculateDiscount(subtotalCents: number): number {
  return subtotalCents >= 5000 ? Math.floor((subtotalCents * 10) / 100) : 0;
}
