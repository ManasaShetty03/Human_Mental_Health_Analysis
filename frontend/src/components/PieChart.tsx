import React from 'react';

interface PieChartProps {
  data: Record<string, number>;
  colors?: string[];
  size?: number;
  title?: string;
}

export default function PieChart({ data, colors, size = 200, title }: PieChartProps) {
  const defaultColors = ['#10b981', '#3b82f6', '#ef4444', '#6b7280', '#f59e0b', '#8b5cf6'];
  const chartColors = colors || defaultColors;

  // Calculate total and percentages
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-gray-400 text-center">
          <div className="text-lg font-medium mb-2">{title || 'No Data'}</div>
          <div className="text-sm">No data available</div>
        </div>
      </div>
    );
  }

  let currentAngle = -90; // Start from top
  
  const segments = Object.entries(data).map(([label, value], index) => {
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Calculate the path for the pie segment
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = size / 2 + (size / 2) * Math.cos(startAngleRad);
    const y1 = size / 2 + (size / 2) * Math.sin(startAngleRad);
    const x2 = size / 2 + (size / 2) * Math.cos(endAngleRad);
    const y2 = size / 2 + (size / 2) * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const path = [
      `M ${size / 2} ${size / 2}`,
      `L ${x1} ${y1}`,
      `A ${size / 2} ${size / 2} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      label,
      value,
      percentage,
      color: colors[index % colors.length],
      path
    };
  });

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-lg"
        >
          {segments.map((segment, index) => (
            <g key={segment.label}>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-300 hover:opacity-100 hover:scale-105 cursor-pointer"
                style={{
                  opacity: 0.9,
                  transformOrigin: `${size/2}px ${size/2}px`,
                  animation: `fadeInScale 0.5s ease-out ${index * 100}ms both`
                }}
              />
              {segment.percentage > 5 && (
                <text
                  x={size / 2}
                  y={size / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fill="white"
                  fontWeight="bold"
                  className="pointer-events-none"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                  }}
                >
                  {segment.percentage.toFixed(1)}%
                </text>
              )}
            </g>
          ))}
          
          {/* Add center circle for donut effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 4}
            fill="white"
            className="drop-shadow-sm"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="text-lg font-bold text-gray-800 mb-4">{title}</div>
        <div className="flex flex-wrap justify-center gap-3">
          {segments.map((segment) => (
            <div 
              key={segment.label} 
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div
                className="w-4 h-4 rounded-md shadow-sm"
                style={{ backgroundColor: segment.color }}
              />
              <div className="text-sm">
                <span className="font-medium text-gray-700">{segment.label}</span>
                <span className="text-gray-500 ml-1">({segment.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 0.9;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
