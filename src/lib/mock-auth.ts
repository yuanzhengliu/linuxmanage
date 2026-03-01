// 認証用モックデータ (Server ID -> SSH接続情報のダミー)

export interface ServerConfig {
    id: string;
    name: string;
    host: string;
    user: string;
    port: number;
}

export const MOCK_SERVERS: Record<string, ServerConfig> = {
    "server-001": {
        id: "server-001",
        name: "Web API Server (Tokyo)",
        host: "192.168.1.10",
        user: "admin",
        port: 22,
    },
    "server-002": {
        id: "server-002",
        name: "Database Server (Osaka)",
        host: "192.168.1.20",
        user: "dbadmin",
        port: 22,
    },
    "server-003": {
        id: "server-003",
        name: "Batch Processing Node",
        host: "192.168.1.30",
        user: "batch_user",
        port: 2222,
    },
};

export function getServerConfig(serverId: string): ServerConfig | null {
    return MOCK_SERVERS[serverId] || null;
}
