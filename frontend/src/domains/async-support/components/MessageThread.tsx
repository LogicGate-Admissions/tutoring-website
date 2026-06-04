"use client";

/**
 * File purpose:
 * Shared message thread for student and tutor support routes.
 *
 * The thread supports live updates, unread dividers, generic demo attachments,
 * WhatsApp-style replies, and owner-controlled message edits/deletes.
 */

import { ChangeEvent, ClipboardEvent as ReactClipboardEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { uploadAttachments } from "@/domains/attachments/services/attachmentUploadService";
import {
  canEmailTutorForUrgentMessage,
  openUrgentMessageEmailDraft,
} from "@/domains/async-support/services/urgentMessageEmailService";
import { subscribeToCurrentUser } from "@/domains/auth/services/authService";
import {
  createSupportMessage,
  deleteSupportMessage,
  subscribeToSupportMessages,
  updateSupportMessage,
} from "@/domains/async-support/services/messagesService";
import {
  getStudentTutorRelationshipById,
  markRelationshipMessagesSeen,
} from "@/domains/async-support/services/relationshipsService";
import type {
  AsyncSupportRole,
  MessageUrgency,
  StudentTutorRelationship,
  ReplyToMessageSummary,
  SupportAttachment,
  SupportMessage,
} from '@/domains/async-support/types/asyncSupport';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils/cn';
import { DragToBookCalendar } from '@/domains/booking/components/DragToBookCalendar';
import { StudentAvailabilityGrid } from '@/domains/students/learning-profile/components/StudentAvailabilityGrid';
import { createManualTimeBlock, mergeTimeBlocks } from '@/domains/students/learning-profile/utils/timeBlocks';
import { getStoredLearningProfile, getStudentAvailabilityById, updateStoredLearningProfile } from '@/domains/students/learning-profile/services/learningProfileStorage';
import { getTutorProfileDraft, saveTutorProfileFromOnboarding } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';
import type { AuthUser } from '@/domains/auth/types/auth';
import type { Day, TimeBlock } from '@/domains/students/learning-profile/types/learningProfile';
import type { TutorProfileDraft } from '@/domains/tutors/tutor-discovery/services/tutorProfileService';

type MessageThreadProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
};

type CurrentThreadUser = AuthUser | null;

