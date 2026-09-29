"use client";

import { create } from "zustand";
import { channels, type ChatMessage } from "@/lib/community";
import { inboxThreads } from "@/lib/lms";

export type InboxNote = {
  id: string;
  from: "them" | "you";
  text: string;
  time: string;
};

type WorkspaceState = {
  communityActiveId: string;
  communityDraft: string;
  communitySent: Record<string, ChatMessage[]>;
  inboxActiveId: string;
  inboxDraft: string;
  inboxExtra: Record<string, InboxNote[]>;
  setCommunityActiveId: (id: string) => void;
  setCommunityDraft: (text: string) => void;
  sendCommunity: (channelId: string, text: string) => void;
  setInboxActiveId: (id: string) => void;
  setInboxDraft: (text: string) => void;
  sendInbox: (threadId: string, text: string) => void;
};

let messageSeq = 0;

function nextId(prefix: string) {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  communityActiveId: channels[0]?.id ?? "general",
  communityDraft: "",
  communitySent: {},
  inboxActiveId: inboxThreads[0]?.id ?? "",
  inboxDraft: "",
  inboxExtra: {},
  setCommunityActiveId: (id) => set({ communityActiveId: id }),
  setCommunityDraft: (text) => set({ communityDraft: text }),
  sendCommunity: (channelId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message: ChatMessage = {
      id: nextId(channelId),
      authorId: "you",
      text: trimmed,
      time: "الآن",
    };
    set((state) => ({
      communityDraft: "",
      communitySent: {
        ...state.communitySent,
        [channelId]: [...(state.communitySent[channelId] ?? []), message],
      },
    }));
  },
  setInboxActiveId: (id) => set({ inboxActiveId: id }),
  setInboxDraft: (text) => set({ inboxDraft: text }),
  sendInbox: (threadId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const note: InboxNote = {
      id: nextId(threadId),
      from: "you",
      text: trimmed,
      time: "الآن",
    };
    set((state) => ({
      inboxDraft: "",
      inboxExtra: {
        ...state.inboxExtra,
        [threadId]: [...(state.inboxExtra[threadId] ?? []), note],
      },
    }));
  },
}));
