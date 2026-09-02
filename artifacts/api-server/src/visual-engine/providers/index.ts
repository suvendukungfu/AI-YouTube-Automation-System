import type { IVisualProvider } from "../types";
import { DeterministicMockVisualProvider } from "./deterministic-mock";
import { FreeStockVisualProvider } from "./free-stock";

export * from "./deterministic-mock";
export * from "./free-stock";

export function getVisualProvider(preferredProvider?: string): IVisualProvider {
  const providerType = preferredProvider || process.env.VISUAL_PROVIDER || "free-stock";

  switch (providerType.toLowerCase()) {
    case "deterministic-mock":
    case "mock":
      return new DeterministicMockVisualProvider();
    case "free-stock":
    case "pexels":
    default:
      return new FreeStockVisualProvider();
  }
}