export function MessageThread({
  relationshipId,
  viewerRole,
}: MessageThreadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageComposerRef = useRef<MathInputHandle | null>(null);
  const messageElementRefs = useRef(new Map<string, HTMLDivElement>());
  const highlightTimeoutRef = useRef<number | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentThreadUser | null>(
    null,
  );
  const [relationship, setRelationship] =
    useState<StudentTutorRelationship | null>(null);
  const [previousLastSeenMessagesAt, setPreviousLastSeenMessagesAt] = useState<
    string | undefined
  >();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyToMessageSummary | null>(
    null,
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [editDraft, setEditDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isMutatingMessage, setIsMutatingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'availability' | 'booking'>('availability');
  const [availabilityBlocks, setAvailabilityBlocks] = useState<TimeBlock[]>([]);
  const [availSelectedBlockId, setAvailSelectedBlockId] = useState<string | null>(null);
  const [tutorDraft, setTutorDraft] = useState<TutorProfileDraft | null>(null);
  const [counterpartyStudentBlocks, setCounterpartyStudentBlocks] = useState<TimeBlock[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToCurrentUser((user) => {
      if (!user || user.role !== viewerRole) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(user);
    });

    return unsubscribe;
  }, [viewerRole]);

  useEffect(() => {
    if (!isScheduleOpen || !currentUser) return;

    let isActive = true;

    async function loadInitialAvailability() {
      try {
        if (!currentUser) return;
        if (currentUser.role === 'student') {
          const profile = await getStoredLearningProfile();
          if (!isActive) return;
          setAvailabilityBlocks(profile.availability ?? []);
        } else {
          const draft = await getTutorProfileDraft(currentUser.id);
          if (!isActive) return;
          setTutorDraft(draft);
          setAvailabilityBlocks(draft.availability ?? []);
        }
      } catch {
        // ignore; leave availability empty
      }
    }

    loadInitialAvailability();

    return () => {
      isActive = false;
    };
  }, [isScheduleOpen, currentUser]);

  useEffect(() => {
    if (!isScheduleOpen || !relationship?.studentId || currentUser?.role !== 'tutor') return;
    let isActive = true;
    getStudentAvailabilityById(relationship.studentId).then((blocks) => {
      if (isActive) setCounterpartyStudentBlocks(blocks);
    }).catch(() => {});
    return () => { isActive = false; };
  }, [isScheduleOpen, relationship?.studentId, currentUser?.role]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let isActive = true;
    let unsubscribeMessages: (() => void) | undefined;

    async function initialiseThread() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedRelationship =
          await getStudentTutorRelationshipById(relationshipId);

        if (!isActive) {
          return;
        }

        setRelationship(loadedRelationship);
        setPreviousLastSeenMessagesAt(
          getViewerLastSeenMessagesAt(loadedRelationship, viewerRole),
        );

        unsubscribeMessages = subscribeToSupportMessages({
          relationshipId,
          onChange: (loadedMessages) => {
            if (!isActive) {
              return;
            }

            setMessages(loadedMessages);
            setIsLoading(false);
            setError(null);

            markRelationshipMessagesSeen({
              relationshipId,
              viewerRole,
            }).catch(() => {
              // The thread can still be read if this metadata update fails.
              // A later refresh/open will attempt to mark messages as seen again.
            });
          },
          onError: () => {
            if (!isActive) {
              return;
            }

            setMessages([]);
            setIsLoading(false);
            setError("Could not load messages.");
          },
        });
      } catch {
        if (!isActive) {
          return;
        }

        setMessages([]);
        setIsLoading(false);
        setError("Could not load messages.");
      }
    }

    initialiseThread();

    return () => {
      isActive = false;
      unsubscribeMessages?.();
    };
  }, [currentUser, relationshipId, viewerRole]);

  function registerMessageElement(
    messageId: string,
    element: HTMLDivElement | null,
  ) {
    if (!element) {
      messageElementRefs.current.delete(messageId);
      return;
    }

    messageElementRefs.current.set(messageId, element);
  }

  function jumpToMessage(messageId: string) {
    const targetElement = messageElementRefs.current.get(messageId);

    if (!targetElement) {
      window.alert("Original message is no longer available.");
      return;
    }

    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId((currentMessageId) =>
        currentMessageId === messageId ? null : currentMessageId,
      );
      highlightTimeoutRef.current = null;
    }, 1800);
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = draftMessage.trim();

    if (!currentUser || (!trimmedMessage && selectedFiles.length === 0)) {
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const attachments =
        selectedFiles.length > 0
          ? await uploadAttachments({
              files: selectedFiles,
              context: {
                area: "messages",
                ownerId: relationshipId,
                uploadedById: currentUser.id,
              },
            })
          : [];

      await createSupportMessage({
        relationshipId,
        senderId: currentUser.id,
        senderRole: currentUser.role,
        senderName: currentUser.name,
        body: trimmedMessage,
        attachments,
        replyTo: replyingTo ?? undefined,
        urgency: isUrgent ? "urgent" : "normal",
      });

      if (isUrgent && currentUser.role === "student") {
        openUrgentEmailDraftOrShowFallback({
          relationship,
          studentName: currentUser.name,
          messageBody: trimmedMessage,
          attachmentCount: attachments.length,
        });
      }

      setDraftMessage("");
      setReplyingTo(null);
      setSelectedFiles([]);
      setIsUrgent(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not send message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function startReplyTo(message: SupportMessage) {
    setReplyingTo(buildReplySummary(message));
    window.requestAnimationFrame(() => messageComposerRef.current?.focus());
  }

  function startEditingMessage(message: SupportMessage) {
    setReplyingTo(null);
    setEditingMessageId(message.id);
    setEditDraft(message.body);
  }

  function cancelEditingMessage() {
    setEditingMessageId(null);
    setEditDraft("");
  }

  async function saveEditedMessage(message: SupportMessage) {
    const trimmedEdit = editDraft.trim();

    if (!trimmedEdit && message.attachments.length === 0) {
      setError("A message must include text or an attachment.");
      return;
    }

    try {
      setIsMutatingMessage(true);
      setError(null);

      await updateSupportMessage({
        relationshipId,
        messageId: message.id,
        body: trimmedEdit,
        urgency: message.urgency,
      });

      cancelEditingMessage();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not edit message.",
      );
    } finally {
      setIsMutatingMessage(false);
    }
  }

  async function handleDeleteMessage(message: SupportMessage) {
    const confirmed = window.confirm(
      "Delete this message? It will stay in the thread as a deleted-message placeholder.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsMutatingMessage(true);
      setError(null);
      if (!currentUser) {
        return;
      }

      await deleteSupportMessage({
        relationshipId,
        messageId: message.id,
        deletedById: currentUser.id,
      });

      if (editingMessageId === message.id) {
        cancelEditingMessage();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete message.",
      );
    } finally {
      setIsMutatingMessage(false);
    }
  }

  async function handleSetMessageUrgency(
    message: SupportMessage,
    urgency: MessageUrgency,
  ) {
    try {
      setIsMutatingMessage(true);
      setError(null);

      await updateSupportMessage({
        relationshipId,
        messageId: message.id,
        urgency,
      });

      if (urgency === "urgent" && currentUser?.role === "student") {
        openUrgentEmailDraftOrShowFallback({
          relationship,
          studentName: currentUser.name,
          messageBody: message.body,
          attachmentCount: message.attachments.length,
        });
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update message urgency.",
      );
    } finally {
      setIsMutatingMessage(false);
    }
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles((currentFiles) => [...currentFiles, ...files]);
  }

  function removeSelectedFile(fileIndex: number) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== fileIndex),
    );
  }

  function addGridRange(day: Day, from: string, to: string) {
    const newBlock = createManualTimeBlock(day, from, to);
    setAvailabilityBlocks((current) => mergeTimeBlocks([...current, newBlock]));
    setAvailSelectedBlockId(newBlock.id);
  }

  function resizeAvailBlock(blockId: string, from: string, to: string) {
    setAvailabilityBlocks((current) =>
      mergeTimeBlocks(
        current.map((b) => (b.id === blockId ? { ...b, from, to } : b))
      )
    );
  }

  function removeAvailBlock(block: TimeBlock) {
    setAvailabilityBlocks((current) => current.filter((b) => b.id !== block.id));
    setAvailSelectedBlockId(null);
  }

  async function handleSaveAvailability() {
    try {
      if (!currentUser) return;

      const merged = mergeTimeBlocks(availabilityBlocks);

      if (currentUser.role === 'student') {
        await updateStoredLearningProfile({ availability: merged });
      } else {
        // save tutor draft availability; preserve other draft fields if we loaded one
        if (tutorDraft) {
          await saveTutorProfileFromOnboarding(currentUser, { ...tutorDraft, availability: merged });
        }
      }
      // Keep the modal open so the user can switch to the booking tab immediately
    } catch {
      window.alert('Could not save availability.');
    }
  }

  function handleCloseSchedule() {
    setIsScheduleOpen(false);
  }

  const bookingTutorId =
    currentUser?.role === 'student' ? relationship?.tutorId : currentUser?.id;
  const bookingTutorName =
    currentUser?.role === 'student'
      ? relationship?.tutorName
      : currentUser?.name;
  const bookingStudentId =
    currentUser?.role === 'student' ? currentUser.id : relationship?.studentId;
  const bookingInitiatedBy = currentUser?.role;
  const canOpenBooking = Boolean(
    relationship && bookingTutorId && bookingTutorName && bookingStudentId && bookingInitiatedBy,
  );

  const firstUnreadMessageId = getFirstUnreadMessageId({
    messages,
    currentUserId: currentUser?.id,
    previousLastSeenMessagesAt,
  });

  const canSendMessage = Boolean(
    currentUser &&
    (draftMessage.trim() || selectedFiles.length > 0) &&
    !isSending,
  );
  const canMarkNewMessageUrgent = currentUser?.role === "student";

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Message thread
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use this space for async support between sessions. New messages appear
          automatically, and unread messages are marked when you open the
          thread.
        </p>

        {relationship ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Conversation with:</span>{" "}
              {viewerRole === "student"
                ? relationship.tutorName
                : relationship.studentName}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Subject:</span>{" "}
              {relationship.level} {relationship.subject}
            </p>
          </div>
        ) : null}
      </Card>

      <Card className="grid gap-4">
        {isLoading ? (
          <p className="text-sm text-slate-600">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">
              No messages yet
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Send a message or attach a file to start this async support
              thread.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((message) => {
              const isMine = message.senderId === currentUser?.id;
              const canEditOrDelete = isMine && !message.isDeleted;
              const canChangeUrgency =
                currentUser?.role === "student" &&
                isMine &&
                message.senderRole === "student" &&
                !message.isDeleted;

              return (
                <div key={message.id} className="grid gap-3">
                  {message.id === firstUnreadMessageId ? (
                    <UnreadDivider />
                  ) : null}
                  <MessageBubble
                    message={message}
                    isMine={isMine}
                    isEditing={editingMessageId === message.id}
                    isHighlighted={highlightedMessageId === message.id}
                    editDraft={editDraft}
                    isBusy={isMutatingMessage}
                    canEditOrDelete={canEditOrDelete}
                    canChangeUrgency={canChangeUrgency}
                    onRegisterElement={registerMessageElement}
                    onJumpToMessage={jumpToMessage}
                    onReply={() => startReplyTo(message)}
                    onStartEdit={() => startEditingMessage(message)}
                    onEditDraftChange={setEditDraft}
                    onCancelEdit={cancelEditingMessage}
                    onSaveEdit={() => saveEditedMessage(message)}
                    onDelete={() => handleDeleteMessage(message)}
                    onSetUrgency={(urgency) =>
                      handleSetMessageUrgency(message, urgency)
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleSendMessage}
          className="grid gap-3 border-t border-slate-200 pt-4"
        >
          <label
            htmlFor="support-message"
            className="text-sm font-semibold text-slate-800"
          >
            New message
          </label>

          {replyingTo ? (
            <ReplyingToPreview
              replyTo={replyingTo}
              onCancel={() => setReplyingTo(null)}
            />
          ) : null}

          <MathInputEditor
            ref={messageComposerRef}
            id="support-message"
            value={draftMessage}
            onChange={setDraftMessage}
            placeholder="Write a message or insert maths..."
            maxLength={2000}
            tone="light"
          />

          <MathSymbolPalette
            tone="light"
            onInsert={(snippet) =>
              messageComposerRef.current?.insertSnippet(snippet)
            }
          />

          <div className="grid gap-2">
            <input
              ref={fileInputRef}
              id="message-attachments"
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              onChange={handleFilesSelected}
              className="hidden"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                >
                  Attach files
                </Button>

                <p className="text-xs text-slate-500">
                  Images, PDFs, documents or screenshots up to 10MB each. Demo stores file details only.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setScheduleTab('availability'); setIsScheduleOpen(true); }}
                  disabled={isSending}
                >
                  Schedule session
                </Button>
              </div>
            </div>

            {selectedFiles.length > 0 ? (
              <SelectedAttachmentList
                files={selectedFiles}
                onRemove={removeSelectedFile}
              />
            ) : null}
          </div>

          {canMarkNewMessageUrgent ? (
            <UrgentToggle
              isChecked={isUrgent}
              canEmailTutor={canEmailTutorForUrgentMessage(relationship)}
              onChange={setIsUrgent}
            />
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {draftMessage.trim().length}/2000 characters
            </p>

            <Button type="submit" disabled={!canSendMessage}>
              {isSending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </form>
      </Card>

      {isScheduleOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={handleCloseSchedule}
          />

          <div className="relative m-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-950">
                Schedule a session with{' '}
                {viewerRole === 'student' ? relationship?.tutorName : relationship?.studentName}
              </h2>
              <button
                type="button"
                onClick={handleCloseSchedule}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1">
              {(['availability', 'booking'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setScheduleTab(tab)}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition',
                    scheduleTab === tab
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  )}
                >
                  {tab === 'availability' ? 'My availability' : 'Book session'}
                </button>
              ))}
            </div>

            {/* Tab: My availability */}
            {scheduleTab === 'availability' ? (
              <div className="mt-4">
                <StudentAvailabilityGrid
                  blocks={availabilityBlocks}
                  selectedBlockId={availSelectedBlockId}
                  onSelectBlock={setAvailSelectedBlockId}
                  onAddTimeRange={addGridRange}
                  onDeleteBlock={removeAvailBlock}
                  onResizeBlock={resizeAvailBlock}
                />
                <div className="mt-4 flex justify-end gap-3">
                  <Button variant="secondary" onClick={handleCloseSchedule}>
                    Close without saving
                  </Button>
                  <Button onClick={handleSaveAvailability}>Save availability</Button>
                </div>
              </div>
            ) : null}

            {/* Tab: Book session */}
            {scheduleTab === 'booking' && canOpenBooking && bookingTutorId && bookingStudentId ? (
              <div className="mt-4">
                <DragToBookCalendar
                  tutorId={bookingTutorId}
                  studentId={bookingStudentId}
                  counterpartyName={
                    viewerRole === 'student'
                      ? (relationship?.tutorName ?? '')
                      : (relationship?.studentName ?? '')
                  }
                  initiatedBy={viewerRole}
                  studentAvailabilityBlocks={
                    viewerRole === 'student' ? availabilityBlocks : counterpartyStudentBlocks
                  }
                  onSuccess={handleCloseSchedule}
                  onCancel={handleCloseSchedule}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

    </div>
  );
}


type MathSymbolGroup = {
  label: string;
  symbols: { label: string; insert: string; hint?: string }[];
};

/**
 * Maths templates used by the message composer.
 *
 * These insert lightweight LaTeX-style snippets, then the app renders the
 * supported snippets into visual maths in previews and sent messages. Keeping
 * the stored value as text means messages still work in Firestore and remain
 * editable, while fractions, roots, integrals and matrices display like maths.
 */
const CURSOR_MARKER = "[[cursor]]";

const MATH_SYMBOL_GROUPS: MathSymbolGroup[] = [
  {
    label: "Templates",
    symbols: [
      { label: "fraction", insert: `\\frac{${CURSOR_MARKER}}{}`, hint: "Custom fraction template" },
      { label: "power", insert: `^{${CURSOR_MARKER}}`, hint: "Custom exponent" },
      { label: "x²", insert: "^{2}", hint: "Squared" },
      { label: "x³", insert: "^{3}", hint: "Cubed" },
      { label: "root", insert: `\\sqrt{${CURSOR_MARKER}}`, hint: "Square root" },
      { label: "nth root", insert: `\\sqrt[n]{${CURSOR_MARKER}}`, hint: "nth root template" },
      { label: "subscript", insert: `_{${CURSOR_MARKER}}`, hint: "Subscript template" },
      { label: "abs", insert: `\\left|${CURSOR_MARKER}\\right|`, hint: "Absolute value" },
      { label: "norm", insert: `\\left\\|${CURSOR_MARKER}\\right\\|`, hint: "Vector norm" },
      { label: "piecewise", insert: `f(x) = {\n  ${CURSOR_MARKER}, if \n  , if \n}`, hint: "Piecewise function" },
      { label: "system", insert: `{\n  ${CURSOR_MARKER}\n  \n}`, hint: "System of equations" },
      { label: "equation", insert: `${CURSOR_MARKER} = `, hint: "Equation starter" },
    ],
  },
  {
    label: "Calculus",
    symbols: [
      { label: "∫ limits", insert: `\\int_{${CURSOR_MARKER}}^{} f(x)\\,dx`, hint: "Definite integral with editable limits" },
      { label: "∫", insert: `\\int ${CURSOR_MARKER}\\,dx`, hint: "Indefinite integral" },
      { label: "∫∫", insert: `\\iint_{${CURSOR_MARKER}} f(x,y)\\,dA`, hint: "Double integral" },
      { label: "∫∫∫", insert: `\\iiint_{${CURSOR_MARKER}} f(x,y,z)\\,dV`, hint: "Triple integral" },
      { label: "d/dx", insert: `\\frac{d}{dx}(${CURSOR_MARKER})`, hint: "Derivative with respect to x" },
      { label: "\\frac{dy}{dx}", insert: "\\frac{dy}{dx}", hint: "First derivative" },
      { label: "\\frac{d²y}{dx²}", insert: "\\frac{d²y}{dx²}", hint: "Second derivative" },
      { label: "∂/∂x", insert: `\\frac{∂}{∂x}(${CURSOR_MARKER})`, hint: "Partial derivative" },
      { label: "∂²/∂x²", insert: `\\frac{∂²}{∂x²}(${CURSOR_MARKER})`, hint: "Second partial derivative" },
      { label: "lim", insert: `\\lim_{x\\to ${CURSOR_MARKER}} f(x)`, hint: "Limit template" },
      { label: "Σ limits", insert: `\\sum_{${CURSOR_MARKER}}^{} `, hint: "Summation with limits" },
      { label: "Π limits", insert: `\\prod_{${CURSOR_MARKER}}^{} `, hint: "Product with limits" },
      { label: "∇", insert: "∇", hint: "Gradient / del" },
      { label: "∇²", insert: "∇²", hint: "Laplacian" },
      { label: "f′(x)", insert: "f′(x)", hint: "First derivative notation" },
      { label: "f″(x)", insert: "f″(x)", hint: "Second derivative notation" },
    ],
  },
  {
    label: "Matrices",
    symbols: [
      { label: "2×2", insert: `\\begin{bmatrix}${CURSOR_MARKER} &  \\\\  &  \\end{bmatrix}`, hint: "2 by 2 matrix" },
      { label: "3×3", insert: `\\begin{bmatrix}${CURSOR_MARKER} &  &  \\\\  &  &  \\\\  &  &  \\end{bmatrix}`, hint: "3 by 3 matrix" },
      { label: "2×1", insert: `\\begin{bmatrix}${CURSOR_MARKER} \\\\  \\end{bmatrix}`, hint: "Column vector" },
      { label: "3×1", insert: `\\begin{bmatrix}${CURSOR_MARKER} \\\\  \\\\  \\end{bmatrix}`, hint: "3D column vector" },
      { label: "det", insert: `\\det\\left(\\begin{bmatrix}${CURSOR_MARKER} & \\\\  & \\end{bmatrix}\\right)`, hint: "Determinant" },
      { label: "inverse", insert: `A^(-1)`, hint: "Inverse matrix" },
      { label: "transpose", insert: `A^T`, hint: "Transpose" },
      { label: "identity", insert: "I", hint: "Identity matrix" },
      { label: "rank", insert: `\\operatorname{rank}(${CURSOR_MARKER})`, hint: "Matrix rank" },
      { label: "eigen", insert: `Av = λv`, hint: "Eigenvalue equation" },
    ],
  },
  {
    label: "Algebra",
    symbols: [
      { label: "±", insert: "±" },
      { label: "∓", insert: "∓" },
      { label: "≈", insert: "≈" },
      { label: "≠", insert: "≠" },
      { label: "≤", insert: "≤" },
      { label: "≥", insert: "≥" },
      { label: "≡", insert: "≡", hint: "Identically equal / congruent" },
      { label: "∝", insert: "∝", hint: "Proportional to" },
      { label: "∞", insert: "∞" },
      { label: "⌊x⌋", insert: `\\lfloor ${CURSOR_MARKER} \\rfloor`, hint: "Floor" },
      { label: "⌈x⌉", insert: `\\lceil ${CURSOR_MARKER} \\rceil`, hint: "Ceiling" },
      { label: "factorial", insert: "!" },
      { label: "mod", insert: ` mod ` },
      { label: "|", insert: " | ", hint: "Divides" },
    ],
  },
  {
    label: "Functions",
    symbols: [
      { label: "sin", insert: `\\sin(${CURSOR_MARKER})` },
      { label: "cos", insert: `\\cos(${CURSOR_MARKER})` },
      { label: "tan", insert: `\\tan(${CURSOR_MARKER})` },
      { label: "arcsin", insert: `\\arcsin(${CURSOR_MARKER})` },
      { label: "arccos", insert: `\\arccos(${CURSOR_MARKER})` },
      { label: "arctan", insert: `\\arctan(${CURSOR_MARKER})` },
      { label: "ln", insert: `\\ln(${CURSOR_MARKER})` },
      { label: "log base", insert: `\\log_{${CURSOR_MARKER}}()`, hint: "Logarithm with custom base" },
      { label: "exp", insert: `\\exp(${CURSOR_MARKER})` },
      { label: "e^x", insert: `e^{${CURSOR_MARKER}}` },
      { label: "→", insert: "→" },
      { label: "↦", insert: "↦" },
      { label: "domain", insert: `domain: ${CURSOR_MARKER}` },
      { label: "range", insert: `range: ${CURSOR_MARKER}` },
    ],
  },
  {
    label: "Vectors",
    symbols: [
      { label: "vector", insert: `⃗`, hint: "Vector arrow mark" },
      { label: "dot", insert: " · ", hint: "Dot product" },
      { label: "cross", insert: " × ", hint: "Cross product" },
      { label: "unit", insert: "î, ĵ, k̂", hint: "Unit vectors" },
      { label: "angle", insert: "∠" },
      { label: "parallel", insert: "∥" },
      { label: "perp", insert: "⊥" },
      { label: "degrees", insert: "°" },
      { label: "magnitude", insert: `\\left|${CURSOR_MARKER}\\right|` },
      { label: "component", insert: `(${CURSOR_MARKER}, , )`, hint: "Vector/component tuple" },
    ],
  },
  {
    label: "Stats",
    symbols: [
      { label: "P(A)", insert: `P(${CURSOR_MARKER})`, hint: "Probability" },
      { label: "P(A|B)", insert: `P(${CURSOR_MARKER} | )`, hint: "Conditional probability" },
      { label: "E[X]", insert: `E[${CURSOR_MARKER}]`, hint: "Expectation" },
      { label: "Var", insert: `\\operatorname{Var}(${CURSOR_MARKER})` },
      { label: "SD", insert: `\\operatorname{SD}(${CURSOR_MARKER})` },
      { label: "N(μ,σ²)", insert: `N(${CURSOR_MARKER}, \\sigma^{2})`, hint: "Normal distribution" },
      { label: "μ", insert: "μ" },
      { label: "σ²", insert: "σ²" },
      { label: "x̄", insert: "x̄", hint: "Sample mean" },
      { label: "nCr", insert: `\\binom{${CURSOR_MARKER}}{r}`, hint: "Combinations" },
      { label: "nPr", insert: `P(${CURSOR_MARKER}, r)`, hint: "Permutations" },
      { label: "∑", insert: "∑" },
    ],
  },
  {
    label: "Sets/logic",
    symbols: [
      { label: "∈", insert: "∈" },
      { label: "∉", insert: "∉" },
      { label: "⊂", insert: "⊂" },
      { label: "⊆", insert: "⊆" },
      { label: "∪", insert: "∪" },
      { label: "∩", insert: "∩" },
      { label: "∅", insert: "∅" },
      { label: "∀", insert: "∀" },
      { label: "∃", insert: "∃" },
      { label: "¬", insert: "¬" },
      { label: "∧", insert: "∧" },
      { label: "∨", insert: "∨" },
      { label: "⇒", insert: "⇒" },
      { label: "⇔", insert: "⇔" },
      { label: "ℕ", insert: "ℕ" },
      { label: "ℤ", insert: "ℤ" },
      { label: "ℚ", insert: "ℚ" },
      { label: "ℝ", insert: "ℝ" },
      { label: "ℂ", insert: "ℂ" },
    ],
  },
  {
    label: "Greek",
    symbols: [
      { label: "α", insert: "α" },
      { label: "β", insert: "β" },
      { label: "γ", insert: "γ" },
      { label: "Γ", insert: "Γ" },
      { label: "δ", insert: "δ" },
      { label: "Δ", insert: "Δ" },
      { label: "ε", insert: "ε" },
      { label: "η", insert: "η" },
      { label: "θ", insert: "θ" },
      { label: "λ", insert: "λ" },
      { label: "μ", insert: "μ" },
      { label: "ν", insert: "ν" },
      { label: "ξ", insert: "ξ" },
      { label: "π", insert: "π" },
      { label: "ρ", insert: "ρ" },
      { label: "σ", insert: "σ" },
      { label: "Σ", insert: "Σ" },
      { label: "τ", insert: "τ" },
      { label: "φ", insert: "φ" },
      { label: "Φ", insert: "Φ" },
      { label: "χ", insert: "χ" },
      { label: "ψ", insert: "ψ" },
      { label: "ω", insert: "ω" },
      { label: "Ω", insert: "Ω" },
    ],
  },
];

function MathSymbolPalette({
  tone,
  compact = false,
  onInsert,
}: {
  tone: "light" | "dark";
  compact?: boolean;
  onInsert: (snippet: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(MATH_SYMBOL_GROUPS[0]?.label ?? "Templates");
  const [searchTerm, setSearchTerm] = useState("");
  const selectedGroup =
    MATH_SYMBOL_GROUPS.find((group) => group.label === activeGroup) ??
    MATH_SYMBOL_GROUPS[0];
  const trimmedSearchTerm = searchTerm.trim().toLowerCase();
  const visibleSymbols = selectedGroup?.symbols.filter((symbol) => {
    if (!trimmedSearchTerm) {
      return true;
    }

    return [symbol.label, symbol.insert, symbol.hint ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(trimmedSearchTerm);
  });

  return (
    <div
      className={cn(
        "rounded-2xl border",
        tone === "dark"
          ? "border-white/15 bg-white/5"
          : "border-slate-200 bg-slate-50",
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs font-semibold transition",
          tone === "dark"
            ? "text-slate-200 hover:bg-white/10"
            : "text-slate-700 hover:bg-white",
        )}
        aria-expanded={isOpen}
      >
        <span>{compact ? "Maths tools" : "Insert maths / equation template"}</span>
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen ? (
        <div
          className={cn(
            "grid gap-3 border-t px-3 py-3",
            tone === "dark" ? "border-white/15" : "border-slate-200",
          )}
        >
          <div className="flex flex-wrap gap-2">
            {MATH_SYMBOL_GROUPS.map((group) => {
              const isActive = group.label === selectedGroup?.label;
              return (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => {
                    setActiveGroup(group.label);
                    setSearchTerm("");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    tone === "dark"
                      ? isActive
                        ? "bg-white text-slate-950"
                        : "bg-white/10 text-slate-200 hover:bg-white/15"
                      : isActive
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-600 hover:text-slate-950",
                  )}
                >
                  {group.label}
                </button>
              );
            })}
          </div>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={`Search ${selectedGroup?.label.toLowerCase()} tools...`}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-xs outline-none transition",
              tone === "dark"
                ? "border-white/15 bg-white/10 text-white placeholder:text-slate-400 focus:border-white"
                : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400",
            )}
          />

          <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
            {visibleSymbols?.length ? (
              visibleSymbols.map((symbol) => (
                <button
                  key={`${selectedGroup.label}-${symbol.label}-${symbol.insert}`}
                  type="button"
                  onClick={() => onInsert(symbol.insert)}
                  title={symbol.hint ?? symbol.label}
                  className={cn(
                    "min-w-10 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                    tone === "dark"
                      ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-100",
                  )}
                >
                  <span className="block">{symbol.label}</span>
                  {symbol.hint ? (
                    <span
                      className={cn(
                        "mt-1 block text-[10px] font-medium leading-4",
                        tone === "dark" ? "text-slate-300" : "text-slate-500",
                      )}
                    >
                      {symbol.hint}
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <p
                className={cn(
                  "text-xs",
                  tone === "dark" ? "text-slate-300" : "text-slate-500",
                )}
              >
                No matching maths tools in this category.
              </p>
            )}
          </div>

          <p
            className={cn(
              "text-xs leading-5",
              tone === "dark" ? "text-slate-300" : "text-slate-500",
            )}
          >
            Insert a maths structure, fill the blanks, and check the rendered preview. Fractions, roots, limits and matrices are displayed visually in sent messages.
          </p>
        </div>
      ) : null}
    </div>
  );
}

type MathInputHandle = {
  focus: () => void;
  insertSnippet: (snippet: string) => void;
};

type MathInputEditorProps = {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  maxLength?: number;
  tone: "light" | "dark";
};

/**
 * A lightweight in-message maths editor.
 *
 * The underlying message is still stored as plain text, but recognised maths
 * snippets are displayed as non-editable inline maths blocks while the user is
 * composing. This gives the Wolfram-style feel of maths appearing inside the
 * input itself without needing a paid/large equation-editor dependency.
 */
const MathInputEditor = forwardRef<MathInputHandle, MathInputEditorProps>(
  function MathInputEditor(
    { id, value, onChange, placeholder, maxLength = 2000, tone },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      const currentSerializedValue = serializeMathInput(editor);
      const shouldReplaceDom =
        document.activeElement !== editor || value === "" || currentSerializedValue !== value;

      if (shouldReplaceDom) {
        renderMathInputValue(editor, value, tone);
      }
    }, [value, tone]);

    useImperativeHandle(ref, () => ({
      focus() {
        editorRef.current?.focus();
      },
      insertSnippet(snippet: string) {
        const editor = editorRef.current;
        if (!editor) {
          return;
        }

        editor.focus();
        const visibleSnippet = snippet.replace(CURSOR_MARKER, "");
        const fragment = document.createDocumentFragment();
        appendMathInputNodes(fragment, visibleSnippet, tone);
        insertFragmentAtCurrentSelection(editor, fragment);

        const nextValue = serializeMathInput(editor).slice(0, maxLength);
        onChange(nextValue);
      },
    }), [maxLength, onChange, tone]);

    function handleInput() {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      const nextValue = serializeMathInput(editor).slice(0, maxLength);
      onChange(nextValue);
    }

    function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      document.execCommand("insertText", false, "\n");
      handleInput();
    }

    function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
      event.preventDefault();
      const pastedText = event.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, pastedText);
      handleInput();
    }

    const isEmpty = value.trim().length === 0;

    return (
      <div className="relative">
        {isEmpty ? (
          <span
            className={cn(
              "pointer-events-none absolute left-4 top-3 text-sm",
              tone === "dark" ? "text-slate-400" : "text-slate-400",
              isFocused ? "opacity-60" : "opacity-100",
            )}
          >
            {placeholder}
          </span>
        ) : null}
        <div
          id={id}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={cn(
            "min-h-28 w-full rounded-2xl border px-4 py-3 text-sm leading-7 outline-none transition whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            tone === "dark"
              ? "border-white/20 bg-white/10 text-white focus:border-white"
              : "border-slate-200 bg-white text-slate-900 focus:border-slate-950",
          )}
        />
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "dark" ? "text-slate-300" : "text-slate-500",
          )}
        >
          Maths appears directly in the input. Use the tools below for fractions, integrals, matrices and symbols.
        </p>
      </div>
    );
  },
);

