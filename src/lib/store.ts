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
