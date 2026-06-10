"use client";

/**
 * File purpose:
 * Shared message thread for student and tutor support routes.
 *
 * The thread supports live updates, unread dividers, generic demo attachments,
 * WhatsApp-style replies, and owner-controlled message edits/deletes.
 */

import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent as ReactDragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MathKeyboard,
  MATH_PLACEHOLDER,
  moveToNextMathPlaceholder,
} from "@/domains/async-support/components/MathKeyboard";
import {
  MathRenderer,
  normalizeMathMessage,
  stripMathDelimiters,
} from "@/domains/async-support/components/MathRenderer";
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
} from "@/domains/async-support/types/asyncSupport";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { cn } from "@/shared/utils/cn";
import { getFilesFromClipboard } from "@/shared/utils/clipboardFiles";
import { DragToBookCalendar } from "@/domains/booking/components/DragToBookCalendar";
import { useRelationshipBookings } from "@/domains/booking/hooks/useRelationshipBookings";
import type { BookingRequest } from "@/domains/booking/types/booking";
import { StudentAvailabilityGrid } from "@/domains/students/learning-profile/components/StudentAvailabilityGrid";
import {
  createManualTimeBlock,
  mergeTimeBlocks,
} from "@/domains/students/learning-profile/utils/timeBlocks";
import {
  getStoredLearningProfile,
  getStudentAvailabilityById,
  getStudentLearningProfileById,
  updateStoredLearningProfile,
} from "@/domains/students/learning-profile/services/learningProfileStorage";
import {
  getTutorProfile,
  getTutorProfileDraft,
  saveTutorProfileFromOnboarding,
} from "@/domains/tutors/tutor-discovery/services/tutorProfileService";
import { TutorProfileModal } from "@/domains/tutors/tutor-discovery/components/TutorProfileModal";
import { StudentProfileModal } from "@/domains/students/learning-profile/components/StudentProfileModal";
import type { Tutor } from "@/domains/tutors/tutor-discovery/types/tutor";
import type { AuthUser } from "@/domains/auth/types/auth";
import type {
  Day,
  StudentLearningProfile,
  TimeBlock,
} from "@/domains/students/learning-profile/types/learningProfile";
import type { TutorProfileDraft } from "@/domains/tutors/tutor-discovery/services/tutorProfileService";

type MessageThreadProps = {
  relationshipId: string;
  viewerRole: AsyncSupportRole;
  density?: "default" | "embedded";
  showHeader?: boolean;
};

type CurrentThreadUser = AuthUser | null;

const RESOURCE_DRAG_MIME_TYPE = 'application/x-logicgate-resource';
const RESOURCE_DRAG_START_EVENT = 'logicgate-resource-drag-start';
const RESOURCE_DRAG_END_EVENT = 'logicgate-resource-drag-end';