MathInputEditor.displayName = "MathInputEditor";

function renderMathInputValue(
  editor: HTMLDivElement,
  value: string,
  tone: "light" | "dark",
) {
  editor.replaceChildren();
  appendMathInputNodes(editor, value, tone);
}

function appendMathInputNodes(
  parent: Node,
  value: string,
  tone: "light" | "dark",
) {
  RENDERABLE_MATH_PATTERN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = RENDERABLE_MATH_PATTERN.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parent.appendChild(document.createTextNode(value.slice(lastIndex, match.index)));
    }

    parent.appendChild(createMathInputChip(match[0], tone));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    parent.appendChild(document.createTextNode(value.slice(lastIndex)));
  }
}

function createMathInputChip(source: string, tone: "light" | "dark") {
  const chip = document.createElement("span");
  chip.dataset.mathSource = source;
  chip.contentEditable = "false";
  chip.className = [
    "mx-1",
    "inline-flex",
    "min-h-8",
    "items-center",
    "rounded-lg",
    "border",
    "px-2",
    "py-1",
    "align-middle",
    "font-serif",
    "shadow-sm",
    tone === "dark"
      ? "border-white/20 bg-white/15 text-white"
      : "border-violet-200 bg-violet-50 text-slate-950",
  ].join(" ");
  chip.innerHTML = renderMathTokenHtml(source);
  return chip;
}

