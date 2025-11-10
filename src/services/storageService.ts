import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import app from '../config/firebase';

const storage = getStorage(app);

/**
 * Service for managing file uploads to Firebase Storage
 */
export class StorageService {
  /**
   * Upload a receipt image to Firebase Storage
   * @param userId - The user's ID
   * @param expenseId - The expense ID (used for file naming)
   * @param imageData - Base64 data URL or Blob
   * @returns The download URL for the uploaded image
   */
  static async uploadReceiptImage(
    userId: string, 
    expenseId: string, 
    imageData: string | Blob
  ): Promise<string> {
    try {
      // Convert base64 to blob if needed
      let blob: Blob;
      if (typeof imageData === 'string') {
        // Convert base64 data URL to blob
        const response = await fetch(imageData);
        blob = await response.blob();
      } else {
        blob = imageData;
      }

      // Create a reference to the storage location
      // Path: receipts/{userId}/{expenseId}.jpg
      const storageRef = ref(storage, `receipts/${userId}/${expenseId}.jpg`);
      
      console.log('Uploading receipt to Firebase Storage:', storageRef.fullPath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Receipt uploaded successfully:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  }

  /**
   * Delete a receipt image from Firebase Storage
   * @param receiptURL - The full download URL of the receipt
   */
  static async deleteReceiptImage(receiptURL: string): Promise<void> {
    try {
      // Extract the storage path from the URL
      const url = new URL(receiptURL);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        console.warn('Could not extract path from URL:', receiptURL);
        return;
      }
      
      const path = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, path);
      
      console.log('Deleting receipt from Firebase Storage:', path);
      
      await deleteObject(storageRef);
      
      console.log('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      // Don't throw - deletion failures shouldn't block expense deletion
    }
  }

  /**
   * Check if a URL is a Firebase Storage URL (vs Base64)
   */
  static isStorageURL(url: string): boolean {
    return url.startsWith('https://') || url.startsWith('http://');
  }
}
