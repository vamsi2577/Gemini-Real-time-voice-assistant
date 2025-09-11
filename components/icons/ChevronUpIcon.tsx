/**
 * @fileoverview A chevron up icon component.
 */
import React from 'react';

/**
 * Renders an SVG icon representing a chevron pointing up.
 * @param {object} props - The component props.
 * @param {string} [props.className] - Optional CSS classes to apply to the SVG element.
 */
const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

export default ChevronUpIcon;