function serializeMathInput(editor: HTMLElement) {
  return Array.from(editor.childNodes)
    .map((node) => serializeMathInputNode(node))
    .join("");
}

function serializeMathInputNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (!(node instanceof HTMLElement)) {
    return "";
  }

  const mathSource = node.dataset.mathSource;
  if (mathSource) {
    return mathSource;
  }

  if (node.tagName === "BR") {
    return "\n";
  }

  return Array.from(node.childNodes)
    .map((childNode) => serializeMathInputNode(childNode))
    .join("");
}

function insertFragmentAtCurrentSelection(editor: HTMLElement, fragment: DocumentFragment) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !editor.contains(selection.anchorNode)) {
    editor.appendChild(fragment);
    editor.appendChild(document.createTextNode(" "));
    moveCaretToEnd(editor);
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const spacer = document.createTextNode(" ");
  fragment.appendChild(spacer);
  range.insertNode(fragment);
  range.setStartAfter(spacer);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function moveCaretToEnd(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function renderMathTokenHtml(source: string) {
  const fraction = source.match(/^\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
  if (fraction) {
    return `<span class="inline-grid grid-rows-[auto_auto] place-items-center text-center leading-none"><span class="border-b border-current px-2 pb-0.5">${mathHtmlPart(fraction[1])}</span><span class="px-2 pt-0.5">${mathHtmlPart(fraction[2])}</span></span>`;
  }

  const binomial = source.match(/^\\binom\{([^{}]*)\}\{([^{}]*)\}$/);
  if (binomial) {
    return `<span class="inline-flex items-center gap-1"><span class="text-2xl leading-none">(</span><span class="grid grid-rows-2 place-items-center text-sm leading-none"><span>${mathHtmlPart(binomial[1])}</span><span>${mathHtmlPart(binomial[2])}</span></span><span class="text-2xl leading-none">)</span></span>`;
  }

  const root = source.match(/^\\sqrt\{([^{}]*)\}$/);
  if (root) {
    return `<span class="inline-flex items-start"><span class="text-xl leading-none">√</span><span class="border-t border-current px-2 leading-6">${mathHtmlPart(root[1])}</span></span>`;
  }

  const nthRoot = source.match(/^\\sqrt\[([^\]]*)\]\{([^{}]*)\}$/);
  if (nthRoot) {
    return `<span class="inline-flex items-start"><sup class="mr-0.5 text-[0.65em] leading-none">${mathHtmlPart(nthRoot[1])}</sup><span class="text-xl leading-none">√</span><span class="border-t border-current px-2 leading-6">${mathHtmlPart(nthRoot[2])}</span></span>`;
  }

  const boundedOperator = source.match(/^\\(int|sum|prod)_\{([^{}]*)\}\^\{([^{}]*)\}$/);
  if (boundedOperator) {
    const symbol = boundedOperator[1] === "int" ? "∫" : boundedOperator[1] === "sum" ? "Σ" : "Π";
    return `<span class="inline-grid grid-rows-[auto_auto_auto] place-items-center leading-none"><span class="text-[0.65em]">${mathHtmlPart(boundedOperator[3])}</span><span class="text-2xl leading-none">${symbol}</span><span class="text-[0.65em]">${mathHtmlPart(boundedOperator[2])}</span></span>`;
  }

  if (source.startsWith("\\begin{bmatrix}")) {
    const matrixBody = source
      .replace(/^\\begin\{bmatrix\}/, "")
      .replace(/\\end\{bmatrix\}$/, "");
    const rows = matrixBody
      .split(/\\\\/)
      .map((row) => row.split("&").map((cell) => cell.trim()));
    const rowsHtml = rows
      .map((row) => `<span class="grid grid-flow-col gap-x-4">${row.map((cell) => `<span>${mathHtmlPart(cell)}</span>`).join("")}</span>`)
      .join("");

    return `<span class="inline-flex items-stretch"><span class="border-l-2 border-current px-1"></span><span class="grid gap-y-1 px-1 text-center text-sm leading-none">${rowsHtml}</span><span class="border-r-2 border-current px-1"></span></span>`;
  }

  return escapeHtml(source);
}

function mathHtmlPart(value: string | undefined) {
  const cleanedValue = (value ?? "").trim();
  return cleanedValue ? escapeHtml(cleanedValue) : "□";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function MathText({
  value,
  isMine,
  className,
}: {
  value: string;
  isMine: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
        className,
      )}
    >
      {renderMathText(value, isMine)}
    </div>
  );
}

const RENDERABLE_MATH_PATTERN =
  /(\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\}|\\frac\{[^{}]*\}\{[^{}]*\}|\\binom\{[^{}]*\}\{[^{}]*\}|\\sqrt\[[^\]]*\]\{[^{}]*\}|\\sqrt\{[^{}]*\}|\\int_\{[^{}]*\}\^\{[^{}]*\}|\\sum_\{[^{}]*\}\^\{[^{}]*\}|\\prod_\{[^{}]*\}\^\{[^{}]*\})/g;

