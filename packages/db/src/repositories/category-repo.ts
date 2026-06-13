import type { CategoryRepo } from "@upshot/core";
import type { Category } from "@upshot/contracts";
import type { DbClient } from "../client";
import { categories } from "../schema";

export class DrizzleCategoryRepo implements CategoryRepo {
  constructor(private readonly db: DbClient) {}

  async upsert(category: Category): Promise<void> {
    this.db.insert(categories).values(category)
      .onConflictDoUpdate({ target: categories.id, set: { name: category.name, parentId: category.parentId } })
      .run();
  }

  async list(): Promise<Category[]> {
    return this.db.select().from(categories).all();
  }
}
