type PromotionLike = {
  price: number;
  oldPrice?: number | null;
  stock?: number | null;
};

export function hasActivePromotion(product: PromotionLike | null | undefined): boolean {
  if (!product) {
    return false;
  }

  return typeof product.oldPrice === "number"
    && Number.isFinite(product.oldPrice)
    && product.oldPrice > product.price;
}

export function getPromotionDiscountPercent(product: PromotionLike | null | undefined): number {
  if (!product || !hasActivePromotion(product) || !product.oldPrice) {
    return 0;
  }

  return Math.round((1 - product.price / product.oldPrice) * 100);
}

export function getPromotionSavings(product: PromotionLike | null | undefined): number {
  if (!product || !hasActivePromotion(product) || !product.oldPrice) {
    return 0;
  }

  return Math.max(0, product.oldPrice - product.price);
}

export function getPromotionStockSavings(product: PromotionLike | null | undefined): number {
  if (!product) {
    return 0;
  }

  const stock = typeof product.stock === "number" && Number.isFinite(product.stock)
    ? Math.max(0, Math.floor(product.stock))
    : 0;

  return getPromotionSavings(product) * stock;
}