export function MessageThread({
  relationshipId,
  viewerRole,
  density = "default",
  showHeader = true,
}: MessageThreadProps) {
  const isEmbedded = density === "embedded";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDoneRef = useRef(false);
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
  const [isMathKeyboardOpen, setIsMathKeyboardOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"availability" | "booking">(
    "availability",
  );
  const [availabilityBlocks, setAvailabilityBlocks] = useState<TimeBlock[]>([]);
  const [availSelectedBlockId, setAvailSelectedBlockId] = useState<
    string | null
  >(null);
  const [tutorDraft, setTutorDraft] = useState<TutorProfileDraft | null>(null);
  const [counterpartyStudentBlocks, setCounterpartyStudentBlocks] = useState<
    TimeBlock[]
  >([]);
  const [tutorProfileModal, setTutorProfileModal] = useState<Tutor | null>(null);
  const [isLoadingTutorProfile, setIsLoadingTutorProfile] = useState(false);
  const [studentProfileModal, setStudentProfileModal] = useState<{
    studentName: string;
    profile: StudentLearningProfile;
  } | null>(null);
  const [isLoadingStudentProfile, setIsLoadingStudentProfile] = useState(false);

  async function handleTutorNameClick() {
    if (!relationship?.tutorId || isLoadingTutorProfile) return;
    setIsLoadingTutorProfile(true);
    try {
      const profile = await getTutorProfile(relationship.tutorId);
      setTutorProfileModal(profile);
    } finally {
      setIsLoadingTutorProfile(false);
    }
  }

  async function handleStudentNameClick() {
    if (!relationship?.studentId || isLoadingStudentProfile) return;
    setIsLoadingStudentProfile(true);
    try {
      const profile = await getStudentLearningProfileById(relationship.studentId);
      setStudentProfileModal({
        studentName: relationship.studentName,
        profile,
      });
    } finally {
      setIsLoadingStudentProfile(false);
    }
  }

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
        if (currentUser.role === "student") {
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
    if (
      !isScheduleOpen ||
      !relationship?.studentId ||
      currentUser?.role !== "tutor"
    )
      return;
    let isActive = true;
    getStudentAvailabilityById(relationship.studentId)
      .then((blocks) => {
        if (isActive) setCounterpartyStudentBlocks(blocks);
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
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

  useEffect(() => {
    initialScrollDoneRef.current = false;
  }, [relationshipId]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container || isLoading) return;

    if (!initialScrollDoneRef.current) {
      const scrollToBottom = () => {
        container.scrollTop = container.scrollHeight;
      };
      scrollToBottom();
      requestAnimationFrame(() => {
        scrollToBottom();
        initialScrollDoneRef.current = true;
      });
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading, relationshipId]);

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

    const trimmedMessage = normalizeMathMessage(draftMessage).trim();

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
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
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
    window.requestAnimationFrame(() => textareaRef.current?.focus());
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
    const trimmedEdit = normalizeMathMessage(editDraft).trim();

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

  function addSelectedFiles(files: File[]) {
    if (files.length === 0) return;

    setSelectedFiles((currentFiles) => {
      const availableSlots = Math.max(0, 5 - currentFiles.length);
      const nextFiles = files.slice(0, availableSlots);

      if (files.length > availableSlots) {
        setError("You can attach up to 5 files per message.");
      }

      return [...currentFiles, ...nextFiles];
    });
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    addSelectedFiles(files);
  }

  function handleMessagePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = getFilesFromClipboard(event.clipboardData);
    if (files.length === 0) return;

    event.preventDefault();
    addSelectedFiles(files);
    textareaRef.current?.focus();
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
        current.map((b) => (b.id === blockId ? { ...b, from, to } : b)),
      ),
    );
  }

  function removeAvailBlock(block: TimeBlock) {
    setAvailabilityBlocks((current) =>
      current.filter((b) => b.id !== block.id),
    );
    setAvailSelectedBlockId(null);
  }

  async function handleSaveAvailability() {
    try {
      if (!currentUser) return;

      const merged = mergeTimeBlocks(availabilityBlocks);

      if (currentUser.role === "student") {
        await updateStoredLearningProfile({ availability: merged });
      } else {
        // save tutor draft availability; preserve other draft fields if we loaded one
        if (tutorDraft) {
          await saveTutorProfileFromOnboarding(currentUser, {
            ...tutorDraft,
            availability: merged,
          });
        }
      }
      // Keep the modal open so the user can switch to the booking tab immediately
    } catch {
      window.alert("Could not save availability.");
    }
  }

  function handleCloseSchedule() {
    setIsScheduleOpen(false);
  }

  const bookingTutorId =
    currentUser?.role === "student" ? relationship?.tutorId : currentUser?.id;
  const bookingTutorName =
    currentUser?.role === "student"
      ? relationship?.tutorName
      : currentUser?.name;
  const bookingStudentId =
    currentUser?.role === "student" ? currentUser.id : relationship?.studentId;
  const bookingInitiatedBy = currentUser?.role;
  const canOpenBooking = Boolean(
    relationship &&
    bookingTutorId &&
    bookingTutorName &&
    bookingStudentId &&
    bookingInitiatedBy,
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

  const { upcomingSession } = useRelationshipBookings(
    relationship?.tutorId,
    relationship?.studentId,
  );

  return (
    <div
      className={cn("grid min-w-0 gap-4", isEmbedded && "gap-3 text-[13px]")}
    >
      {!isEmbedded && showHeader ? (
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Message thread
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this space for support between sessions. New messages
            appear automatically, and unread messages are marked when you open
            the thread.
          </p>

          {relationship ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Conversation with:</span>{" "}
                {viewerRole === "student" ? (
                  <button
                    type="button"
                    onClick={() => void handleTutorNameClick()}
                    disabled={isLoadingTutorProfile}
                    className="font-medium underline-offset-2 hover:underline disabled:opacity-60"
                  >
                    {isLoadingTutorProfile ? "Loading..." : relationship.tutorName}
                  </button>
                ) : (
                  relationship.studentName
                )}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Subject:</span>{" "}
                {relationship.level} {relationship.subject}
              </p>
            </div>
          ) : null}

          {upcomingSession ? (
            <UpcomingSessionBanner booking={upcomingSession} />
          ) : null}
        </Card>
      ) : null}

      <Card
        className={cn(
          "grid min-w-0 gap-4",
          isEmbedded && "rounded-2xl p-3 shadow-none",
        )}
      >
        {isLoading ? (
          <p className="text-sm text-slate-600">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">
              No messages yet
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Send a message or attach a file to start this conversation.
            </p>
          </div>
        ) : (
          <div
            ref={messagesScrollRef}
            className="max-h-[min(28rem,55vh)] overflow-y-auto pr-1"
          >
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
                    relationshipId={relationshipId}
                    message={message}
                    onSenderNameClick={
                      message.senderRole === "tutor"
                        ? () => void handleTutorNameClick()
                        : () => void handleStudentNameClick()
                    }
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
          
          <textarea
            ref={textareaRef}
            id="support-message"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onInput={(event) => {
              const el = event.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            onPaste={handleMessagePaste}
            onKeyDown={(event) => {
              // Tab remains an optional shortcut for moving between maths slots.
              if (event.key === "Tab") {
                const ta = event.currentTarget;
                if (ta.value.includes(MATH_PLACEHOLDER)) {
                  event.preventDefault();
                  moveToNextMathPlaceholder(ta);
                }
              }
            }}
            placeholder="Write a message..."
            rows={1}
            maxLength={2000}
            style={{ maxHeight: "10rem" }}
            className="w-full resize-none overflow-y-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
          />

          {/* Live rendered preview - shown whenever the draft contains $...$ math */}
          {draftMessage.includes("$") ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Preview
              </p>
              <div className="text-sm leading-6 text-slate-900">
                <MathRenderer value={normalizeMathMessage(draftMessage)} />
              </div>
            </div>
          ) : null}

          {isMathKeyboardOpen ? (
            <MathKeyboard
              textareaRef={textareaRef}
              onValueChange={setDraftMessage}
              isOpen={isMathKeyboardOpen}
              onClose={() => setIsMathKeyboardOpen(false)}
            />
          ) : null}

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

            <div
              className={cn(
                "flex items-start justify-between gap-3",
                isEmbedded && "flex-col",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isEmbedded && "flex-wrap gap-2",
                )}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className={isEmbedded ? "px-3 py-2 text-xs" : ""}
                >
                  Attach files
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsMathKeyboardOpen((prev) => !prev);
                    // Re-focus textarea after toggling so caret is preserved
                    requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
                  disabled={isSending}
                  className={cn(
                    isMathKeyboardOpen ? "border-slate-950 bg-slate-50" : "",
                    isEmbedded ? "px-3 py-2 text-xs" : "",
                  )}
                >
                  ∑ Math
                </Button>

                {!isEmbedded ? (
                  <p className="text-xs text-slate-500">
                    Images, PDFs, documents, and pasted screenshots up to 10MB each.
                  </p>
                ) : null}
              </div>

              {!isEmbedded ? (
                <div className="flex shrink-0 items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setScheduleTab("availability");
                      setIsScheduleOpen(true);
                    }}
                    disabled={isSending}
                  >
                    Schedule session
                  </Button>
                </div>
              ) : null}
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

            <Button
              type="submit"
              disabled={!canSendMessage}
              className={isEmbedded ? "px-4 py-2 text-xs" : ""}
            >
              {isSending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </form>
      </Card>

      {tutorProfileModal ? (
        <TutorProfileModal
          tutor={tutorProfileModal}
          readOnly
          onClose={() => setTutorProfileModal(null)}
        />
      ) : null}

      {studentProfileModal ? (
        <StudentProfileModal
          studentName={studentProfileModal.studentName}
          profile={studentProfileModal.profile}
          onClose={() => setStudentProfileModal(null)}
        />
      ) : null}

      {isScheduleOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={handleCloseSchedule}
          />

          <div className="relative m-auto flex max-h-[min(90vh,48rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-950">
                {scheduleTab === "availability"
                  ? "Change availability"
                  : `Book a session with ${
                      viewerRole === "student"
                        ? relationship?.tutorName
                        : relationship?.studentName
                    }`}
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
              {(["availability", "booking"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setScheduleTab(tab)}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                    scheduleTab === tab
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-950",
                  )}
                >
                  {tab === "availability" ? "My availability" : "Book session"}
                </button>
              ))}
            </div>

            {/* Tab: My availability */}
            {scheduleTab === "availability" ? (
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
                  <Button onClick={handleSaveAvailability}>
                    Save availability
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Tab: Book session */}
            {scheduleTab === "booking" &&
            canOpenBooking &&
            bookingTutorId &&
            bookingStudentId ? (
              <div className="mt-4">
                <DragToBookCalendar
                  tutorId={bookingTutorId}
                  studentId={bookingStudentId}
                  counterpartyName={
                    viewerRole === "student"
                      ? (relationship?.tutorName ?? "")
                      : (relationship?.studentName ?? "")
                  }
                  initiatedBy={viewerRole}
                  studentAvailabilityBlocks={
                    viewerRole === "student"
                      ? availabilityBlocks
                      : counterpartyStudentBlocks
                  }
                  onSuccess={handleCloseSchedule}
                  onCancel={handleCloseSchedule}
                />
              </div>
            ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
  relationshipId,
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
  onSenderNameClick,
}: {
  relationshipId: string;
  message: SupportMessage;
  onSenderNameClick?: () => void;
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
          <button
            type="button"
            onClick={onSenderNameClick}
            disabled={!onSenderNameClick}
            className={cn(
              "text-xs font-semibold underline-offset-2 hover:underline disabled:pointer-events-none disabled:no-underline",
              isMine ? "text-slate-200" : "text-slate-600",
            )}
          >
            {isMine ? "You" : message.senderName || "Unknown user"}
          </button>

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
              <p className="mt-2 text-sm leading-6">
                <MathRenderer value={message.body} />
              </p>
            ) : null}

            {message.attachments.length > 0 ? (
              <AttachmentList
                relationshipId={relationshipId}
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
  const canSave = Boolean(value.trim() || hasAttachments) && !isBusy;

  return (
    <div className="mt-3 grid gap-2">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={2000}
        className={cn(
          "w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition",
          isMine
            ? "border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus:border-white"
            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-950",
        )}
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
  relationshipId,
  attachments,
  isMine,
}: {
  relationshipId: string;
  attachments: SupportAttachment[];
  isMine: boolean;
}) {
  return (
    <div className="mt-3 grid gap-2">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          relationshipId={relationshipId}
          attachment={attachment}
          isMine={isMine}
        />
      ))}
    </div>
  );
}

function AttachmentItem({
  relationshipId,
  attachment,
  isMine,
}: {
  relationshipId: string;
  attachment: SupportAttachment;
  isMine: boolean;
}) {
  const baseClassName = cn(
    "block min-w-0 max-w-full rounded-2xl border text-left text-sm break-words transition [overflow-wrap:anywhere]",
    isMine
      ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  );

  function handleAttachmentDragStart(event: ReactDragEvent<HTMLAnchorElement>) {
    if (!attachment.url) return;

    event.dataTransfer.setData(
      RESOURCE_DRAG_MIME_TYPE,
      JSON.stringify({
        relationshipId,
        title: attachment.name,
        url: attachment.url,
        contentType: attachment.contentType,
        kind: attachment.kind,
        sizeBytes: attachment.sizeBytes,
      }),
    );
    event.dataTransfer.effectAllowed = "copy";
    window.dispatchEvent(new CustomEvent(RESOURCE_DRAG_START_EVENT));
  }

  function handleAttachmentDragEnd() {
    window.dispatchEvent(new CustomEvent(RESOURCE_DRAG_END_EVENT));
  }

  const metaLine = (
    <div
      className={cn(
        "min-w-0 overflow-hidden px-3 py-2 text-xs",
        isMine ? "text-slate-300" : "text-slate-500",
      )}
    >
      <p className="min-w-0 truncate" title={attachment.name}>
        <span className="font-semibold">{attachmentLabel(attachment.kind)}</span>
        {" · "}
        <span>{attachment.name}</span>
      </p>
      <p className="mt-0.5">{formatFileSize(attachment.sizeBytes)}</p>
    </div>
  );

  if (attachment.url && attachment.kind === "image") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        draggable
        onDragStart={handleAttachmentDragStart}
        onDragEnd={handleAttachmentDragEnd}
        className={cn(baseClassName, "overflow-hidden p-0")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-64 w-full bg-slate-950/5 object-contain"
        />
        {metaLine}
      </a>
    );
  }

  if (attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        draggable
        onDragStart={handleAttachmentDragStart}
        onDragEnd={handleAttachmentDragEnd}
        className={cn(baseClassName, "px-3 py-2")}
      >
        <div className="min-w-0 overflow-hidden">
          <p className="truncate" title={attachment.name}>
            <span className="font-semibold">{attachmentLabel(attachment.kind)}</span>{" "}
            <span>{attachment.name}</span>
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              isMine ? "text-slate-300" : "text-slate-500",
            )}
          >
            {formatFileSize(attachment.sizeBytes)}
          </p>
        </div>
      </a>
    );
  }

  return (
    <div className={cn(baseClassName, "px-3 py-2 opacity-70")}>
      <div className="min-w-0 overflow-hidden">
        <p className="truncate" title={attachment.name}>
          <span className="font-semibold">{attachmentLabel(attachment.kind)}</span>{" "}
          <span>{attachment.name}</span>
        </p>
        <p
          className={cn(
            "mt-0.5 text-xs",
            isMine ? "text-slate-300" : "text-slate-500",
          )}
        >
          {formatFileSize(attachment.sizeBytes)}
        </p>
      </div>
      <span
        className={cn(
          "mt-1 block text-xs",
          isMine ? "text-slate-300" : "text-slate-500",
        )}
      >
        File unavailable - it may have been uploaded before storage was enabled.
      </span>
    </div>
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
    <div className="grid min-w-0 max-w-full gap-2 overflow-hidden rounded-2xl bg-slate-50 p-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${index}`}
          className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
        >
          <div className="min-w-0 overflow-hidden">
            <p className="truncate font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
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

  const bodyPreview = stripMathDelimiters(message.body)
    .replace(/\s+/g, " ")
    .trim();

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

function UpcomingSessionBanner({ booking }: { booking: BookingRequest }) {
  const sessionDate = booking.date.toDate();
  const dateLabel = sessionDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = sessionDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Upcoming session
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {booking.subject} · {dateLabel} at {timeLabel} ·{" "}
        {booking.durationMinutes} min
      </p>
    </div>
  );
}
