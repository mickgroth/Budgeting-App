import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import heic2any from 'heic2any';
import { BudgetCategory } from '../types/budget';
import { formatCurrency, generateId } from '../utils/budgetHelpers';
import { StorageService } from '../services/storageService';

interface AddExpenseScreenProps {
  userId: string;
  categories: BudgetCategory[];
  onAddExpense: (categoryId: string, amount: number, description: string, receiptImage?: string, isRecurring?: boolean) => void;
  onBack: () => void;
}

/**
 * Screen for logging new expenses with receipt scanning
 */
export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  userId,
  categories,
  onAddExpense,
  onBack,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  /**
   * Extract merchant/vendor name from OCR text
   */
  const extractMerchantName = (text: string): string | null => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Analyzing lines for merchant name:', lines.slice(0, 15));

    // Known merchant patterns (case-insensitive)
    const knownMerchants = [
      /fedex\s*(ground|express|office)?/i,
      /ups\s*(store)?/i,
      /usps/i,
      /starbucks/i,
      /walmart/i,
      /target/i,
      /costco/i,
      /amazon/i,
      /mcdonald'?s/i,
      /burger\s*king/i,
      /subway/i,
      /pizza\s*hut/i,
      /domino'?s/i,
      /whole\s*foods/i,
      /safeway/i,
      /kroger/i,
      /cvs/i,
      /walgreens/i,
      /home\s*depot/i,
      /lowes/i,
      /staples/i,
      /office\s*depot/i,
      /best\s*buy/i,
    ];

    // First, look for known merchants in the text
    for (const line of lines.slice(0, 20)) {
      for (const merchantPattern of knownMerchants) {
        const match = line.match(merchantPattern);
        if (match) {
          const merchantName = match[0].trim();
          // Capitalize properly
          const formatted = merchantName
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          console.log('Found known merchant:', formatted);
          return formatted;
        }
      }
    }

    // Quality check function - filters out OCR noise
    const isValidMerchantLine = (line: string): boolean => {
      // Skip if too short or too long
      if (line.length < 3 || line.length > 50) return false;
      
      // Skip if mostly special characters or numbers
      const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount < line.length * 0.5) return false;
      
      // Skip lines with price patterns
      if (/\$\s*\d+[\.,]\d{2}/.test(line)) return false;
      
      // Skip lines that look like addresses
      if (/\d{3,5}\s+\w+/.test(line) || /\d{5}/.test(line)) return false;
      
      // Skip dates
      if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line)) return false;
      
      // Skip phone numbers
      if (/\d{3}[-.)]\d{3}[-.)]\d{4}/.test(line)) return false;
      
      // Skip common receipt headers
      if (/receipt|invoice|bill|subtotal|tax|total/i.test(line)) return false;
      
      return true;
    };

    // Look for properly capitalized business names (2-4 words starting with capitals)
    const businessNamePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})$/;
    
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];
      
      if (!isValidMerchantLine(line)) continue;
      
      const match = line.match(businessNamePattern);
      if (match) {
        const name = match[1].trim();
        console.log('Found formatted merchant name:', name);
        return name;
      }
    }

    // Look for lines with business suffixes
    const businessSuffixPattern = /([A-Z][A-Za-z\s&'-]{2,40})\s*(Inc\.?|LLC|Corp\.?|Ltd\.?|Company|Co\.)/i;
    for (const line of lines.slice(0, 10)) {
      if (!isValidMerchantLine(line)) continue;
      
      const match = line.match(businessSuffixPattern);
      if (match) {
        const name = match[1].trim();
        console.log('Found business with suffix:', name);
        return name;
      }
    }

    // Fallback: find first "clean" line with mostly letters
    for (const line of lines.slice(0, 10)) {
      if (isValidMerchantLine(line)) {
        // Clean up and capitalize
        const cleaned = line.replace(/[^\w\s&'-]/g, '').trim();
        if (cleaned.length >= 3 && cleaned.length <= 40) {
          console.log('Using fallback merchant name:', cleaned);
          return cleaned;
        }
      }
    }

    console.log('No merchant name found');
    return null;
  };

  /**
   * Find best matching category based on receipt content
   */
  const findBestCategory = (text: string, merchantName: string | null): string | null => {
    const lowerText = text.toLowerCase();
    const lowerMerchant = merchantName?.toLowerCase() || '';

    // Category keyword mappings (customize based on common categories)
    const categoryKeywords: { keywords: string[]; priority: number }[] = [
      // Transportation & Shipping
      { keywords: ['fedex', 'ups', 'usps', 'shipping', 'freight', 'delivery', 'transport', 'gas', 'fuel', 'shell', 'chevron', 'exxon', 'bp', 'mobil', 'uber', 'lyft', 'taxi', 'parking'], priority: 10 },
      
      // Food & Dining
      { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger', 'pizza', 'food', 'dining', 'bar', 'grill', 'kitchen', 'bistro'], priority: 9 },
      
      // Groceries
      { keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway', 'kroger', 'whole foods', 'market', 'produce'], priority: 8 },
      
      // Office Supplies
      { keywords: ['office', 'staples', 'depot', 'supplies', 'paper', 'printer', 'ink'], priority: 7 },
      
      // Utilities
      { keywords: ['electric', 'water', 'gas bill', 'utility', 'power', 'phone', 'internet', 'cable'], priority: 6 },
      
      // Entertainment
      { keywords: ['movie', 'cinema', 'theater', 'entertainment', 'ticket', 'concert', 'netflix', 'spotify'], priority: 5 },
      
      // Healthcare
      { keywords: ['pharmacy', 'cvs', 'walgreens', 'medical', 'doctor', 'hospital', 'clinic', 'health'], priority: 4 },
      
      // Shopping
      { keywords: ['amazon', 'store', 'shop', 'retail', 'purchase'], priority: 3 },
    ];

    // Find matching categories from user's budget
    const categoryScores = new Map<string, number>();

    for (const category of categories) {
      const categoryNameLower = category.name.toLowerCase();
      let score = 0;

      // Check if merchant name contains category name or vice versa
      if (lowerMerchant && (lowerMerchant.includes(categoryNameLower) || categoryNameLower.includes(lowerMerchant))) {
        score += 100;
      }

      // Check keyword matches
      for (const { keywords, priority } of categoryKeywords) {
        for (const keyword of keywords) {
          const keywordInMerchant = lowerMerchant.includes(keyword);
          const keywordInText = lowerText.includes(keyword);
          
          // Check in merchant name (highest weight)
          if (keywordInMerchant) {
            // Direct match: keyword in both merchant and category name
            if (categoryNameLower.includes(keyword)) {
              score += priority * 5;
              console.log(`  Strong match: "${keyword}" in merchant and category "${category.name}": +${priority * 5}`);
            } else {
              // Partial match: keyword type matches category context
              const keywordType = 
                ['fedex', 'ups', 'usps', 'shipping', 'freight', 'delivery'].includes(keyword) ? 'shipping' :
                ['restaurant', 'cafe', 'coffee', 'starbucks', 'food', 'dining'].includes(keyword) ? 'food' :
                ['gas', 'fuel', 'shell', 'chevron', 'exxon'].includes(keyword) ? 'gas' :
                ['grocery', 'walmart', 'target', 'market'].includes(keyword) ? 'grocery' :
                ['office', 'staples', 'depot', 'supplies'].includes(keyword) ? 'office' :
                null;
              
              if (keywordType && categoryNameLower.includes(keywordType)) {
                score += priority * 3;
                console.log(`  Good match: "${keyword}" (${keywordType}) in merchant matches category "${category.name}": +${priority * 3}`);
              } else if (keywordType) {
                score += priority * 2;
                console.log(`  Weak match: "${keyword}" in merchant, category "${category.name}": +${priority * 2}`);
              }
            }
          }
          
          // Check in full text (lower weight)
          if (keywordInText && categoryNameLower.includes(keyword)) {
            score += priority;
            console.log(`  Text match: "${keyword}" in text and category "${category.name}": +${priority}`);
          }
        }
      }

      if (score > 0) {
        categoryScores.set(category.id, score);
        console.log(`Category "${category.name}" score: ${score}`);
      }
    }

    // Return category with highest score
    if (categoryScores.size > 0) {
      const bestMatch = Array.from(categoryScores.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
      const bestCategory = categories.find(c => c.id === bestMatch[0]);
      console.log('Best matching category:', bestCategory?.name, 'with score:', bestMatch[1]);
      return bestMatch[0];
    }

    return null;
  };

  /**
   * Extract the total amount from OCR text
   */
  const extractAmountFromText = (text: string): number | null => {
    console.log('OCR Text received:', text);
    
    // Clean up text - remove extra spaces and normalize
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Common patterns for receipt totals (ordered by priority)
    const patterns = [
      // "Total" followed by amount (with various separators) - note: 'g' flag required for matchAll
      /total[:\s$]*\$?\s*(\d+[.,]\d{2})/gi,
      /grand\s*total[:\s$]*\$?\s*(\d+[.,]\d{2})/gi,
      /final\s*total[:\s$]*\$?\s*(\d+[.,]\d{2})/gi,
      /balance[:\s$]*\$?\s*(\d+[.,]\d{2})/gi,
      /amount\s*due[:\s$]*\$?\s*(\d+[.,]\d{2})/gi,
      /total\s*amount[:\s$]*\$?\s*(\d+[.,]\d{2})/gi,
      
      // Amount patterns with dollar sign
      /\$\s*(\d+[.,]\d{2})/g,
      
      // Just numbers with decimal (as fallback)
      /(\d+\.\d{2})/g,
    ];

    const amounts: number[] = [];
    const foundMatches: { pattern: string; amount: number }[] = [];

    // Try each pattern
    for (const pattern of patterns) {
      const matches = cleanText.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1].replace(',', '.');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0 && amount < 100000) {
          amounts.push(amount);
          foundMatches.push({ 
            pattern: pattern.source, 
            amount 
          });
        }
      }
    }

    console.log('Found amounts:', foundMatches);

    if (amounts.length === 0) {
      console.log('No amounts found in text');
      return null;
    }

    // Return the largest amount found (likely the total)
    const maxAmount = Math.max(...amounts);
    console.log('Selected amount:', maxAmount);
    return maxAmount;
  };

  /**
   * Handle receipt image upload and OCR processing
   */
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a HEIC file (by extension or mime type)
    const isHeic = 
      file.type === 'image/heic' || 
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    // Validate file type
    if (!file.type.startsWith('image/') && !isHeic) {
      setError('Please upload an image file (JPEG, PNG, WebP, HEIC)');
      return;
    }

    setIsScanning(true);
    setError('');
    setScanProgress(0);

    try {
      let fileToProcess: File | Blob = file;

      // Auto-convert HEIC to JPEG
      if (isHeic) {
        setError('Converting HEIC image...');
        setScanProgress(5);
        
        try {
          console.log('Starting HEIC conversion for:', file.name);
          
          // Convert HEIC to JPEG using heic2any
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          
          // Handle both single blob and array of blobs
          const jpeg = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          
          // Create a new File object from the converted blob
          fileToProcess = new File(
            [jpeg], 
            file.name.replace(/\.heic$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
          
          console.log('HEIC conversion successful');
          setError(''); // Clear the "Converting..." message
          setScanProgress(15);
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError);
          
          // Show user-friendly error with fallback options
          setError(
            '❌ Auto-conversion failed. Your browser may not support HEIC.\n\n' +
            'Quick fix:\n' +
            '• iPhone: Settings → Camera → Formats → "Most Compatible"\n' +
            '• Or: Share the photo (auto-converts to JPEG)\n' +
            '• Then try uploading again'
          );
          
          setIsScanning(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptImage(e.target?.result as string);
      };
      reader.readAsDataURL(fileToProcess);

      // Process with OCR
      const worker = await createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text } } = await worker.recognize(fileToProcess);
      await worker.terminate();

      console.log('OCR completed, extracting information...');

      // Extract merchant name for description
      const merchantName = extractMerchantName(text);
      if (merchantName) {
        setDescription(merchantName);
        console.log('Description set to:', merchantName);
      }

      // Find best matching category
      const bestCategoryId = findBestCategory(text, merchantName);
      if (bestCategoryId) {
        setSelectedCategoryId(bestCategoryId);
        const category = categories.find(c => c.id === bestCategoryId);
        console.log('Auto-selected category:', category?.name);
      }

      // Extract amount from OCR text
      const extractedAmount = extractAmountFromText(text);
      
      if (extractedAmount && extractedAmount > 0) {
        setAmount(extractedAmount.toFixed(2));
        console.log('Amount set to:', extractedAmount.toFixed(2));
      } else {
        setError('Could not find amount on receipt. Please enter manually.');
        console.log('Failed to extract amount from OCR text');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan receipt';
      setError(`${errorMessage}. Please enter amount manually.`);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  /**
   * Clear the uploaded receipt
   */
  const handleClearReceipt = () => {
    setReceiptImage(null);
    setAmount('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    // Upload receipt to Firebase Storage if present
    let receiptStorageUrl: string | undefined = undefined;
    
    if (receiptImage) {
      try {
        setIsUploading(true);
        const expenseId = generateId(); // Generate ID before upload
        receiptStorageUrl = await StorageService.uploadReceiptImage(userId, expenseId, receiptImage);
        console.log('Receipt uploaded to Storage:', receiptStorageUrl);
      } catch (err) {
        console.error('Failed to upload receipt:', err);
        setError('Failed to upload receipt image. Please try again.');
        setIsUploading(false);
        return;
      }
    }

    try {
      onAddExpense(selectedCategoryId, amountNum, description, receiptStorageUrl, isRecurring);
      
      // Navigate back to main screen after successful submission
      onBack();
    } catch (err) {
      console.error('Failed to add expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="add-expense-screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Budget
        </button>
        <h1>Add Expense</h1>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories available. Please add categories first.</p>
          <button className="btn-primary" onClick={onBack}>
            Go to Budget
          </button>
        </div>
      ) : (
        <form className="expense-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {/* Receipt Upload Section */}
           <div className="receipt-upload-section">
            <h3>📸 Upload Receipt (Optional)</h3>
            <p className="upload-description">
              Take a photo or upload an image of your receipt. We'll automatically extract:
              <br />
              <small style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500, marginTop: '0.25rem', display: 'block' }}>
                ✅ Amount • ✅ Merchant Name • ✅ Best Category
              </small>
              <small style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'block', marginTop: '0.25rem' }}>
                Supports: JPEG, PNG, WebP, HEIC (auto-converts)
              </small>
            </p>

            {!receiptImage ? (
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,.heic,.heif"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="file-input"
                  id="receipt-upload"
                  disabled={isScanning}
                />
                <label htmlFor="receipt-upload" className="upload-label">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    {isScanning ? 'Scanning receipt...' : 'Tap to upload or take photo'}
                  </div>
                </label>
              </div>
            ) : (
              <div className="receipt-preview">
                <img src={receiptImage} alt="Receipt preview" className="receipt-image" />
                <button
                  type="button"
                  className="btn-clear-receipt"
                  onClick={handleClearReceipt}
                  disabled={isScanning}
                >
                  ✕ Remove Receipt
                </button>
              </div>
            )}

            {isScanning && (
              <div className="scan-progress">
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="progress-text">
                  {scanProgress < 20 ? '🔍 Scanning receipt...' :
                   scanProgress < 60 ? '💡 Reading text...' :
                   scanProgress < 90 ? '🤖 Extracting info...' :
                   '✨ Almost done...'}
                  {' '}{scanProgress}%
                </div>
              </div>
            )}
          </div>

          <div className="form-divider">
            <span>or enter manually</span>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              required
              disabled={isScanning}
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} - {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div className="category-info">
              <div className="info-item">
                <span className="info-label">Allocated:</span>
                <span className="info-value">{formatCurrency(selectedCategory.allocated)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Spent:</span>
                <span className="info-value">{formatCurrency(selectedCategory.spent)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Remaining:</span>
                <span className={`info-value ${selectedCategory.spent > selectedCategory.allocated ? 'negative' : 'positive'}`}>
                  {formatCurrency(selectedCategory.allocated - selectedCategory.spent)}
                </span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">
              Amount * {receiptImage && <span className="form-hint">(from receipt - you can edit)</span>}
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              disabled={isScanning}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Coffee at Starbucks, Weekly groceries"
              required
              disabled={isScanning}
            />
          </div>

          <div className="form-group">
            <label htmlFor="isRecurring" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                id="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                disabled={isScanning}
                style={{ cursor: 'pointer' }}
              />
              <span>Mark as recurring expense</span>
            </label>
            <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
              Recurring expenses will be automatically added to the new month when you click "End of Month"
            </small>
          </div>

          <div className="form-actions-horizontal">
            <button type="submit" className="btn-primary" disabled={isScanning || isUploading}>
              {isUploading ? 'Uploading Receipt...' : 'Add Expense'}
            </button>
            <button type="button" className="btn-secondary" onClick={onBack} disabled={isScanning || isUploading}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

