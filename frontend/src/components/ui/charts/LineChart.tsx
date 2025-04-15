import React from 'react';
import styles from '@/styles/Charts.module.css';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  width?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data = [], 
  height = 300,
  width = '100%'
}) => {
  // If no data, show placeholder
  if (data.length === 0) {
    return (
      <div 
        className={styles.chartPlaceholder}
        style={{ height: `${height}px`, width }}
      >
        <div className={styles.placeholderIcon}>📊</div>
        <p>Chart data coming soon</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Calculate points for the line
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value / maxValue) * 90); // Leave some margin at top
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={styles.chartContainer} style={{ height: `${height}px`, width }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" className={styles.gridLine} />
        <line x1="0" y1="50" x2="100" y2="50" className={styles.gridLine} />
        <line x1="0" y1="75" x2="100" y2="75" className={styles.gridLine} />
        
        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          className={styles.dataLine}
        />
        
        {/* Area under the line */}
        <polyline
          points={`${points} 100,100 0,100`}
          fill="url(#areaGradient)"
          opacity="0.2"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007bff" />
            <stop offset="100%" stopColor="#6610f2" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#007bff" />
            <stop offset="100%" stopColor="#007bff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* X-axis labels */}
      <div className={styles.xAxisLabels}>
        {data.map((point, index) => (
          <div 
            key={index}
            className={styles.xLabel}
            style={{ left: `${(index / (data.length - 1)) * 100}%` }}
          >
            {point.label}
          </div>
        ))}
      </div>
      
      {/* Y-axis labels */}
      <div className={styles.yAxisLabels}>
        <div className={styles.yLabel} style={{ bottom: '75%' }}>
          {Math.round(maxValue * 0.75)}
        </div>
        <div className={styles.yLabel} style={{ bottom: '50%' }}>
          {Math.round(maxValue * 0.5)}
        </div>
        <div className={styles.yLabel} style={{ bottom: '25%' }}>
          {Math.round(maxValue * 0.25)}
        </div>
        <div className={styles.yLabel} style={{ bottom: '0%' }}>
          0
        </div>
      </div>
    </div>
  );
}; 