"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { BookingRequest } from "@/domains/booking/types/booking";

type JitsiMeetExternalApi = {
  addEventListener: (eventName: string, handler: () => void) => void;
  dispose: () => void;
};

type JitsiMeetExternalApiConstructor = new (
  domain: string,
  options: {
    roomName: string;
    parentNode: HTMLElement;
    width: string;
    height: string;
    configOverwrite?: Record<string, unknown>;
    interfaceConfigOverwrite?: Record<string, unknown>;
  },
) => JitsiMeetExternalApi;

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiMeetExternalApiConstructor;
  }
}

function buildJitsiRoomName(seed: string) {
  const safeSeed = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `logicgate-${safeSeed || "lesson"}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function FloatingJitsiCall({
  lesson,
  relationshipId,
  onCallLeft,
}: {
  lesson: BookingRequest;
  relationshipId: string;
  onCallLeft: () => void;
}) {
  const headerHeight = 18;
  const minSize = { width: 420, height: 340 };
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ width: 760, height: 620 });
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originWidth: number;
    originHeight: number;
  } | null>(null);
  const roomName = buildJitsiRoomName(lesson.id || relationshipId);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    setPosition({
      x: Math.max(0, dragStart.originX + event.clientX - dragStart.startX),
      y: Math.max(0, dragStart.originY + event.clientY - dragStart.startY),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (dragStart?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    resizeStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: size.width,
      originHeight: size.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const resizeStart = resizeStartRef.current;
    if (!resizeStart || resizeStart.pointerId !== event.pointerId) return;

    const maxWidth = Math.max(
      minSize.width,
      window.innerWidth - position.x - 24,
    );
    const maxHeight = Math.max(
      minSize.height,
      window.innerHeight - position.y - 24,
    );

    setSize({
      width: clamp(
        resizeStart.originWidth + event.clientX - resizeStart.startX,
        minSize.width,
        maxWidth,
      ),
      height: clamp(
        resizeStart.originHeight + event.clientY - resizeStart.startY,
        minSize.height,
        maxHeight,
      ),
    });
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const resizeStart = resizeStartRef.current;
    if (resizeStart?.pointerId === event.pointerId) {
      resizeStartRef.current = null;
    }
  }

  return (
    <div
      className="fixed z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Drag call window"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex h-[18px] cursor-move items-center justify-center border-b border-slate-200 bg-slate-100 select-none"
      >
        <span
          className="h-1 w-12 rounded-full bg-slate-400"
          aria-hidden="true"
        />
      </div>

      <JitsiCallSurface
        roomName={roomName}
        width={size.width}
        height={Math.max(0, size.height - headerHeight)}
        onLeave={onCallLeft}
      />

      <button
        type="button"
        aria-label="Resize lesson call"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        className="absolute bottom-2 right-2 h-6 w-6 cursor-nwse-resize rounded-lg border border-white/40 bg-slate-950/70 text-white shadow-lg transition hover:bg-slate-800"
      >
        <span className="sr-only">Resize lesson call</span>
        <span
          aria-hidden="true"
          className="block translate-x-[7px] translate-y-[7px] text-xs leading-none"
        >
          ⌟
        </span>
      </button>
    </div>
  );
}

function JitsiCallSurface({
  roomName,
  width,
  height,
  onLeave,
}: {
  roomName: string;
  width: number;
  height: number;
  onLeave: () => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiMeetExternalApi | null>(null);
  const onLeaveRef = useRef(onLeave);

  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    let isMounted = true;

    function createMeeting() {
      if (!isMounted || !parentRef.current || !window.JitsiMeetExternalAPI) {
        return;
      }

      apiRef.current?.dispose();
      parentRef.current.innerHTML = "";

      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: parentRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          disableDeepLinking: true,
          prejoinConfig: { enabled: true },
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      });

      const handleLeave = () => onLeaveRef.current();
      api.addEventListener("readyToClose", handleLeave);
      api.addEventListener("videoConferenceLeft", handleLeave);
      apiRef.current = api;
    }

    if (window.JitsiMeetExternalAPI) {
      createMeeting();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://meet.jit.si/external_api.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", createMeeting, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = createMeeting;
        document.body.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName]);

  const baseSize = { width: 900, height: 720 };
  const scale = Math.min(width / baseSize.width, height / baseSize.height);
  const scaledWidth = baseSize.width * scale;
  const scaledHeight = baseSize.height * scale;

  return (
    <div
      className="flex items-center justify-center overflow-hidden bg-slate-950"
      style={{ height }}
    >
      <div
        className="overflow-hidden rounded-b-2xl bg-slate-950"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          ref={parentRef}
          style={{
            width: baseSize.width,
            height: baseSize.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