function renderMathText(value: string, isMine: boolean) {
  const nodes: ReactNode[] = [];
  RENDERABLE_MATH_PATTERN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = RENDERABLE_MATH_PATTERN.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index));
    }

    nodes.push(
      <MathNode key={`${match.index}-${match[0]}`} source={match[0]} isMine={isMine} />,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes;
}

function MathNode({ source, isMine }: { source: string; isMine: boolean }) {
  const fraction = source.match(/^\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
  if (fraction) {
    return (
      <InlineFraction
        numerator={fraction[1] ?? ""}
        denominator={fraction[2] ?? ""}
        isMine={isMine}
      />
    );
  }

  const binomial = source.match(/^\\binom\{([^{}]*)\}\{([^{}]*)\}$/);
  if (binomial) {
    return (
      <span className={cn("mx-1 inline-flex items-center gap-0.5 align-middle", isMine ? "text-white" : "text-slate-950")}>
        <span className="text-xl leading-none">(</span>
        <span className="grid grid-rows-2 place-items-center text-[0.85em] leading-none">
          <span><MathPart value={binomial[1] ?? ""} /></span>
          <span><MathPart value={binomial[2] ?? ""} /></span>
        </span>
        <span className="text-xl leading-none">)</span>
      </span>
    );
  }

  const root = source.match(/^\\sqrt\{([^{}]*)\}$/);
  if (root) {
    return <RootExpression radicand={root[1] ?? ""} isMine={isMine} />;
  }

  const nthRoot = source.match(/^\\sqrt\[([^\]]*)\]\{([^{}]*)\}$/);
  if (nthRoot) {
    return (
      <RootExpression
        index={nthRoot[1] ?? ""}
        radicand={nthRoot[2] ?? ""}
        isMine={isMine}
      />
    );
  }

  const boundedOperator = source.match(/^\\(int|sum|prod)_\{([^{}]*)\}\^\{([^{}]*)\}$/);
  if (boundedOperator) {
    const symbol = boundedOperator[1] === "int" ? "∫" : boundedOperator[1] === "sum" ? "Σ" : "Π";
    return (
      <BoundedOperator
        symbol={symbol}
        lower={boundedOperator[2] ?? ""}
        upper={boundedOperator[3] ?? ""}
        isMine={isMine}
      />
    );
  }

  if (source.startsWith("\\begin{bmatrix}")) {
    return <MatrixExpression source={source} isMine={isMine} />;
  }

  return source;
}

