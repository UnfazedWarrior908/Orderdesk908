export function calculateItemAmounts(
  quantity: number,
  rate: number,
  discountType: 'percent' | 'fixed',
  discountValue: number
): {
  grossAmount: number;
  discountAmount: number;
  amount: number;
  validDiscountValue: number;
} {
  const qty = Math.max(0, quantity);
  const r = Math.max(0, rate);
  const gross = Math.round(qty * r * 100) / 100;

  let val = isNaN(discountValue) ? 0 : Math.max(0, discountValue);

  let discount = 0;
  if (discountType === 'percent') {
    val = Math.min(100, val); // Max 100%
    discount = (gross * val) / 100;
  } else {
    // Fixed Rs. discount
    discount = Math.min(gross, val); // Capped at gross
  }

  discount = Math.round(discount * 100) / 100;
  const net = Math.max(0, Math.round((gross - discount) * 100) / 100);

  return {
    grossAmount: gross,
    discountAmount: discount,
    amount: net,
    validDiscountValue: val,
  };
}
