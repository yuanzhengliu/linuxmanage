"use client"

import { useEffect, useRef, useState } from "react"
import { TerminalSquare, Terminal as TerminalIcon, Maximize, Minimize } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { io, Socket } from "socket.io-client"
import { Terminal } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import "xterm/css/xterm.css"

const COMMON_COMMANDS = [
    { label: "ディスク容量 (df -h)", cmd: "df -h\n" },
    { label: "メモリ状況 (free -m)", cmd: "free -m\n" },
    { label: "稼働時間 (uptime)", cmd: "uptime\n" },
    { label: "プロセスTop(1回)", cmd: "top -b -n 1 | head -n 20\n" },
    { label: "ポート", cmd: "netstat -tulpn || ss -tulpn\n" },
]

export default function SSHTerminalPage() {
    const { serverId } = useAuthStore()
    const terminalRef = useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // xterm.js と Socket.io の実態を保持する参照
    const terminalInstance = useRef<Terminal | null>(null)
    const socketInstance = useRef<Socket | null>(null)
    const fitAddonInstance = useRef<FitAddon | null>(null)

    useEffect(() => {
        if (!terminalRef.current) return

        // 1. xterm.jsの初期化
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: "#0c0c0c",
                foreground: "#e4e4e7",
                cursor: "#e4e4e7",
                selectionBackground: "rgba(255, 255, 255, 0.3)"
            },
            fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
            fontSize: window.innerWidth < 768 ? 12 : 14,
            scrollback: 5000
        })
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(terminalRef.current)
        fitAddon.fit()

        terminalInstance.current = term
        fitAddonInstance.current = fitAddon

        // 2. Socket.IOの初期化
        const socket = io({
            path: "/api/socket/io",
        })
        socketInstance.current = socket

        socket.on("connect", () => {
            term.write(`\r\n*** Connected to Node.js PTY Server for ${serverId || 'local'} ***\r\n`)
            // PTYの初期化とサイズ同期
            socket.emit("init", { cols: term.cols, rows: term.rows })
        })

        socket.on("data", (data: string) => {
            term.write(data)
        })

        socket.on("disconnect", () => {
            term.write("\r\n*** Disconnected from server ***\r\n")
        })

        // 3. ユーザー入力の送信
        term.onData((data) => {
            socket.emit("data", data)
        })

        // 4. ウィンドウリサイズ時の同期
        const handleResize = () => {
            if (fitAddonInstance.current && terminalInstance.current && socketInstance.current) {
                fitAddonInstance.current.fit()
                socketInstance.current.emit("resize", {
                    cols: terminalInstance.current.cols,
                    rows: terminalInstance.current.rows
                })
            }
        }

        window.addEventListener("resize", handleResize)
        // 初期レイアウト遅延対応
        setTimeout(handleResize, 100)

        // クリーンアップ
        return () => {
            window.removeEventListener("resize", handleResize)
            socket.disconnect()
            term.dispose()
        }
    }, [serverId])

    // フルスクリーン切り替え時のリサイズ対応
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fitAddonInstance.current && terminalInstance.current && socketInstance.current) {
                fitAddonInstance.current.fit()
                socketInstance.current.emit("resize", {
                    cols: terminalInstance.current.cols,
                    rows: terminalInstance.current.rows
                })
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [isFullscreen])

    const handleFastCommand = (cmd: string) => {
        if (socketInstance.current && socketInstance.current.connected) {
            socketInstance.current.emit("data", cmd)
            if (terminalInstance.current) {
                terminalInstance.current.focus()
            }
        }
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    return (
        <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100] bg-black p-0' : 'h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-6rem)] pt-0 md:pt-4'}`}>
            {!isFullscreen && (
                <>
                    <div className="mb-2 md:mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hidden md:flex">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                                <TerminalSquare className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                                Interactive SSH Terminal
                            </h1>
                            <p className="text-[10px] md:text-xs text-zinc-400 mt-1">
                                リアルタイムでバックエンドのシェルと通信しています。`cd` コマンド等も使用可能です。
                            </p>
                        </div>
                    </div>

                    {/* Helper Chips / Fast Commands */}
                    <div className="mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0">
                        <div className="flex gap-1.5 md:gap-2">
                            {COMMON_COMMANDS.map((c) => (
                                <button
                                    key={c.label}
                                    onClick={() => handleFastCommand(c.cmd)}
                                    className="shrink-0 px-2.5 py-1 md:px-3 md:py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] md:text-xs text-zinc-300 transition-colors"
                                >
                                    <TerminalIcon className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-1 text-zinc-400" />
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Terminal Window */}
            <Card className={`flex-1 flex flex-col bg-[#0c0c0c] border border-zinc-800 shadow-2xl overflow-hidden relative ${isFullscreen ? 'rounded-none border-0' : 'rounded-none md:rounded-md -mx-4 md:mx-0'}`}>

                {/* Simulated Header bar */}
                <div className="bg-zinc-800/80 px-2 py-1 flex items-center shrink-0 border-b border-zinc-700/50 justify-between">
                    <div className="flex gap-1.5 opacity-80 pl-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-[9px] md:text-[10px] text-zinc-400 font-mono tracking-widest pointer-events-none">
                        {serverId || 'localhost'} - Node SSH PTY
                    </div>
                    <button
                        onClick={toggleFullscreen}
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-700 transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* xterm.js container */}
                <div
                    ref={terminalRef}
                    className="flex-1 overflow-hidden p-1 focus:outline-none bg-[#0c0c0c]"
                    style={{ height: '100%', width: '100%' }}
                />
            </Card>
        </div>
    )
}
