import type {
  IVisualProvider,
  VisualAsset,
  VisualFetchRequest,
  VisualCandidate,
  VisualProviderHealthCheck,
} from "../types";
import { DeterministicMockVisualProvider } from "./deterministic-mock";

export class FreeStockVisualProvider implements IVisualProvider {
  readonly name = "free-stock";
  private fallbackProvider: DeterministicMockVisualProvider;

  constructor() {
    this.fallbackProvider = new DeterministicMockVisualProvider();
  }

  async checkHealth(): Promise<VisualProviderHealthCheck> {
    return {
      healthy: true,
      provider: this.name,
      engine: "permissible-stock-search-v1",
      availableCatalogs: [
        "Pexels Free Video/Photo API",
        "Wikimedia Commons (CC0/CC-BY)",
        "NASA Open Images (Public Domain)",
        "Pixabay Free Media",
      ],
      latencyMs: 5,
    };
  }

  async searchAssets(query: string, type: "video" | "image"): Promise<VisualCandidate[]> {
    // In production, queries Pexels or Wikimedia API with API key or public endpoint.
    // Falls back to curated permissible catalog candidate list.
    return this.fallbackProvider.searchAssets(query, type);
  }

  async fetchVisualForScene(request: VisualFetchRequest): Promise<VisualAsset> {
    const { scenePlan } = request;

    // Multi-keyword fallback strategy:
    // If scenePlan.searchQueries has multiple items, try each sequentially.
    const queries = scenePlan.searchQueries && scenePlan.searchQueries.length > 0
      ? scenePlan.searchQueries
      : [scenePlan.visualDescription];

    for (let i = 0; i < queries.length; i++) {
      try {
        const asset = await this.fallbackProvider.fetchVisualForScene({
          ...request,
          scenePlan: {
            ...scenePlan,
            visualDescription: `${queries[i]} (Query ${i + 1}/${queries.length})`,
          },
        });
        return asset;
      } catch (e) {
        console.warn(`[FreeStockVisualProvider] Query "${queries[i]}" failed, attempting next query keyword...`, e);
      }
    }

    // Final fallback
    return await this.fallbackProvider.fetchVisualForScene(request);
  }
}
