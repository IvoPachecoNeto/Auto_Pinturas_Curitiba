import Dexie, { Table } from 'dexie';
import { Budget } from '../types';

// Define the Database Class
class AutoPinturasDB extends Dexie {
  budgets!: Table<Budget, number>; // Table<Type, KeyType>

  constructor() {
    super('AutoPinturasDB');
    // Define schema
    // ++id means auto-incrementing primary key
    // We index fields we might want to search by later for performance
    this.version(1).stores({
      budgets: '++id, clientData.name, clientData.plate, createdAt'
    });
  }
}

// Initialize the database
const dbInstance = new AutoPinturasDB();

// Export an API wrapper to keep the rest of the app clean
export const db = {
  // Get all budgets, ordered by ID descending (newest first)
  getAll: async (): Promise<Budget[]> => {
    return await dbInstance.budgets.orderBy('id').reverse().toArray();
  },

  // Get a single budget by ID
  getById: async (id: number): Promise<Budget | undefined> => {
    return await dbInstance.budgets.get(id);
  },

  // Save (Create or Update)
  save: async (budget: Omit<Budget, 'id'> | Budget): Promise<Budget> => {
    // We need to cast because we might pass a budget without an ID (new), 
    // but the DB will return one with an ID.
    const id = await dbInstance.budgets.put(budget as Budget);
    
    // Return the full object with the new/existing ID
    return { ...budget, id } as Budget;
  },

  // Delete a budget
  delete: async (id: number): Promise<void> => {
    await dbInstance.budgets.delete(id);
  },

  // Export all data to JSON string
  exportData: async (): Promise<string> => {
    const allBudgets = await dbInstance.budgets.toArray();
    return JSON.stringify(allBudgets);
  },

  // Import data from JSON string
  importData: async (jsonString: string): Promise<number> => {
    try {
      const data: Budget[] = JSON.parse(jsonString);
      if (!Array.isArray(data)) throw new Error("Arquivo inválido");
      
      // Bulk add (or put to overwrite if IDs match)
      // using bulkPut so if ID exists it updates, if not it creates
      await dbInstance.budgets.bulkPut(data);
      return data.length;
    } catch (error) {
      console.error("Import failed", error);
      throw error;
    }
  }
};