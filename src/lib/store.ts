import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    serverId: string | null;
    serverName: string | null;
    login: (id: string, name: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            serverId: null,
            serverName: null,
            login: (id, name) => set({ serverId: id, serverName: name }),
            logout: () => set({ serverId: null, serverName: null }),
        }),
        {
            name: 'linux-system-auth',
        }
    )
);

export interface Message {
    id: string
    role: "user" | "ai"
    content: string
    command?: string
    explanation?: string
    status?: "pending" | "running" | "success" | "error"
    result?: string
    resultExplanation?: string
    timestamp: number
}

interface ChatState {
    messages: Record<string, Message[]>; // サーバーIDごとに履歴を保存
    addMessage: (serverId: string, message: Message) => void;
    updateMessage: (serverId: string, messageId: string, updates: Partial<Message>) => void;
    clearOldMessages: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: {},
            addMessage: (serverId, message) => set((state) => ({
                messages: {
                    ...state.messages,
                    [serverId]: [...(state.messages[serverId] || []), message]
                }
            })),
            updateMessage: (serverId, messageId, updates) => set((state) => ({
                messages: {
                    ...state.messages,
                    [serverId]: (state.messages[serverId] || []).map(m => m.id === messageId ? { ...m, ...updates } : m)
                }
            })),
            clearOldMessages: () => set((state) => {
                const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const newMessages: Record<string, Message[]> = {};
                for (const serverId in state.messages) {
                    newMessages[serverId] = state.messages[serverId].filter(m => m.timestamp > oneMonthAgo);
                }
                return { messages: newMessages };
            })
        }),
        {
            name: 'linux-ai-chat-history',
        }
    )
);
