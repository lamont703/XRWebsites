import React from 'react';

interface LineChartProps {
  data: any[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  return (
    <div>
      {/* Implement actual chart library here */}
      <p className="text-gray-400">Price history chart coming soon</p>
    </div>
  );
}; 