import React from 'react';
import { MonthData } from '../types/budget';

interface MonthTabsProps {
  months: MonthData[];
  selectedMonth: string; // YYYY-MM format
  onSelectMonth: (month: string) => void;
  currentMonth: string; // YYYY-MM format of actual current month
}

export const MonthTabs: React.FC<MonthTabsProps> = ({
  months,
  selectedMonth,
  onSelectMonth,
  currentMonth,
}) => {
  // Sort months in descending order (newest first)
  const sortedMonths = [...months].sort((a, b) => b.month.localeCompare(a.month));

  const formatMonthDisplay = (monthStr: string): string => {
    const [year, monthNum] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="month-tabs-container">
      <div className="month-tabs">
        {sortedMonths.map((month) => {
          const isSelected = month.month === selectedMonth;
          const isCurrent = month.month === currentMonth;
          
          return (
            <button
              key={month.id}
              className={`month-tab ${isSelected ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => onSelectMonth(month.month)}
            >
              {formatMonthDisplay(month.month)}
              {isCurrent && <span className="current-indicator">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

