import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  FirestoreError 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Budget } from '../types/budget';

const BUDGET_DOC_ID = 'budget-data';

/**
 * Service for managing budget data in Firebase Firestore
 */
export class FirebaseService {
  /**
   * Get budget data from Firestore
   */
  static async getBudget(): Promise<Budget | null> {
    try {
      const docRef = doc(db, 'budget', BUDGET_DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Budget;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting budget:', error);
      throw error;
    }
  }

  /**
   * Save budget data to Firestore
   */
  static async saveBudget(budget: Budget): Promise<void> {
    try {
      const docRef = doc(db, 'budget', BUDGET_DOC_ID);
      console.log('Saving budget to Firestore:', {
        categories: budget.categories.length,
        expenses: budget.expenses.length,
        savings: budget.savings.length,
        longTermGoals: budget.longTermGoals.length
      });
      await setDoc(docRef, budget, { merge: true });
      console.log('Budget saved successfully to Firestore');
    } catch (error) {
      console.error('Error saving budget to Firestore:', error);
      throw error;
    }
  }

  /**
   * Update budget data in Firestore
   */
  static async updateBudget(updates: Partial<Budget>): Promise<void> {
    try {
      const docRef = doc(db, 'budget', BUDGET_DOC_ID);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time budget updates
   */
  static subscribeToBudget(
    callback: (budget: Budget | null) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const docRef = doc(db, 'budget', BUDGET_DOC_ID);
    
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as Budget);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to budget:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }
}

