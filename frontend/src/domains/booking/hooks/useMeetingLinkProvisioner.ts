'use client';

/**
 * Automatically requests Meet links for confirmed bookings that don't have one yet.
 * Covers new confirmations and older bookings confirmed before this feature existed.
 */

import { useEffect, useRef } from 'react';
import type { BookingRequest } from '@/domains/booking/types/booking';
import { requestMeetingLink } from '@/domains/booking/services/meetingLinkService';

function needsMeetingLink(booking: BookingRequest): boolean {
  if (booking.status !== 'confirmed') return false;
  if (booking.meetingLink && booking.meetingLinkStatus === 'ready') return false;
  if (booking.meetingLinkStatus === 'skipped') return false;
  if (booking.meetingLinkStatus === 'pending') return false;
  return true;
}

export function useMeetingLinkProvisioner(bookings: BookingRequest[]) {
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    for (const booking of bookings) {
      if (!needsMeetingLink(booking)) continue;
      if (inFlight.current.has(booking.id)) continue;

      inFlight.current.add(booking.id);

      void requestMeetingLink(booking.id)
        .catch((error) => {
          console.warn('[useMeetingLinkProvisioner]', booking.id, error);
        })
        .finally(() => {
          inFlight.current.delete(booking.id);
        });
    }
  }, [bookings]);
}
