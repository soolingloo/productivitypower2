import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface EmailConfirmedPopupProps {
  onClose: () => void;
}

export const EmailConfirmedPopup: React.FC<EmailConfirmedPopupProps> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Email Confirmed!
          </h2>

          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You can now access all features of My Productivity Power.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
