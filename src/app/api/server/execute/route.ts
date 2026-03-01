import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(req: Request) {
    try {
        const { command, serverId } = await req.json()

        if (!command) {
            return NextResponse.json({ error: "Command is required" }, { status: 400 })
        }

        // セキュリティ上の警告: 本来は危険なコマンド（rm -rf など）のブロックリストや
        // 実行ユーザーの権限制限（sudo等の制限）などのガバナンス機構が必要です。
        // 今回はデモ・ PoC 目的のため、渡されたコマンドを直接 child_process で実行します。

        console.log(`[EXEC] Server: ${serverId} / Command: ${command}`)

        let output = ""
        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 10000 })
            output = stdout || stderr
        } catch (execError: any) {
            // コマンドがエラー終了した場合も、その出力を返す
            output = execError.stdout || execError.stderr || execError.message
        }

        // 長すぎる出力はトリミング
        if (output.length > 5000) {
            output = output.substring(0, 5000) + "\n... [Output truncated]"
        }

        return NextResponse.json({ output: output.trim() || "Command executed successfully with no output." })

    } catch (error: any) {
        console.error("Command Execution Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to execute command on the server" },
            { status: 500 }
        )
    }
}
