"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, TerminalSquare, AlertCircle, CheckCircle2, ChevronRight, Terminal as TerminalIcon, Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"

type LogLine = {
    type: "system" | "command" | "output" | "error"
    content: string
}

const COMMON_COMMANDS = [
    { label: "ディスク容量 (df -h)", cmd: "df -h" },
    { label: "メモリ状況 (free -m)", cmd: "free -m" },
    { label: "稼働時間 (uptime)", cmd: "uptime" },
    { label: "プロセスTop(1回)", cmd: "top -b -n 1 | head -n 20" },
    { label: "ポート", cmd: "netstat -tulpn || ss -tulpn" },
]

export default function SSHTerminalPage() {
    const { serverId } = useAuthStore()
    const [input, setInput] = useState("")
    const [history, setHistory] = useState<LogLine[]>([
        { type: "system", content: `Connected to ${serverId || 'local server'}` }
    ])
    const [isExecuting, setIsExecuting] = useState(false)
    const logsEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [history, isExecuting])

    const handleExecute = async (cmdToRun: string) => {
        if (!cmdToRun.trim() || isExecuting) return

        setHistory(prev => [...prev, { type: "command", content: `$ ${cmdToRun}` }])
        setInput("")
        setIsExecuting(true)

        try {
            const response = await axios.post("/api/server/execute", {
                command: cmdToRun,
                serverId
            })
            // 出力があれば追加、なければ空行を追加
            setHistory(prev => [...prev, { type: "output", content: response.data.output || "" }])
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } }
            setHistory(prev => [...prev, { type: "error", content: err.response?.data?.error || "Execution failed" }])
        } finally {
            setIsExecuting(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleExecute(input)
    }

    return (
        <div className="h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-6rem)] flex flex-col pt-0 md:pt-4">
            <div className="mb-2 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hidden md:flex">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <TerminalSquare className="w-5 h-5 md:w-8 md:h-8 text-indigo-400" />
                        SSH Terminal
                    </h1>
                    <p className="text-[10px] md:text-sm text-zinc-400 mt-1">
                        {serverId} に対して直接シェルコマンドを実行します。
                    </p>
                </div>
            </div>

            {/* Helper Chips / Fast Commands */}
            <div className="mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex gap-1.5 md:gap-2">
                    {COMMON_COMMANDS.map((c) => (
                        <button
                            key={c.label}
                            onClick={() => handleExecute(c.cmd)}
                            disabled={isExecuting}
                            className="shrink-0 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 text-[10px] md:text-xs text-zinc-300 transition-colors disabled:opacity-50"
                        >
                            <TerminalIcon className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-1 text-indigo-400" />
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="flex-1 flex flex-col border-white/10 bg-black/90 shadow-2xl overflow-hidden backdrop-blur-md relative rounded-none md:rounded-xl">
                {/* Output Area - Full Terminal Style */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 font-mono text-[9px] md:text-xs">
                    <div className="space-y-1 md:space-y-1.5">
                        {history.map((line, i) => (
                            <div key={i} className={`whitespace-pre-wrap leading-relaxed ${line.type === 'command' ? 'text-indigo-400 font-bold' :
                                    line.type === 'error' ? 'text-red-400' :
                                        line.type === 'system' ? 'text-zinc-500 italic' : 'text-zinc-300'
                                }`}>
                                {line.content}
                            </div>
                        ))}
                        {isExecuting && (
                            <div className="text-yellow-500 flex items-center py-1">
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Executing...
                            </div>
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-2 md:p-4 bg-zinc-900/90 border-t border-zinc-800 shrink-0">
                    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
                        <div className="absolute left-3 md:left-4 z-10 text-indigo-500 font-mono font-bold pointer-events-none">
                            $
                        </div>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a command..."
                            className="font-mono pl-7 md:pl-10 pr-12 md:pr-14 bg-black/80 border-zinc-800 focus-visible:ring-indigo-500/50 h-10 md:h-12 rounded-md text-[11px] md:text-sm shadow-inner"
                            disabled={isExecuting}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isExecuting}
                            className="absolute right-1.5 md:right-2 h-7 w-7 md:h-8 md:w-8 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white transition-all shadow-[0_0_10px_-3px_rgba(79,70,229,0.3)]"
                        >
                            <Send className="w-3 h-3 md:w-3.5 md:h-3.5 ml-0.5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