function MathPart({ value }: { value: string }) {
  const cleanedValue = value.trim();
  return <>{cleanedValue || "□"}</>;
}

function InlineFraction({
  numerator,
  denominator,
  isMine,
}: {
  numerator: string;
  denominator: string;
  isMine: boolean;
}) {
  return (
    <span
      className={cn(
        "mx-1 inline-grid translate-y-1 grid-rows-[auto_auto] place-items-center align-middle text-center text-[0.9em] leading-none",
        isMine ? "text-white" : "text-slate-950",
      )}
    >
      <span className="border-b border-current px-1 pb-0.5">
        <MathPart value={numerator} />
      </span>
      <span className="px-1 pt-0.5">
        <MathPart value={denominator} />
      </span>
    </span>
  );
}

function RootExpression({
  index,
  radicand,
  isMine,
}: {
  index?: string;
  radicand: string;
  isMine: boolean;
}) {
  return (
    <span className={cn("mx-1 inline-flex items-start align-middle", isMine ? "text-white" : "text-slate-950")}>
      {index ? <sup className="mr-0.5 text-[0.65em] leading-none"><MathPart value={index} /></sup> : null}
      <span className="text-lg leading-none">√</span>
      <span className="border-t border-current px-1 leading-5">
        <MathPart value={radicand} />
      </span>
    </span>
  );
}

