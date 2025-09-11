/**
 * @fileoverview A modal component to house the assistant's configuration settings.
 */
import React from 'react';
import SettingsPanel, { SettingsPanelProps } from './SettingsPanel';
import CloseIcon from './icons/CloseIcon';

/**
 * Props for the SettingsModal component.
 */
interface SettingsModalProps extends SettingsPanelProps {
  /** Callback function to close the modal. */
  onClose: () => void;
}

/**
 * A modal window that displays the SettingsPanel for configuring the assistant.
 */
const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { onClose, ...settingsPanelProps } = props;

  return (
    // Backdrop overlay
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Modal container */}
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the panel from closing it
      >
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 id="settings-modal-title" className="text-lg font-bold text-cyan-400">
            Assistant Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close settings"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <SettingsPanel {...settingsPanelProps} />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;