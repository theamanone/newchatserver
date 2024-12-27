// ChatDialogue.tsx
import React from "react";
import DefaultChat from "../panels/DefaultChat";
import { useAppContext } from "@/context/useContext";

export default function ChatDialogue() {
  const { isMobile } = useAppContext();

  return (
    !isMobile && (
      <div className={` h-screen w-full flex`}>
        <DefaultChat />
      </div>
    )
  );
}
