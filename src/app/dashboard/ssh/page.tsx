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
            <div className="mb-2 md:mb-5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hidden md:flex">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                        <TerminalSquare className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                        SSH Terminal
                    </h1>
                    <p className="text-[10px] md:text-xs text-zinc-400 mt-1">
                        {serverId} に対して直接シェルコマンドを実行します。
                    </p>
                </div>
            </div>

            {/* Helper Chips / Fast Commands */}
            <div className="mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0">
                <div className="flex gap-1.5 md:gap-2">
                    {COMMON_COMMANDS.map((c) => (
                        <button
                            key={c.label}
                            onClick={() => handleExecute(c.cmd)}
                            disabled={isExecuting}
                            className="shrink-0 px-2.5 py-1 md:px-3 md:py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] md:text-xs text-zinc-300 transition-colors disabled:opacity-50"
                        >
                            <TerminalIcon className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-1 text-zinc-400" />
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Terminal Window (Tera Term Style) */}
            <Card className="flex-1 flex flex-col bg-[#0c0c0c] border border-zinc-800 shadow-2xl overflow-hidden relative rounded-none md:rounded-md -mx-4 md:mx-0">

                {/* Header bar simulated (Optional) */}
                <div className="bg-zinc-800/80 px-2 py-1 flex items-center shrink-0 border-b border-zinc-700/50">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="mx-auto text-[9px] md:text-[10px] text-zinc-400 font-mono tracking-widest">{serverId} - SSH</div>
                </div>

                {/* Output Area - Full Terminal Style */}
                <div className="flex-1 overflow-y-auto p-1 md:p-2 font-mono text-[10px] md:text-[13px] leading-tight md:leading-snug text-zinc-200">
                    <div className="space-y-0">
                        {history.map((line, i) => (
                            <div key={i} className={`whitespace-pre-wrap ${line.type === 'command' ? 'text-zinc-100 font-bold' :
                                line.type === 'error' ? 'text-red-400' :
                                    line.type === 'system' ? 'text-zinc-500' : 'text-zinc-300'
                                }`}>
                                {line.content}
                            </div>
                        ))}
                        {isExecuting && (
                            <div className="text-zinc-500 flex items-center animate-pulse">
                                ...
                            </div>
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Input Area (Integrated into Terminal) */}
                <div className="shrink-0 bg-[#0c0c0c]">
                    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
                        <div className="absolute left-1 md:left-2 z-10 text-zinc-300 font-mono font-bold pointer-events-none text-[10px] md:text-[13px]">
                            $
                        </div>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder=""
                            className="font-mono pl-4 md:pl-6 pr-10 bg-transparent border-none focus-visible:ring-0 h-8 md:h-10 rounded-none text-[10px] md:text-[13px] shadow-none text-zinc-100 placeholder:text-zinc-700 caret-zinc-200"
                            disabled={isExecuting}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isExecuting}
                            className="absolute right-0 h-8 w-8 md:h-10 md:w-10 rounded-none bg-transparent hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all shadow-none"
                        >
                            <Send className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
