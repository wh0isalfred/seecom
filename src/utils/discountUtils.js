/**
 * Priority: per-product discount_price > global discount % > regular price
 */
export const getEffectivePrice = (product, globalDiscount) => {
  if (product.discount_price && product.discount_price < product.price) {
    return product.discount_price;
  }
  if (globalDiscount?.active && globalDiscount?.percent > 0) {
    return Math.round(product.price * (1 - globalDiscount.percent / 100));
  }
  return product.price;
};

export const getDiscountLabel = (product, globalDiscount) => {
  if (product.discount_price && product.discount_price < product.price) {
    const pct = Math.round((1 - product.discount_price / product.price) * 100);
    return `-${pct}%`;
  }
  if (globalDiscount?.active && globalDiscount?.percent > 0) {
    return `-${globalDiscount.percent}%`;
  }
  return null;
};

export const isDiscounted = (product, globalDiscount) =>
  (product.discount_price && product.discount_price < product.price) ||
  (globalDiscount?.active && globalDiscount?.percent > 0);
