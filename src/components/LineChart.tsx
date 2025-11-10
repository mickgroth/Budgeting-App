import React from 'react';
import { formatCurrency } from '../utils/budgetHelpers';

interface CategoryData {
  id: string;
  name: string;
  color: string;
  monthlySpending: Array<{ month: string; spent: number }>;
}

interface LineChartProps {
  categories: CategoryData[];
  months: string[];
}

/**
 * Line chart component for visualizing expense trends over time
 */
export const LineChart: React.FC<LineChartProps> = ({ categories, months }) => {
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 120, bottom: 60, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value for Y-axis scaling
  const allValues = categories.flatMap(cat => cat.monthlySpending.map(m => m.spent));
  const maxValue = Math.max(...allValues, 0);
  const yAxisMax = Math.ceil(maxValue / 100) * 100 || 100; // Round up to nearest 100

  // Calculate positions
  const xStep = chartWidth / (months.length - 1 || 1);
  
  // Y-axis ticks
  const yTicks = 5;
  const yStep = yAxisMax / yTicks;

  // Generate path for a category line
  const generatePath = (spending: Array<{ spent: number }>) => {
    return spending
      .map((point, index) => {
        const x = padding.left + index * xStep;
        const y = padding.top + chartHeight - (point.spent / yAxisMax) * chartHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className="line-chart">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="chart-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grid lines and labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const value = yStep * i;
          const y = padding.top + chartHeight - (value / yAxisMax) * chartHeight;
          return (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 5}
                textAnchor="end"
                fill="#6B7280"
                fontSize="12"
              >
                {formatCurrency(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {months.map((month, index) => {
          const x = padding.left + index * xStep;
          return (
            <text
              key={`x-${index}`}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fill="#6B7280"
              fontSize="12"
            >
              {month}
            </text>
          );
        })}

        {/* Category lines */}
        {categories.map((category) => (
          <g key={category.id}>
            {/* Line */}
            <path
              d={generatePath(category.monthlySpending)}
              fill="none"
              stroke={category.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {category.monthlySpending.map((point, index) => {
              const x = padding.left + index * xStep;
              const y = padding.top + chartHeight - (point.spent / yAxisMax) * chartHeight;
              return (
                <g key={`${category.id}-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="white"
                    stroke={category.color}
                    strokeWidth="2"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill={category.color}
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* Legend */}
        {categories.map((category, index) => {
          const legendX = width - padding.right + 10;
          const legendY = padding.top + index * 25;
          return (
            <g key={`legend-${category.id}`}>
              <line
                x1={legendX}
                y1={legendY}
                x2={legendX + 20}
                y2={legendY}
                stroke={category.color}
                strokeWidth="3"
              />
              <text
                x={legendX + 25}
                y={legendY + 5}
                fill="#374151"
                fontSize="12"
              >
                {category.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip container */}
      <div className="chart-tooltip-container">
        {categories.map((category) => (
          <div key={`tooltip-${category.id}`} className="tooltip-category">
            <span className="tooltip-color" style={{ backgroundColor: category.color }} />
            <span className="tooltip-name">{category.name}:</span>
            <div className="tooltip-values">
              {category.monthlySpending.map((point, index) => (
                <span key={`${category.id}-${index}`} className="tooltip-value">
                  {months[index]}: {formatCurrency(point.spent)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

