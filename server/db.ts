import { getDatabase } from "./utils/mongodb";
import type { Db } from "mongodb";

/**
 * Get the database instance (synchronous wrapper for compatibility)
 * Note: This function should be used in async contexts only
 */
export async function getDb(): Promise<Db> {
  return await getDatabase();
}
