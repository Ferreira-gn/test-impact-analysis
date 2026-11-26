export function calculateTotal(
  subtotalCents: number,
  discountCents: number,
): number {
  if (
    !Number.isSafeInteger(subtotalCents) ||
    !Number.isSafeInteger(discountCents)
  )
    throw new Error('Money values must be safe integers');
  if (subtotalCents < 0 || discountCents < 0 || discountCents > subtotalCents)
    throw new Error('Invalid monetary values');
  return subtotalCents - discountCents;
}
