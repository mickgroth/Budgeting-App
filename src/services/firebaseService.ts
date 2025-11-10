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
      console.log('Saving budget to Firestore for user:', userId, {
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

