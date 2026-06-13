import type { Category } from "@upshot/contracts";

export interface CategoryRepo {
  upsert(category: Category): Promise<void>;
  list(): Promise<Category[]>;
}
