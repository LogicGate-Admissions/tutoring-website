'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DragToBookCalendar } from '@/domains/booking/components/DragToBookCalendar';
import { getStudentAvailabilityById } from '@/domains/students/learning-profile/services/learningProfileStorage';
import type { TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';

type BookSessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tutorId: string;
  studentId: string;
  counterpartyName: string;
  initiatedBy: 'tutor' | 'student';
  currentUserId: string;
  mode?: 'create' | 'reschedule';
  existingBooking?: {
    id: string;
    subject: string;
    durationMinutes: number;
  };
};

export function BookSessionModal({
  isOpen,
  onClose,
  tutorId,
  studentId,
  counterpartyName,
  initiatedBy,
  currentUserId,
  mode = 'create',
  existingBooking,
}: BookSessionModalProps) {
  const [studentAvailabilityBlocks, setStudentAvailabilityBlocks] = useState<TimeBlock[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const idToFetch = initiatedBy === 'tutor' ? studentId : currentUserId;
    getStudentAvailabilityById(idToFetch)
      .then((blocks) => { if (active) setStudentAvailabilityBlocks(blocks); })
      .catch(() => {});
    return () => {
      active = false;
      setStudentAvailabilityBlocks([]);
    };
  }, [isOpen, initiatedBy, studentId, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[min(90vh,48rem)] w-full max-w-4xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DragToBookCalendar
          tutorId={tutorId}
          studentId={studentId}
          counterpartyName={counterpartyName}
          initiatedBy={initiatedBy}
          studentAvailabilityBlocks={studentAvailabilityBlocks}
          onSuccess={onClose}
          onCancel={onClose}
          mode={mode}
          existingBooking={existingBooking}
        />
      </div>
    </div>,
    document.body
  );
}
