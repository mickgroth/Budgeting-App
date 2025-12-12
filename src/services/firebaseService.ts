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

/**
 * Service for managing budget data in Firebase Firestore
 * Each user has their own budget document
 */
export class FirebaseService {
  /**
   * Remove undefined values from an object (Firestore doesn't allow undefined)
   * Recursively cleans nested objects and arrays
   */
  private static removeUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item)) as T;
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.removeUndefined(obj[key]);
        }
      }
      return cleaned as T;
    }

    return obj;
  }

  /**
   * Get budget data from Firestore for a specific user
   */
  static async getBudget(userId: string): Promise<Budget | null> {
    try {
      const docRef = doc(db, 'budgets', userId);
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
   * Save budget data to Firestore for a specific user
   */
  static async saveBudget(userId: string, budget: Budget): Promise<void> {
    try {
      const docRef = doc(db, 'budgets', userId);
      
      // Log budget info - handle both old and new structure
      const logInfo: any = {
        salaryIncome: budget.salaryIncome,
        savings: budget.savings?.length || 0,
        longTermGoals: budget.longTermGoals?.length || 0,
      };
      
      // New unified structure
      if (budget.months && Array.isArray(budget.months)) {
        logInfo.months = budget.months.length;
        logInfo.structure = 'unified';
      } 
      // Old structure (for backward compatibility)
      else if (budget.categories && budget.expenses) {
        logInfo.categories = budget.categories.length;
        logInfo.expenses = budget.expenses.length;
        logInfo.structure = 'legacy';
      }
      
      console.log('Saving budget to Firestore for user:', userId, logInfo);
      
      // Remove undefined values (Firestore doesn't allow them)
      const cleanedBudget = this.removeUndefined(budget);
      
      await setDoc(docRef, cleanedBudget, { merge: true });
      console.log('Budget saved successfully to Firestore');
    } catch (error) {
      console.error('Error saving budget to Firestore:', error);
      throw error;
    }
  }

  /**
   * Update budget data in Firestore for a specific user
   */
  static async updateBudget(userId: string, updates: Partial<Budget>): Promise<void> {
    try {
      const docRef = doc(db, 'budgets', userId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time budget updates for a specific user
   */
  static subscribeToBudget(
    userId: string,
    callback: (budget: Budget | null) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const docRef = doc(db, 'budgets', userId);
    
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

