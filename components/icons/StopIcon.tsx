/**
 * @fileoverview A stop icon component.
 */
import React from 'react';

/**
 * Renders an SVG icon representing a stop button (a filled square).
 * @param {object} props - The component props.
 * @param {string} [props.className] - Optional CSS classes to apply to the SVG element.
 */
const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
    </svg>
);

export default StopIcon;
