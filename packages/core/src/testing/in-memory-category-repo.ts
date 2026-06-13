import type { Category } from "@upshot/contracts";
import type { CategoryRepo } from "../ports/category-repo";

export class InMemoryCategoryRepo implements CategoryRepo {
  private readonly store = new Map<string, Category>();

  async upsert(category: Category): Promise<void> {
    this.store.set(category.id, { ...category });
  }

  async list(): Promise<Category[]> {
    return [...this.store.values()];
  }
}
