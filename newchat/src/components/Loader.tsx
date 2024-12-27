import { useAppContext } from "@/context/useContext";
import React from "react";

function Loader() {
  const { isDarkMode }: any = useAppContext() || {};

  return (
    <>
      <style jsx>
        {`
          .loader {
            width: 60%;
            background-color: white;
          }
          .loader span {
            height: 2px;
          }
        `}
      </style>
      <div
        className={`flex !z-50 flex-col absolute top-0 left-0 w-screen h-full items-center justify-center ${
          isDarkMode
            ? "text-white bg-dark-primary-color"
            : "text-black bg-light-secondary-color"
        }`}
      >
        <p className="text-2xl font-bold mb-4">ChatApp</p>
        <div className="loader relative">
          <span className="bg-red-600 absolute left-0 top-0 w-full"></span>
        </div>
      </div>
    </>
  );
}

export default Loader;