function BoundedOperator({
  symbol,
  lower,
  upper,
  isMine,
}: {
  symbol: string;
  lower: string;
  upper: string;
  isMine: boolean;
}) {
  return (
    <span className={cn("mx-1 inline-flex items-center align-middle", isMine ? "text-white" : "text-slate-950")}>
      <span className="grid grid-rows-[auto_auto_auto] place-items-center leading-none">
        <span className="text-[0.62em]"><MathPart value={upper} /></span>
        <span className="text-xl leading-none">{symbol}</span>
        <span className="text-[0.62em]"><MathPart value={lower} /></span>
      </span>
    </span>
  );
}

function MatrixExpression({ source, isMine }: { source: string; isMine: boolean }) {
  const matrixBody = source
    .replace(/^\\begin\{bmatrix\}/, "")
    .replace(/\\end\{bmatrix\}$/, "");
  const rows = matrixBody
    .split(/\\\\/)
    .map((row) => row.split("&").map((cell) => cell.trim()));

  return (
    <span className={cn("mx-1 inline-flex items-stretch align-middle", isMine ? "text-white" : "text-slate-950")}>
      <span className="border-y-0 border-l-2 border-current px-1" />
      <span className="grid gap-y-1 px-1 text-center text-[0.9em] leading-none">
        {rows.map((row, rowIndex) => (
          <span key={`${source}-row-${rowIndex}`} className="grid grid-flow-col gap-x-3">
            {row.map((cell, cellIndex) => (
              <span key={`${source}-cell-${rowIndex}-${cellIndex}`}>
                <MathPart value={cell} />
              </span>
            ))}
          </span>
        ))}
      </span>
      <span className="border-y-0 border-r-2 border-current px-1" />
    </span>
  );
}

