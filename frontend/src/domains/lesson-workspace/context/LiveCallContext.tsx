"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { BookingRequest } from "@/domains/booking/types/booking";
import { FloatingJitsiCall } from "@/domains/lesson-workspace/components/FloatingJitsiCall";

type ActiveCall = {
  lesson: BookingRequest;
  relationshipId: string;
};

type LiveCallContextValue = {
  activeCall: ActiveCall | null;
  openCall: (lesson: BookingRequest, relationshipId: string) => void;
  closeCall: () => void;
};

const LiveCallContext = createContext<LiveCallContextValue | null>(null);

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function LiveCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const isClient = useIsClient();

  function openCall(lesson: BookingRequest, relationshipId: string) {
    setActiveCall({ lesson, relationshipId });
  }

  function closeCall() {
    setActiveCall(null);
  }

  return (
    <LiveCallContext.Provider value={{ activeCall, openCall, closeCall }}>
      {children}
      {isClient && activeCall
        ? createPortal(
            <FloatingJitsiCall
              lesson={activeCall.lesson}
              relationshipId={activeCall.relationshipId}
              onCallLeft={closeCall}
            />,
            document.body,
          )
        : null}
    </LiveCallContext.Provider>
  );
}

export function useLiveCall(): LiveCallContextValue {
  const context = useContext(LiveCallContext);
  if (!context) {
    throw new Error("useLiveCall must be used within a LiveCallProvider");
  }
  return context;
}
