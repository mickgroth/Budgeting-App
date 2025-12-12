import React, { useState } from 'react';
import { MonthlyArchive } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';
import { LineChart } from './LineChart';

interface MonthlyComparisonProps {
  archives: MonthlyArchive[];
  onBack: () => void;
}

/**
 * Component for comparing expenses across multiple months
 */
export const MonthlyComparison: React.FC<MonthlyComparisonProps> = ({
  archives,
  onBack,
}) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>(
    archives.slice(0, Math.min(6, archives.length)).map(a => a.month)
  );
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const formatMonthDisplay = (month: string): string => {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthIndex = parseInt(monthNum) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  const toggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month].sort((a, b) => b.localeCompare(a)));
    }
  };

  const selectAll = () => {
    setSelectedMonths(archives.map(a => a.month));
  };

  const clearAll = () => {
    setSelectedMonths([]);
  };

  // Get current month in YYYY-MM format
  const currentMonth = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  })();

  // Get all unique categories across selected months with their order
  const allCategories = new Map<string, { name: string; color: string; order: number }>();
  // Sort selected archives chronologically (oldest to newest) for display
  const selectedArchives = archives
    .filter(a => selectedMonths.includes(a.month))
    .sort((a, b) => a.month.localeCompare(b.month)); // Oldest first
  
  // Find the current month archive to get the latest category order
  const currentMonthArchive = archives.find(a => a.month === currentMonth);
  
  // First, collect all categories from selected archives
  selectedArchives.forEach(archive => {
    archive.categorySnapshots.forEach((cat, index) => {
      if (!allCategories.has(cat.id)) {
        // Default order from this archive
        const order = (cat as any).order !== undefined ? (cat as any).order : index;
        allCategories.set(cat.id, { name: cat.name, color: cat.color, order });
      }
    });
  });
  
  // Override with current month's order if available (most recent user preference)
  if (currentMonthArchive) {
    currentMonthArchive.categorySnapshots.forEach(cat => {
      if (allCategories.has(cat.id)) {
        const existing = allCategories.get(cat.id)!;
        const order = (cat as any).order !== undefined ? (cat as any).order : existing.order;
        allCategories.set(cat.id, { ...existing, order });
      }
    });
  }

  // Build comparison data
  const categoryData = Array.from(allCategories.entries()).map(([catId, catInfo]) => {
    const monthlySpending = selectedArchives.map(archive => {
      const snapshot = archive.categorySnapshots.find(s => s.id === catId);
      return {
        month: archive.month,
        spent: snapshot?.spent || 0,
        allocated: snapshot?.allocated || 0,
      };
    });

    const total = monthlySpending.reduce((sum, m) => sum + m.spent, 0);
    
    // Calculate average, excluding current month if spent is 0
    const monthsForAverage = monthlySpending.filter(m => {
      // Exclude current month only if spent is 0
      if (m.month === currentMonth && m.spent === 0) {
        return false;
      }
      return true;
    });
    
    const totalForAverage = monthsForAverage.reduce((sum, m) => sum + m.spent, 0);
    const average = monthsForAverage.length > 0 ? totalForAverage / monthsForAverage.length : 0;

    return {
      id: catId,
      name: catInfo.name,
      color: catInfo.color,
      order: catInfo.order,
      monthlySpending,
      total,
      average,
    };
  });

  // Sort by user-defined order for chart view, or by total spending for table view
  if (viewMode === 'chart') {
    categoryData.sort((a, b) => (a.order || 0) - (b.order || 0));
  } else {
    categoryData.sort((a, b) => b.total - a.total);
  }

  // Initialize selected categories with top 5 by default
  React.useEffect(() => {
    if (selectedCategories.length === 0 && categoryData.length > 0) {
      setSelectedCategories(categoryData.slice(0, Math.min(5, categoryData.length)).map(c => c.id));
    }
  }, [categoryData.length]);

  // Calculate totals row
  const monthlyTotals = selectedArchives.map(archive => ({
    month: archive.month,
    total: archive.totalSpent,
  }));

  const grandTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0);
  const grandAverage = monthlyTotals.length > 0 ? grandTotal / monthlyTotals.length : 0;

  // Calculate percentage change for each category (from oldest to newest month)
  const getCategoryTrend = (monthlySpending: Array<{ month: string; spent: number }>) => {
    if (monthlySpending.length < 2) return null;
    
    // Filter out current month if spent is 0
    const monthsForTrend = monthlySpending.filter(m => {
      // Exclude current month only if spent is 0
      if (m.month === currentMonth && m.spent === 0) {
        return false;
      }
      return true;
    });
    
    if (monthsForTrend.length < 2) return null;
    
    const first = monthsForTrend[0].spent; // First (oldest) month
    const last = monthsForTrend[monthsForTrend.length - 1].spent; // Last (newest) month
    
    if (first === 0) return null;
    return ((last - first) / first) * 100;
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const selectAllCategories = () => {
    setSelectedCategories(categoryData.map(c => c.id));
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  if (archives.length === 0) {
    return (
      <div className="monthly-comparison">
        <div className="screen-header">
          <button className="btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1>Monthly Comparison</h1>
        </div>
        <div className="empty-state">
          <p>📊 No archived months to compare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-comparison">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>📊 Monthly Comparison</h1>
      </div>

      {/* Month Selection */}
      <div className="month-selection-panel">
        <div className="selection-header">
          <h3>Select Months to Compare:</h3>
          <div className="selection-actions">
            <button className="btn-select-action" onClick={selectAll}>
              Select All
            </button>
            <button className="btn-select-action" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>
        <div className="month-chips">
          {archives.map((archive) => (
            <button
              key={archive.id}
              className={`month-chip ${selectedMonths.includes(archive.month) ? 'selected' : ''}`}
              onClick={() => toggleMonth(archive.month)}
            >
              {formatMonthDisplay(archive.month)}
              {selectedMonths.includes(archive.month) && <span className="chip-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedMonths.length === 0 ? (
        <div className="empty-state">
          <p>Select at least one month to view comparison</p>
        </div>
      ) : (
        <>
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table View
            </button>
            <button
              className={`toggle-btn ${viewMode === 'chart' ? 'active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              📈 Chart View
            </button>
          </div>

          {/* Summary Stats */}
          <div className="comparison-stats">
            <div className="stat-card">
              <div className="stat-label">Months Selected</div>
              <div className="stat-value">{selectedMonths.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Spent</div>
              <div className="stat-value">{formatCurrency(grandTotal)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Monthly Average</div>
              <div className="stat-value">{formatCurrency(grandAverage)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Categories</div>
              <div className="stat-value">{categoryData.length}</div>
            </div>
          </div>

          {viewMode === 'table' ? (
            /* Comparison Table */
            <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="category-column">Category</th>
                  {selectedArchives.map((archive) => (
                    <th key={archive.month} className="month-column">
                      {formatMonthDisplay(archive.month)}
                    </th>
                  ))}
                  <th className="trend-column">Trend</th>
                  <th className="average-column">Average</th>
                  <th className="total-column">Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((category) => {
                  const trend = getCategoryTrend(category.monthlySpending);
                  return (
                    <tr key={category.id}>
                      <td className="category-cell">
                        <span
                          className="category-color-dot"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="category-name">{category.name}</span>
                      </td>
                      {category.monthlySpending.map((month) => (
                        <td key={month.month} className="amount-cell">
                          {month.spent > 0 ? formatCurrency(month.spent) : '—'}
                        </td>
                      ))}
                      <td className="trend-cell">
                        {trend !== null ? (
                          <span className={`trend-indicator ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : ''}`}>
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="trend-indicator">—</span>
                        )}
                      </td>
                      <td className="average-cell">{formatCurrency(category.average)}</td>
                      <td className="total-cell">{formatCurrency(category.total)}</td>
                    </tr>
                  );
                })}
                <tr className="totals-row">
                  <td className="category-cell"><strong>TOTAL</strong></td>
                  {monthlyTotals.map((month) => (
                    <td key={month.month} className="amount-cell">
                      <strong>{formatCurrency(month.total)}</strong>
                    </td>
                  ))}
                  <td className="trend-cell">
                    {monthlyTotals.length >= 2 && (() => {
                      const first = monthlyTotals[0].total; // First (oldest) month
                      const last = monthlyTotals[monthlyTotals.length - 1].total; // Last (newest) month
                      if (first === 0) return <span>—</span>;
                      const totalTrend = ((last - first) / first) * 100;
                      return (
                        <span className={`trend-indicator ${totalTrend > 0 ? 'trend-up' : totalTrend < 0 ? 'trend-down' : ''}`}>
                          <strong>
                            {totalTrend > 0 ? '↑' : totalTrend < 0 ? '↓' : '→'} {Math.abs(totalTrend).toFixed(0)}%
                          </strong>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="average-cell"><strong>{formatCurrency(grandAverage)}</strong></td>
                  <td className="total-cell"><strong>{formatCurrency(grandTotal)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          ) : (
            /* Chart View */
            <div className="chart-view-container">
              {/* Category Selection for Chart */}
              <div className="chart-category-selection">
                <div className="selection-header">
                  <h3>Select Categories to Display:</h3>
                  <div className="selection-actions">
                    <button className="btn-select-action" onClick={selectAllCategories}>
                      Select All
                    </button>
                    <button className="btn-select-action" onClick={clearAllCategories}>
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="category-checkboxes">
                  {categoryData.map((category) => (
                    <label key={category.id} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                      />
                      <span
                        className="checkbox-color-dot"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="checkbox-label">{category.name}</span>
                      <span className="checkbox-total">{formatCurrency(category.total)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Line Chart */}
              {selectedCategories.length > 0 ? (
                <div className="line-chart-container">
                  <LineChart
                    categories={categoryData.filter(c => selectedCategories.includes(c.id))}
                    months={selectedArchives.map(a => formatMonthDisplay(a.month))}
                  />
                </div>
              ) : (
                <div className="empty-state">
                  <p>Select at least one category to display in the chart</p>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {categoryData.length > 0 && (
            <div className="insights-section">
              <h3>💡 Insights</h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-title">Highest Spending Category</div>
                  <div className="insight-content">
                    <span
                      className="category-color-dot"
                      style={{ backgroundColor: categoryData[0].color }}
                    />
                    <span className="insight-value">{categoryData[0].name}</span>
                    <span className="insight-amount">{formatCurrency(categoryData[0].total)}</span>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-title">Most Consistent Spending</div>
                  <div className="insight-content">
                    {(() => {
                      const mostConsistent = categoryData.reduce((best, cat) => {
                        if (cat.monthlySpending.length < 2) return best;
                        const variance = cat.monthlySpending.reduce((sum, m) => {
                          const diff = m.spent - cat.average;
                          return sum + diff * diff;
                        }, 0) / cat.monthlySpending.length;
                        const bestVariance = best ? 
                          best.monthlySpending.reduce((sum, m) => {
                            const diff = m.spent - best.average;
                            return sum + diff * diff;
                          }, 0) / best.monthlySpending.length : Infinity;
                        return variance < bestVariance ? cat : best;
                      }, null as typeof categoryData[0] | null);
                      
                      return mostConsistent ? (
                        <>
                          <span
                            className="category-color-dot"
                            style={{ backgroundColor: mostConsistent.color }}
                          />
                          <span className="insight-value">{mostConsistent.name}</span>
                        </>
                      ) : <span>N/A</span>;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

