import Dexie, { Table } from 'dexie';
import { Supplier, Product } from '../types';

export class CantonDatabase extends Dexie {
  suppliers!: Table<Supplier, number>;
  products!: Table<Product, number>;

  constructor() {
    super('CantonFairOS_DB');
    this.version(1).stores({
      suppliers: '++id, syncId, phase, hall, standNumber, companyName, rating, createdAt',
      products: '++id, syncId, supplierId, name, category, hsCode, ncm, fobPrice, innovationScore, dtcFitScore, createdAt'
    });
  }
}

export const db = new CantonDatabase();
