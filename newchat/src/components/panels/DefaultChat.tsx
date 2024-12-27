import Image from "next/image";
import React from "react";

export default function DefaultChat() {
  return (
    <div className="flex items-center justify-center w-full h-full ">
      {/* Default placeholder for when no chat is selected */}
      <div className="text-center">
        <Image
          src="https://via.placeholder.com/100"
          alt="App Logo"
          width={128}
          height={128}
          className="w-32 h-32 mx-auto mb-6 rounded-full"
        />
        <h2 className="text-3xl font-bold">Welcome to ChatApp</h2>
        <p className=" mt-2">
          Select a conversation to start chatting or begin a new one.
        </p>
      </div>
    </div>
  );
}
