// In-memory storage (replaces Redis)
// Simple Maps for fast, ephemeral storage

const storage = new Map<string, string>();

export const memoryStore = {
  async get(key: string): Promise<string | null> {
    return storage.get(key) || null;
  },

  async set(key: string, value: string): Promise<void> {
    storage.set(key, value);
  },

  async del(key: string): Promise<void> {
    storage.delete(key);
  },

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching: "user:*" matches all keys starting with "user:"
    const prefix = pattern.replace('*', '');
    const allKeys = Array.from(storage.keys());
    return allKeys.filter(key => key.startsWith(prefix));
  },

  // Utility for debugging
  size(): number {
    return storage.size;
  },

  clear(): void {
    storage.clear();
  }
};

export async function initializeMemoryStore(): Promise<void> {
  console.log('✅ In-memory storage initialized');
}
