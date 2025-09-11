/**
 * @fileoverview A close (X) icon component.
 */
import React from 'react';

/**
 * Renders an SVG icon representing a close button (an 'X').
 * @param {object} props - The component props.
 * @param {string} [props.className] - Optional CSS classes to apply to the SVG element.
 */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default CloseIcon;