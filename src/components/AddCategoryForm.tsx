import React, { useState } from 'react';

interface AddCategoryFormProps {
  onAdd: (name: string, allocated: number) => void;
}

/**
 * Component for adding new budget categories
 */
export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [allocated, setAllocated] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const amount = parseFloat(allocated) || 0;

    if (trimmedName && amount >= 0) {
      onAdd(trimmedName, amount);
      setName('');
      setAllocated('');
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setAllocated('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button className="btn-add-category" onClick={() => setIsOpen(true)}>
        + Add Category
      </button>
    );
  }

  return (
    <div className="add-category-form">
      <h3>Add New Category</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category-name">Category Name:</label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Groceries, Rent, Entertainment"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="category-allocated">Allocated Amount:</label>
          <input
            id="category-allocated"
            type="number"
            value={allocated}
            onChange={(e) => setAllocated(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save">
            Add Category
          </button>
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};


