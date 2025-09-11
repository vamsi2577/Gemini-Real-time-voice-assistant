/**
 * @fileoverview A robot icon component, used to represent the AI assistant.
 */
import React from 'react';

/**
 * Renders an SVG icon representing a robot.
 * @param {object} props - The component props.
 * @param {string} [props.className] - Optional CSS classes to apply to the SVG element.
 */
const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    <line x1="10" y1="16" x2="10.01" y2="16"></line>
    <line x1="14" y1="16" x2="14.01" y2="16"></line>
  </svg>
);

export default RobotIcon;
