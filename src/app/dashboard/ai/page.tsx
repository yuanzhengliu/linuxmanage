"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, TerminalSquare, AlertCircle, CheckCircle2, Loader2, Bot, User, Play, ChevronRight } from "lucide-react"
import { useAuthStore } from "@/lib/store"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"

type Message = {
    id: string
    role: "user" | "ai"
    content: string
    command?: string
    status?: "pending" | "running" | "success" | "error"
    result?: string
}

export default function AITerminalPage() {
    const { serverId } = useAuthStore()
    const [osName, setOsName] = useState<string>("Linux")
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "ai",
            content: `Hello! I am your AI Server Assistant connected to ${serverId}. I can help you inspect the server, install software, or modify configurations. How can I help you today?`
        }
    ])
    const [input, setInput] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // AIターミナルを開いた際に実際のOS情報を取得しておく
        fetch("/api/server/status")
            .then(res => res.json())
            .then(data => {
                if (data.os) {
                    setOsName(data.os)
                    // 歓迎メッセージにOS名を付与
                    setMessages(prev => prev.map(m =>
                        m.id === "welcome"
                            ? { ...m, content: `Hello! I am your AI Server Assistant connected to ${serverId} (OS: ${data.os}). I can help you inspect the server, install software, or modify configurations. How can I help you today?` }
                            : m
                    ))
                }
            })
            .catch(err => console.error("Failed to fetch OS status:", err))
    }, [serverId])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isGenerating) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsGenerating(true)

        try {
            // ローカルストレージからAPI設定を取得
            const provider = localStorage.getItem("aiProvider") || "openai"
            const apiKey = localStorage.getItem("aiApiKey")

            if (!apiKey) {
                throw new Error("API Key is missing. Please set it in the Settings page.")
            }

            // API経由でコマンド生成
            const response = await axios.post("/api/ai/generate", {
                prompt: userMsg.content,
                provider,
                apiKey,
                os: osName
            })

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: response.data.message || "Here is the command I generated:",
                command: response.data.command,
                status: response.data.command ? "pending" : undefined
            }

            setMessages(prev => [...prev, aiMsg])
        } catch (error: unknown) {
            console.error(error)
            const err = error as { response?: { data?: { error?: string } }, message?: string }
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: err.response?.data?.error || err.message || "Failed to generate command.",
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExecuteCommand = async (messageId: string, cmd: string) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: "running" } : m))

        try {
            const response = await axios.post("/api/server/execute", {
                command: cmd,
                serverId
            })

            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, status: "success", result: response.data.output } : m
            ))
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } }
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, status: "error", result: err.response?.data?.error || "Execution failed" } : m
            ))
        }
    }

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col pt-4">
            <div className="mb-6 flex shrink-0 items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <TerminalSquare className="w-8 h-8 text-blue-400" />
                        AI Terminal
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Describe what you want to do in natural language, and AI will generate and execute commands.
                    </p>
                </div>

                {/* Helper Chips */}
                <div className="hidden md:flex gap-2">
                    {["Check Disk Space", "Install Nginx", "View Active Ports"].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => setInput(suggestion)}
                            className="px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 text-xs text-zinc-300 transition-colors"
                        >
                            <ChevronRight className="w-3 h-3 inline mr-1 text-blue-400" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="flex-1 flex flex-col border-white/10 bg-black/40 shadow-2xl overflow-hidden backdrop-blur-md relative">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg ${msg.role === "user"
                                    ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                                    : "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                                    }`}>
                                    {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>

                                <div className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`px-5 py-3 rounded-2xl ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-tr-sm shadow-md"
                                        : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-tl-sm shadow-md"
                                        }`}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                    </div>

                                    {/* AI Generated Command Box */}
                                    {msg.command && (
                                        <div className="mt-3 w-full max-w-xl border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-950 shadow-inner">
                                            <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                                                <span className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                                                    <TerminalSquare className="w-3 h-3" />
                                                    Generated Target Command
                                                </span>

                                                {msg.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_-3px_rgba(22,163,74,0.4)] transition-all"
                                                        onClick={() => handleExecuteCommand(msg.id, msg.command!)}
                                                    >
                                                        <Play className="w-3 h-3 mr-1" /> Execute
                                                    </Button>
                                                )}
                                                {msg.status === "running" && (
                                                    <span className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Executing
                                                    </span>
                                                )}
                                                {msg.status === "success" && (
                                                    <span className="flex items-center text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                                                    </span>
                                                )}
                                                {msg.status === "error" && (
                                                    <span className="flex items-center text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> Failed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4 bg-black/60 font-mono text-sm text-green-400 overflow-x-auto">
                                                <code>$ {msg.command}</code>
                                            </div>

                                            {/* Result Output */}
                                            {msg.result && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className={`p-4 font-mono text-xs border-t ${msg.status === "success" ? "border-green-900/50 text-zinc-300 bg-zinc-900" : "border-red-900/50 text-red-400 bg-red-950/20"
                                                        } overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto`}
                                                >
                                                    {msg.result}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isGenerating && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="px-5 py-3 rounded-2xl rounded-tl-sm bg-zinc-800/80 border border-zinc-700/50 flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-zinc-900/80 border-t border-white/10 backdrop-blur-xl shrink-0">
                    <form onSubmit={handleSendMessage} className="relative flex items-center max-w-4xl mx-auto">
                        <div className="absolute left-4 z-10 text-zinc-500 pointer-events-none">
                            <TerminalSquare className="w-5 h-5" />
                        </div>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. Check current RAM usage and list top 5 memory consuming processes"
                            className="pl-12 pr-16 bg-black/60 border-zinc-700/80 focus-visible:ring-indigo-500 h-14 rounded-full text-base shadow-inner"
                            disabled={isGenerating}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isGenerating}
                            className="absolute right-2 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] hover:shadow-[0_0_20px_-3px_rgba(79,70,229,0.8)]"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </form>
                    <p className="text-center text-[10px] text-zinc-600 mt-2">
                        AI generated commands should be reviewed before execution.
                    </p>
                </div>
            </Card>
        </div>
    )
}
