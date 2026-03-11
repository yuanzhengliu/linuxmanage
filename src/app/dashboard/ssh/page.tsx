"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, TerminalSquare, AlertCircle, CheckCircle2, ChevronRight, Terminal as TerminalIcon, Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"

type LogEntry = {
    id: string
    command: string
    output?: string
    status: "running" | "success" | "error"
}

const COMMON_COMMANDS = [
    { label: "ディスク容量 (df -h)", cmd: "df -h" },
    { label: "メモリ状況 (free -m)", cmd: "free -m" },
    { label: "稼働時間 (uptime)", cmd: "uptime" },
    { label: "プロセスTop(1回)", cmd: "top -b -n 1 | head -n 20" },
    { label: "ポート利用状況", cmd: "netstat -tulpn || ss -tulpn" },
]

export default function SSHTerminalPage() {
    const { serverId } = useAuthStore()
    const [input, setInput] = useState("")
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isExecuting, setIsExecuting] = useState(false)
    const logsEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [logs])

    const handleExecute = async (cmdToRun: string) => {
        if (!cmdToRun.trim() || isExecuting) return

        const logId = Date.now().toString()
        const newLog: LogEntry = {
            id: logId,
            command: cmdToRun,
            status: "running"
        }

        setLogs(prev => [...prev, newLog])
        setInput("")
        setIsExecuting(true)

        try {
            const response = await axios.post("/api/server/execute", {
                command: cmdToRun,
                serverId
            })

            setLogs(prev => prev.map(log =>
                log.id === logId ? { ...log, status: "success", output: response.data.output } : log
            ))
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } }
            setLogs(prev => prev.map(log =>
                log.id === logId ? { ...log, status: "error", output: err.response?.data?.error || "Execution failed" } : log
            ))
        } finally {
            setIsExecuting(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleExecute(input)
    }

    return (
        <div className="h-[calc(100dvh-12rem)] md:h-[calc(100vh-6rem)] flex flex-col pt-4">
            <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <TerminalSquare className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
                        SSH Terminal
                    </h1>
                    <p className="text-xs md:text-sm text-zinc-400 mt-2">
                        {serverId} に対して直接シェルコマンドを実行します。
                    </p>
                </div>
            </div>

            {/* Helper Chips / Fast Commands */}
            <div className="mb-4 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex gap-2">
                    {COMMON_COMMANDS.map((c) => (
                        <button
                            key={c.label}
                            onClick={() => handleExecute(c.cmd)}
                            disabled={isExecuting}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 text-[11px] md:text-xs text-zinc-300 transition-colors disabled:opacity-50"
                        >
                            <TerminalIcon className="w-3 h-3 inline mr-1 text-indigo-400" />
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="flex-1 flex flex-col border-white/10 bg-black/60 shadow-2xl overflow-hidden backdrop-blur-md relative">
                {/* Output Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                            <TerminalSquare className="w-12 h-12 mb-4 opacity-50" />
                            <p>実行したいコマンドを入力するか、上部のショートカットを選択してください。</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/80"
                                >
                                    <div className="bg-zinc-900 px-3 py-2 flex items-center justify-between border-b border-zinc-800">
                                        <div className="font-mono text-xs md:text-sm text-indigo-400 flex items-center gap-2 truncate pr-4">
                                            <span className="text-zinc-500">$</span> {log.command}
                                        </div>
                                        {log.status === "running" && <span className="text-[10px] text-yellow-500 flex items-center whitespace-nowrap"><Loader2 className="w-3 h-3 mr-1 animate-spin" />実行中</span>}
                                        {log.status === "success" && <span className="text-[10px] text-green-500 flex items-center whitespace-nowrap"><CheckCircle2 className="w-3 h-3 mr-1" />完了</span>}
                                        {log.status === "error" && <span className="text-[10px] text-red-500 flex items-center whitespace-nowrap"><AlertCircle className="w-3 h-3 mr-1" />エラー</span>}
                                    </div>
                                    {log.output && (
                                        <div className={`p-4 font-mono text-[10px] md:text-xs overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto ${log.status === 'error' ? 'text-red-400 outline outline-1 outline-red-900/50 -outline-offset-1 bg-red-950/20' : 'text-zinc-300'}`}>
                                            {log.output}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    <div ref={logsEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-4 bg-zinc-900/80 border-t border-white/10 backdrop-blur-xl shrink-0">
                    <form onSubmit={handleSubmit} className="relative flex items-center max-w-5xl mx-auto">
                        <div className="absolute left-4 z-10 text-indigo-500 font-mono font-bold pointer-events-none">
                            $
                        </div>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a command..."
                            className="font-mono pl-8 md:pl-10 pr-14 md:pr-16 bg-black/60 border-zinc-700/80 focus-visible:ring-indigo-500 h-12 md:h-14 rounded-full text-sm md:text-base shadow-inner"
                            disabled={isExecuting}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isExecuting}
                            className="absolute right-1.5 md:right-2 h-9 w-9 md:h-10 md:w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)]"
                        >
                            <Send className="w-3 h-3 md:w-4 md:h-4 ml-0.5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
