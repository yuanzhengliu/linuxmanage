"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, TerminalSquare, AlertCircle, CheckCircle2, Loader2, Bot, User, Play, ChevronRight } from "lucide-react"
import { useAuthStore, useChatStore, Message } from "@/lib/store"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"

export default function AITerminalPage() {
    const { serverId } = useAuthStore()
    const { messages: allMessages, addMessage, updateMessage, clearOldMessages } = useChatStore()

    // 現在のサーバーに対応するメッセージ群を取得
    const messages = serverId ? (allMessages[serverId] || []) : []

    const [osName, setOsName] = useState<string>("Linux")
    const [input, setInput] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // 古い履歴（30日以上前）のクリーンアップを実行
    useEffect(() => {
        clearOldMessages()
    }, [clearOldMessages])

    // 初回アクセス時の歓迎メッセージ
    useEffect(() => {
        if (serverId && messages.length === 0) {
            addMessage(serverId, {
                id: "welcome",
                role: "ai",
                content: `こんにちは！私は ${serverId} に接続されたAIサーバーアシスタントです。サーバーの状態確認、ソフトウェアのインストール、設定の変更などをお手伝いできます。何かご用はありますか？`,
                timestamp: Date.now()
            })
        }
    }, [serverId, messages.length, addMessage])

    useEffect(() => {
        // AIターミナルを開いた際に実際のOS情報を取得しておく
        fetch("/api/server/status")
            .then(res => res.json())
            .then(data => {
                if (data.os) {
                    setOsName(data.os)
                    // 歓迎メッセージにOS名を付与（ストア内のwelcomeメッセージを更新）
                    if (serverId) {
                        updateMessage(serverId, "welcome", {
                            content: `こんにちは！私は ${serverId} (OS: ${data.os}) に接続されたAIサーバーアシスタントです。サーバーの状態確認、ソフトウェアのインストール、設定の変更などをお手伝いできます。何かご用はありますか？`
                        })
                    }
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

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: Date.now() }
        if (serverId) addMessage(serverId, userMsg)
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
                content: response.data.message || "以下が生成されたコマンドです：",
                command: response.data.command,
                explanation: response.data.explanation,
                status: response.data.command ? "pending" : undefined,
                timestamp: Date.now()
            }

            if (serverId) addMessage(serverId, aiMsg)
        } catch (error: unknown) {
            console.error(error)
            const err = error as { response?: { data?: { error?: string } }, message?: string }
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: err.response?.data?.error || err.message || "Failed to generate command.",
                timestamp: Date.now()
            }
            if (serverId) addMessage(serverId, errorMsg)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExecuteCommand = async (messageId: string, cmd: string) => {
        if (!serverId) return
        updateMessage(serverId, messageId, { status: "running" })

        try {
            const response = await axios.post("/api/server/execute", {
                command: cmd,
                serverId
            })

            const resultData = response.data.output
            updateMessage(serverId, messageId, { status: "success", result: resultData })

            // 実行結果をAIに解説させる
            const provider = localStorage.getItem("aiProvider") || "openai"
            const apiKey = localStorage.getItem("aiApiKey")
            if (apiKey) {
                try {
                    const explainRes = await axios.post("/api/ai/explain", {
                        command: cmd,
                        output: resultData,
                        provider,
                        apiKey,
                        os: osName
                    })
                    if (serverId) updateMessage(serverId, messageId, { resultExplanation: explainRes.data.explanation })
                } catch (e) { console.error("Failed to explain result:", e) }
            }

        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } }
            const resultData = err.response?.data?.error || "Execution failed"
            updateMessage(serverId, messageId, { status: "error", result: resultData })

            // エラーの場合もAIに原因を解説させる
            const provider = localStorage.getItem("aiProvider") || "openai"
            const apiKey = localStorage.getItem("aiApiKey")
            if (apiKey) {
                try {
                    const explainRes = await axios.post("/api/ai/explain", {
                        command: cmd,
                        output: resultData,
                        provider,
                        apiKey,
                        os: osName
                    })
                    if (serverId) updateMessage(serverId, messageId, { resultExplanation: explainRes.data.explanation })
                } catch (e) { console.error("Failed to explain error:", e) }
            }
        }
    }

    return (
        <div className="h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-6rem)] flex flex-col pt-0 md:pt-4">
            <div className="mb-2 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 hidden md:flex">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 md:gap-3">
                        <TerminalSquare className="w-5 h-5 md:w-8 md:h-8 text-blue-400" />
                        AI Terminal
                    </h1>
                    <p className="text-[10px] md:text-sm text-zinc-400 mt-1 md:mt-2">
                        やりたいことを自然言語で入力すると、AIがコマンドを生成・実行・解説します。
                    </p>
                </div>

                {/* Helper Chips */}
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide pb-1 md:pb-0 gap-1.5 md:gap-2">
                    {["ディスク容量を確認", "Nginxのインストール", "解放ポートの確認"].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => setInput(suggestion)}
                            className="shrink-0 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 text-[10px] md:text-xs text-zinc-300 transition-colors"
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
                                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md md:shadow-lg ${msg.role === "user"
                                    ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                                    : "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                                    }`}>
                                    {msg.role === "user" ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                                </div>

                                <div className={`flex flex-col w-full max-w-[90%] md:max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`px-3 py-2 md:px-5 md:py-3 rounded-2xl ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-tr-sm shadow-sm md:shadow-md"
                                        : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-tl-sm shadow-sm md:shadow-md"
                                        }`}>
                                        <p className="whitespace-pre-wrap text-[11px] md:text-sm leading-relaxed">{msg.content}</p>
                                    </div>

                                    {/* AI Generated Command Box */}
                                    {msg.command && (
                                        <div className="mt-2 text-left w-full max-w-[100%] md:max-w-xl border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-950 shadow-inner">
                                            <div className="bg-zinc-900 px-3 md:px-4 py-1.5 md:py-2 border-b border-zinc-800 flex justify-between items-center">
                                                <span className="text-[10px] md:text-xs text-zinc-400 font-mono flex items-center gap-1.5 md:gap-2">
                                                    <TerminalSquare className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                    Command
                                                </span>

                                                {msg.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        className="h-6 md:h-7 text-[10px] md:text-xs px-2 md:px-3 bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_-3px_rgba(22,163,74,0.4)] transition-all"
                                                        onClick={() => handleExecuteCommand(msg.id, msg.command!)}
                                                    >
                                                        <Play className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> Execute
                                                    </Button>
                                                )}
                                                {msg.status === "running" && (
                                                    <span className="flex items-center text-[9px] md:text-xs text-yellow-500 bg-yellow-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                                                        <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 animate-spin" /> Executing
                                                    </span>
                                                )}
                                                {msg.status === "success" && (
                                                    <span className="flex items-center text-[9px] md:text-xs text-green-500 bg-green-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                                                        <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> Success
                                                    </span>
                                                )}
                                                {msg.status === "error" && (
                                                    <span className="flex items-center text-[9px] md:text-xs text-red-500 bg-red-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                                                        <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> Failed
                                                    </span>
                                                )}
                                            </div>
                                            {msg.explanation && (
                                                <div className="p-2.5 md:p-4 bg-zinc-900/50 text-[10px] md:text-sm text-zinc-300 border-b border-zinc-800">
                                                    <p className="font-semibold text-zinc-500 mb-0.5 md:mb-1 leading-none text-[9px] md:text-[10px] uppercase tracking-wider">Explanation</p>
                                                    <p className="leading-relaxed">{msg.explanation}</p>
                                                </div>
                                            )}
                                            <div className="p-2.5 md:p-4 bg-black/60 font-mono text-[10px] md:text-sm text-green-400 overflow-x-auto">
                                                <code>$ {msg.command}</code>
                                            </div>

                                            {/* Result Output */}
                                            {msg.result && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className={`p-2.5 md:p-4 font-mono text-[9px] md:text-xs border-t ${msg.status === "success" ? "border-green-900/50 text-zinc-300 bg-zinc-900" : "border-red-900/50 text-red-400 bg-red-950/20"
                                                        } overflow-x-auto whitespace-pre-wrap max-h-48 md:max-h-60 overflow-y-auto`}
                                                >
                                                    {msg.result}
                                                </motion.div>
                                            )}
                                            {msg.resultExplanation && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="p-2.5 md:p-4 bg-indigo-900/20 text-indigo-200 border-t border-indigo-900/30 text-[10px] md:text-sm"
                                                >
                                                    <p className="font-semibold text-indigo-400 mb-1 md:mb-2 leading-none text-[9px] md:text-xs flex items-center gap-1"><Bot className="w-2.5 h-2.5 md:w-3 md:h-3" /> AI Analysis</p>
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.resultExplanation}</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isGenerating && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 md:gap-4">
                                <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                                </div>
                                <div className="px-3 py-2 md:px-5 md:py-3 rounded-2xl rounded-tl-sm bg-zinc-800/80 border border-zinc-700/50 flex items-center gap-2">
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
                <div className="p-3 md:p-4 bg-zinc-900/80 border-t border-white/10 backdrop-blur-xl shrink-0">
                    <form onSubmit={handleSendMessage} className="relative flex items-center max-w-4xl mx-auto">
                        <div className="absolute left-3 md:left-4 z-10 text-zinc-500 pointer-events-none">
                            <TerminalSquare className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="例：現在のメモリ使用量を確認して"
                            className="pl-9 md:pl-12 pr-14 md:pr-16 bg-black/60 border-zinc-700/80 focus-visible:ring-indigo-500 h-12 md:h-14 rounded-full text-sm md:text-base shadow-inner"
                            disabled={isGenerating}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isGenerating}
                            className="absolute right-1.5 md:right-2 h-9 w-9 md:h-10 md:w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] hover:shadow-[0_0_20px_-3px_rgba(79,70,229,0.8)]"
                        >
                            <Send className="w-3 h-3 md:w-4 md:h-4 ml-0.5" />
                        </Button>
                    </form>
                    <p className="text-center text-[9px] md:text-[10px] text-zinc-600 mt-2">
                        AIが生成したコマンドは、実行する前に必ず内容を確認してください。
                    </p>
                </div>
            </Card>
        </div>
    )
}
