import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBudget } from './useBudget';

describe('useBudget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty budget', () => {
    const { result } = renderHook(() => useBudget());
    expect(result.current.budget.totalBudget).toBe(0);
    expect(result.current.budget.categories).toHaveLength(0);
  });

  it('should set total budget', () => {
    const { result } = renderHook(() => useBudget());
    
    act(() => {
      result.current.setTotalBudget(5000);
    });

    expect(result.current.budget.totalBudget).toBe(5000);
  });

  it('should add a category', () => {
    const { result } = renderHook(() => useBudget());
    
    act(() => {
      result.current.addCategory('Groceries', 500);
    });

    expect(result.current.budget.categories).toHaveLength(1);
    expect(result.current.budget.categories[0].name).toBe('Groceries');
    expect(result.current.budget.categories[0].allocated).toBe(500);
    expect(result.current.budget.categories[0].spent).toBe(0);
  });

  it('should update spending', () => {
    const { result } = renderHook(() => useBudget());
    
    act(() => {
      result.current.addCategory('Groceries', 500);
    });

    const categoryId = result.current.budget.categories[0].id;

    act(() => {
      result.current.updateSpending(categoryId, 250);
    });

    expect(result.current.budget.categories[0].spent).toBe(250);
  });

  it('should delete a category', () => {
    const { result } = renderHook(() => useBudget());
    
    act(() => {
      result.current.addCategory('Groceries', 500);
      result.current.addCategory('Rent', 1500);
    });

    expect(result.current.budget.categories).toHaveLength(2);

    const categoryId = result.current.budget.categories[0].id;

    act(() => {
      result.current.deleteCategory(categoryId);
    });

    expect(result.current.budget.categories).toHaveLength(1);
    expect(result.current.budget.categories[0].name).toBe('Rent');
  });

  it('should prevent negative values', () => {
    const { result } = renderHook(() => useBudget());
    
    act(() => {
      result.current.setTotalBudget(-100);
    });

    expect(result.current.budget.totalBudget).toBe(0);
  });
});