function UrgentToggle({
  isChecked,
  canEmailTutor,
  onChange,
}: {
  isChecked: boolean;
  canEmailTutor: boolean;
  onChange: (isChecked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600"
      />
      <span>
        <span className="block font-semibold">Mark as urgent</span>
        <span className="mt-1 block leading-5 text-red-800">
          This flags the message for your tutor and opens a pre-filled email
          draft addressed to them after sending.
        </span>
        {!canEmailTutor ? (
          <span className="mt-1 block text-xs font-medium text-red-700">
            Tutor email is missing for this relationship, so the in-app urgent
            flag will still save but the email draft may not open.
          </span>
        ) : null}
      </span>
    </label>
  );
}

function openUrgentEmailDraftOrShowFallback({
  relationship,
  studentName,
  messageBody,
  attachmentCount,
}: {
  relationship: StudentTutorRelationship | null;
  studentName: string;
  messageBody: string;
  attachmentCount: number;
}) {
  if (!relationship) {
    window.alert(
      "Urgent flag saved, but relationship details could not be loaded for the email draft.",
    );
    return;
  }

  try {
    openUrgentMessageEmailDraft({
      relationship,
      studentName,
      messageBody,
      attachmentCount,
    });
  } catch {
    window.alert(
      "Urgent flag saved, but the tutor email is missing for this relationship.",
    );
  }
}

function MessageBubble({
  message,
  isMine,
  isEditing,
  isHighlighted,
  editDraft,
  isBusy,
  canEditOrDelete,
  canChangeUrgency,
  onReply,
  onStartEdit,
  onEditDraftChange,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onSetUrgency,
  onRegisterElement,
  onJumpToMessage,
}: {
  message: SupportMessage;
  isMine: boolean;
  isEditing: boolean;
  isHighlighted: boolean;
  editDraft: string;
  isBusy: boolean;
  canEditOrDelete: boolean;
  canChangeUrgency: boolean;
  onReply: () => void;
  onStartEdit: () => void;
  onEditDraftChange: (body: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onSetUrgency: (urgency: MessageUrgency) => void;
  onRegisterElement: (
    messageId: string,
    element: HTMLDivElement | null,
  ) => void;
  onJumpToMessage: (messageId: string) => void;
}) {
  const isDeleted = message.isDeleted === true;

  return (
    <div
      className={cn("flex min-w-0", isMine ? "justify-end" : "justify-start")}
    >
      <div
        ref={(element) => onRegisterElement(message.id, element)}
        className={cn(
          "group relative min-w-0 max-w-[min(42rem,85%)] scroll-mt-24 overflow-visible rounded-3xl px-4 py-3 pr-11 transition-shadow duration-300",
          isMine ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900",
          isHighlighted ? "ring-4 ring-yellow-300 ring-offset-2" : "",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold",
              isMine ? "text-slate-200" : "text-slate-600",
            )}
          >
            {isMine ? "You" : message.senderName || "Unknown user"}
          </span>

          {!isDeleted && message.urgency === "urgent" ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
                isMine ? "bg-red-500 text-white" : "bg-red-100 text-red-700",
              )}
            >
              Urgent
            </span>
          ) : null}

          <span
            className={cn(
              "text-xs",
              isMine ? "text-slate-400" : "text-slate-500",
            )}
          >
            {formatMessageTime(message.createdAt)}
            {isEdited(message) ? " · edited" : ""}
          </span>
        </div>

        {!isEditing && !isDeleted ? (
          <div className="absolute right-2 top-2">
            <MessageActionsDropdown
              isMine={isMine}
              isUrgent={message.urgency === "urgent"}
              isBusy={isBusy}
              canEditOrDelete={canEditOrDelete}
              canChangeUrgency={canChangeUrgency}
              onReply={onReply}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
              onSetUrgency={onSetUrgency}
            />
          </div>
        ) : null}

        {message.replyTo ? (
          <QuotedReplyCard
            replyTo={message.replyTo}
            isMine={isMine}
            onClick={() => onJumpToMessage(message.replyTo?.messageId ?? "")}
          />
        ) : null}

        {isDeleted ? (
          <DeletedMessageNotice isMine={isMine} />
        ) : isEditing ? (
          <EditMessageForm
            value={editDraft}
            isMine={isMine}
            isBusy={isBusy}
            hasAttachments={message.attachments.length > 0}
            onChange={onEditDraftChange}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            {message.body ? (
              <MathText
                value={message.body}
                isMine={isMine}
                className="mt-2 text-sm leading-6"
              />
            ) : null}

            {message.attachments.length > 0 ? (
              <AttachmentList
                attachments={message.attachments}
                isMine={isMine}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function DeletedMessageNotice({ isMine }: { isMine: boolean }) {
  return (
    <p
      className={cn(
        "mt-2 text-sm italic leading-6",
        isMine ? "text-slate-300" : "text-slate-500",
      )}
    >
      This message was deleted
    </p>
  );
}

function EditMessageForm({
  value,
  isMine,
  isBusy,
  hasAttachments,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  isMine: boolean;
  isBusy: boolean;
  hasAttachments: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const editComposerRef = useRef<MathInputHandle | null>(null);
  const canSave = Boolean(value.trim() || hasAttachments) && !isBusy;

  return (
    <div className="mt-3 grid gap-2">
      <MathInputEditor
        ref={editComposerRef}
        value={value}
        onChange={onChange}
        placeholder="Edit your message..."
        maxLength={2000}
        tone={isMine ? "dark" : "light"}
      />
      <MathSymbolPalette
        tone={isMine ? "dark" : "light"}
        compact
        onInsert={(snippet) => editComposerRef.current?.insertSnippet(snippet)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
            isMine
              ? "bg-white text-slate-950 hover:bg-slate-100"
              : "bg-slate-950 text-white hover:bg-slate-800",
          )}
        >
          {isBusy ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
            isMine
              ? "text-slate-300 hover:text-white"
              : "text-slate-500 hover:text-slate-950",
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MessageActionsDropdown({
  isMine,
  isUrgent,
  isBusy,
  canEditOrDelete,
  canChangeUrgency,
  onReply,
  onStartEdit,
  onDelete,
  onSetUrgency,
}: {
  isMine: boolean;
  isUrgent: boolean;
  isBusy: boolean;
  canEditOrDelete: boolean;
  canChangeUrgency: boolean;
  onReply: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onSetUrgency: (urgency: MessageUrgency) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function runAction(action: () => void) {
    setIsOpen(false);
    action();
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Message options"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-full text-base leading-none opacity-0 transition group-hover:opacity-100 focus:opacity-100",
          isOpen ? "opacity-100" : "",
          isMine
            ? "text-slate-300 hover:bg-white/10 hover:text-white"
            : "text-slate-500 hover:bg-white hover:text-slate-950",
        )}
      >
        ⌄
      </button>

      {isOpen ? (
        <div
          className={cn(
            "absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-xl",
          )}
        >
          <DropdownAction onClick={() => runAction(onReply)}>
            Reply
          </DropdownAction>

          {canChangeUrgency ? (
            <DropdownAction
              disabled={isBusy}
              onClick={() =>
                runAction(() => onSetUrgency(isUrgent ? "normal" : "urgent"))
              }
            >
              {isUrgent ? "Remove urgent" : "Mark urgent"}
            </DropdownAction>
          ) : null}

          {canEditOrDelete ? (
            <>
              <DropdownAction
                disabled={isBusy}
                onClick={() => runAction(onStartEdit)}
              >
                Edit
              </DropdownAction>
              <DropdownAction
                variant="danger"
                disabled={isBusy}
                onClick={() => runAction(onDelete)}
              >
                Delete
              </DropdownAction>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DropdownAction({
  children,
  disabled = false,
  variant = "default",
  onClick,
}: {
  children: string;
  disabled?: boolean;
  variant?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "block w-full px-4 py-2.5 text-left font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
      )}
    >
      {children}
    </button>
  );
}

function ReplyingToPreview({
  replyTo,
  onCancel,
}: {
  replyTo: ReplyToMessageSummary;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="min-w-0 border-l-4 border-slate-400 pl-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Replying to {replyTo.senderName || "message"}
        </p>
        <p className="mt-1 line-clamp-2 break-words text-sm text-slate-700 [overflow-wrap:anywhere]">
          {formatReplyPreview(replyTo)}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-950"
      >
        Cancel
      </button>
    </div>
  );
}

function QuotedReplyCard({
  replyTo,
  isMine,
  onClick,
}: {
  replyTo: ReplyToMessageSummary;
  isMine: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Jump to original message"
      className={cn(
        "mt-3 block w-full rounded-2xl border-l-4 px-3 py-2 text-left text-sm transition",
        isMine
          ? "border-white/40 bg-white/10 text-slate-100 hover:bg-white/15"
          : "border-slate-400 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      <span
        className={cn(
          "block text-xs font-semibold",
          isMine ? "text-slate-200" : "text-slate-600",
        )}
      >
        {replyTo.senderName || "Message"}
      </span>
      <span
        className={cn(
          "mt-1 block line-clamp-2 break-words [overflow-wrap:anywhere]",
          isMine ? "text-slate-300" : "text-slate-600",
        )}
      >
        {formatReplyPreview(replyTo)}
      </span>
    </button>
  );
}

function AttachmentList({
  attachments,
  isMine,
}: {
  attachments: SupportAttachment[];
  isMine: boolean;
}) {
  return (
    <div className="mt-3 grid gap-2">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          isMine={isMine}
        />
      ))}
    </div>
  );
}

function AttachmentItem({
  attachment,
  isMine,
}: {
  attachment: SupportAttachment;
  isMine: boolean;
}) {
  const baseClassName = cn(
    "block min-w-0 max-w-full rounded-2xl border px-3 py-2 text-left text-sm break-words transition [overflow-wrap:anywhere]",
    isMine
      ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  );

  const content = (
    <>
      <span className="font-semibold">{attachmentLabel(attachment.kind)}</span>{" "}
      <span className="break-words [overflow-wrap:anywhere]">
        {attachment.name}
      </span>
      <span
        className={cn(
          "ml-2 text-xs",
          isMine ? "text-slate-300" : "text-slate-500",
        )}
      >
        {formatFileSize(attachment.sizeBytes)}
      </span>
      {!attachment.isPreviewAvailable ? (
        <span
          className={cn(
            "mt-1 block text-xs",
            isMine ? "text-slate-300" : "text-slate-500",
          )}
        >
          Demo attachment: too poor to pay for Firebase Storage.
        </span>
      ) : null}
    </>
  );

  if (attachment.url && attachment.isPreviewAvailable !== false) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className={baseClassName}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={baseClassName}
      onClick={() => {
        window.alert("Too poor to pay for Firebase Storage :(");
      }}
    >
      {content}
    </button>
  );
}

function SelectedAttachmentList({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (fileIndex: number) => void;
}) {
  return (
    <div className="grid gap-2 rounded-2xl bg-slate-50 p-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${index}`}
          className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
        >
          <span className="min-w-0 truncate">
            {file.name}{" "}
            <span className="text-xs text-slate-500">
              {formatFileSize(file.size)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-950"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function UnreadDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
        Unread messages
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function getViewerLastSeenMessagesAt(
  relationship: StudentTutorRelationship | null,
  viewerRole: AsyncSupportRole,
) {
  if (!relationship) {
    return undefined;
  }

  return viewerRole === "student"
    ? relationship.studentLastSeenMessagesAt
    : relationship.tutorLastSeenMessagesAt;
}

function getFirstUnreadMessageId({
  messages,
  currentUserId,
  previousLastSeenMessagesAt,
}: {
  messages: SupportMessage[];
  currentUserId?: string;
  previousLastSeenMessagesAt?: string;
}) {
  if (!currentUserId) {
    return undefined;
  }

  const firstUnreadMessage = messages.find((message) => {
    if (message.senderId === currentUserId) {
      return false;
    }

    if (!previousLastSeenMessagesAt) {
      return true;
    }

    return message.createdAt > previousLastSeenMessagesAt;
  });

  return firstUnreadMessage?.id;
}

function buildReplySummary(message: SupportMessage): ReplyToMessageSummary {
  return {
    messageId: message.id,
    senderId: message.senderId,
    senderName: message.senderName || "Unknown user",
    bodyPreview: buildReplyBodyPreview(message),
    attachmentCount: message.attachments.length,
    createdAt: message.createdAt,
  };
}

function buildReplyBodyPreview(message: SupportMessage) {
  if (message.isDeleted) {
    return "This message was deleted";
  }

  const bodyPreview = message.body.replace(/\s+/g, " ").trim();

  if (bodyPreview) {
    return bodyPreview.length > 140
      ? `${bodyPreview.slice(0, 139)}…`
      : bodyPreview;
  }

  if (message.attachments.length === 1) {
    return `Attachment: ${message.attachments[0]?.name ?? "file"}`;
  }

  if (message.attachments.length > 1) {
    return `${message.attachments.length} attachments`;
  }

  return "Message";
}

function formatReplyPreview(replyTo: ReplyToMessageSummary) {
  const preview = replyTo.bodyPreview || "Message";

  if (replyTo.attachmentCount <= 0) {
    return preview;
  }

  const suffix = `${replyTo.attachmentCount} attachment${replyTo.attachmentCount === 1 ? "" : "s"}`;

  if (preview.toLowerCase().includes("attachment")) {
    return preview;
  }

  return `${preview} · ${suffix}`;
}

function attachmentLabel(kind: SupportAttachment["kind"]) {
  if (kind === "image") {
    return "Image";
  }

  if (kind === "pdf") {
    return "PDF";
  }

  return "File";
}

function formatFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "";
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)}KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatMessageTime(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isEdited(message: SupportMessage) {
  return Boolean(message.updatedAt && message.updatedAt !== message.createdAt);
}
