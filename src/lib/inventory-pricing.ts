export type InventoryPricingInput = {
  cost: number;
  operating_cost: number;
  profit_margin: number;
  seller_markup_percentage?: number;
};

export function normalizePercentage(value: number | string | null | undefined) {
  const rawValue = Math.max(0, Number(value) || 0);
  return rawValue >= 1 ? rawValue / 100 : rawValue;
}

export function calculateBaseSalePrice(input: Pick<InventoryPricingInput, "cost" | "operating_cost" | "profit_margin">) {
  const totalCost = Math.max(0, Number(input.cost) || 0) + Math.max(0, Number(input.operating_cost) || 0);
  const margin = Math.max(0, Number(input.profit_margin) || 0);

  if (margin <= 0) {
    return Number(totalCost.toFixed(2));
  }

  const normalizedMargin = normalizePercentage(margin);
  if (normalizedMargin >= 1) {
    return Number(totalCost.toFixed(2));
  }

  const divisor = 1 - normalizedMargin;
  if (divisor <= 0) {
    return Number(totalCost.toFixed(2));
  }

  return Number((totalCost / divisor).toFixed(2));
}

export function roundUpToNearestHalf(value: number) {
  return Math.ceil(Math.max(0, Number(value) || 0) * 2) / 2;
}

export function calculateFinalSalePrice(
  input: Pick<InventoryPricingInput, "cost" | "operating_cost" | "profit_margin" | "seller_markup_percentage">
) {
  const baseSalePrice = calculateBaseSalePrice(input);
  const sellerMarkup = normalizePercentage(input.seller_markup_percentage);
  const markedUpPrice = baseSalePrice * (1 + sellerMarkup);

  return roundUpToNearestHalf(markedUpPrice);
}