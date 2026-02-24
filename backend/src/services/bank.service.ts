import { getDatabase } from '../config/database.js';
import { Bank } from '../models/bank.model.js';

export async function getAvailableBanks(): Promise<Bank[]> {
  const db = getDatabase();
  const banksCollection = db.collection<Bank>('banks');

  const banks = await banksCollection
    .find({ used: false })
    .sort({ title: 1 })
    .toArray();

  return banks;
}

export async function getBankById(bankId: string): Promise<Bank | null> {
  const db = getDatabase();
  const banksCollection = db.collection<Bank>('banks');

  return banksCollection.findOne({ bankId });
}

export async function markBankAsUsed(bankId: string): Promise<void> {
  const db = getDatabase();
  const banksCollection = db.collection<Bank>('banks');

  await banksCollection.updateOne({ bankId }, { $set: { used: true } });
}
