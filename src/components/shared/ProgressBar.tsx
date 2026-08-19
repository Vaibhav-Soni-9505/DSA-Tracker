import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = "" }) => {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-2 w-full rounded-full bg-secondary overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
