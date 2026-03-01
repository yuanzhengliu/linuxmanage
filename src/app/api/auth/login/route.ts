import { NextResponse } from "next/server"
import { Client } from "ssh2"

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            )
        }

        // SSH接続を利用してローカル(localhost)のOSユーザーとして認証できるかテストする
        return await new Promise<NextResponse>((resolve) => {
            const conn = new Client()

            conn.on("ready", () => {
                // 認証成功
                conn.end()
                resolve(NextResponse.json({
                    success: true,
                    message: "Authentication successful",
                    serverName: `Local Linux Node (${username})`,
                    serverId: "localhost" // システム自身を表すモックID
                }))
            }).on("error", (err: any) => {
                // 認証失敗や接続エラー
                resolve(NextResponse.json(
                    { error: "Invalid username or password (SSH auth failed)" },
                    { status: 401 }
                ))
            }).connect({
                host: "127.0.0.1",
                port: 22,
                username: username,
                password: password,
                readyTimeout: 5000 // 5秒タイムアウト
            })
        })

    } catch (error: any) {
        console.error("Auth Error:", error)
        return NextResponse.json(
            { error: "Internal server error during authentication" },
            { status: 500 }
        )
    }
}
