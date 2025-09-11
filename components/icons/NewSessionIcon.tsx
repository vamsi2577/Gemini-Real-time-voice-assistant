/**
 * @fileoverview An icon for starting a new session, often depicted as a refresh or retry symbol.
 */
import React from 'react';

/**
 * Renders an SVG icon representing 'new session' or 'refresh'.
 * @param {object} props - The component props.
 * @param {string} [props.className] - Optional CSS classes to apply to the SVG element.
 */
const NewSessionIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M3 2v6h6"></path>
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
    <path d="M21 22v-6h-6"></path>
    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
  </svg>
);

export default NewSessionIcon;
