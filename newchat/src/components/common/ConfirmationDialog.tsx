import React from "react";
import useOutsideClick from "@/utils/documentOutSideClick";
import { useAppContext } from "@/context/useContext";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  // setShowLogoutDialog?: any;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  message,
  onConfirm,
  onCancel,
  // setShowLogoutDialog,
}) => {
  const { isDarkMode, isMobile } = useAppContext();

  const divRef = React.useRef(null);
  useOutsideClick(divRef, () => onCancel());

  return (
    <>
      <style jsx>{`
        .confirmdialog {
          animation: fadeIn 0.3s 1 forwards;
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 0.7;
          }
        }
      `}</style>

      <div
        className={`fixed inset-0 w-full h-full backdrop-blur-sm flex items-center justify-center bg-black bg-opacity-50 z-50`}
      >
        <div
          ref={divRef}
          className={`confirmdialog w-full backdrop-blur-md max-w-[20vw] ${
            isMobile && "max-w-[75vw]"
          } p-4 rounded-lg shadow-lg transition-colors duration-300 ${
            isDarkMode ? "bg-dark-quaternary-color" : "bg-light-quaternary-color"
          }`}
        >
          <div className="mb-4">
            <strong
              className={`text-lg transition-colors ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {message}
            </strong>
          </div>
          <div className="flex justify-end space-x-4 opacity-100">
            <button
              onClick={onCancel}
              className={`px-4 w-[50%] py-2 rounded-full border transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-8 w-[50%] py-2 rounded-full border transition-colors duration-300 ${
                isDarkMode
                  ? "border-red-600 text-white bg-gray-800 hover:bg-red-600"
                  : "border-red-500 text-gray-900 hover:bg-red-500 hover:text-white"
              }`}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationDialog;
