import React from 'react';

interface BrandIconProps {
  className?: string;
}

/**
 * Geometric brand emblem for Investments Basics:
 * Three ascending compounding ledger bars bridged by an upward trajectory curve.
 */
export const BrandIcon: React.FC<BrandIconProps> = ({ className = 'h-7 w-7' }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        width="32"
        height="32"
        rx="7.5"
        className="fill-[#1E3A8A] dark:fill-[#2563EB]"
      />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="6.75"
        stroke="#FAF8F3"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <line
        x1="6.5"
        y1="24.5"
        x2="25.5"
        y2="24.5"
        stroke="#FAF8F3"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="7.5" y="18" width="3.5" height="6.5" rx="1" fill="#FAF8F3" fillOpacity="0.72" />
      <rect x="14.25" y="14" width="3.5" height="10.5" rx="1" fill="#FAF8F3" fillOpacity="0.88" />
      <rect x="21" y="9.5" width="3.5" height="15" rx="1" fill="#FAF8F3" />
      <path
        d="M8.5 15.25C12.2 14.3 15.8 11.7 22.75 7.5"
        stroke="#F59E0B"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <circle cx="23.25" cy="7.25" r="2.1" fill="#F59E0B" />
    </svg>
  );
};
