"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings, Key, CheckCircle2, ChevronRight, Server, Shield } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"ai" | "system">("ai")
    const [provider, setProvider] = useState<"openai" | "gemini" | "kimi">("openai")
    const [apiKey, setApiKey] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // ページロード時に保存済みのAPIキー等があれば読み込む（今回はLocalStorageを使用）
    useEffect(() => {
        const savedProvider = localStorage.getItem("aiProvider") as "openai" | "gemini" | "kimi"
        const savedKey = localStorage.getItem("aiApiKey")
        if (savedProvider) setProvider(savedProvider)
        if (savedKey) setApiKey(savedKey)
    }, [])

    const handleSaveAIConfig = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        // API呼び出しや検証を想定した擬似待機
        await new Promise(resolve => setTimeout(resolve, 800))

        localStorage.setItem("aiProvider", provider)
        localStorage.setItem("aiApiKey", apiKey)

        setIsSaving(false)
        // ToDo: 後でToastコンポーネントを追加するか、表示を変える
        alert("AI Settings successfully saved!")
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-blue-500/30">

            {/* 共通の背景パターン */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
            </div>

            <Sidebar />

            <main className="flex-1 overflow-y-auto relative z-10 w-full p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-400" />
                        System Settings
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Configure AI integrations and system parameters
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                    {/* Settings Nav */}
                    <nav className="flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab("ai")}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all ${activeTab === "ai"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Key className="w-5 h-5" />
                                <span className="font-medium">AI Configuration</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                        <button
                            onClick={() => setActiveTab("system")}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all ${activeTab === "system"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Server className="w-5 h-5" />
                                <span className="font-medium">System Preferences</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                    </nav>

                    {/* Settings Content */}
                    <div className="min-h-[500px]">
                        {activeTab === "ai" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                                <Card className="border-white/5 bg-black/40">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-white flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-indigo-400" />
                                            Generative AI Setup
                                        </CardTitle>
                                        <CardDescription>
                                            Configure the AI provider used for generating and analyzing server commands. Your API keys are stored securely.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form id="ai-settings-form" onSubmit={handleSaveAIConfig} className="space-y-6">

                                            <div className="space-y-3">
                                                <Label>AI Provider</Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${provider === "openai" ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-black/50 hover:border-zinc-700"}`}>
                                                        <input
                                                            type="radio"
                                                            name="provider"
                                                            value="openai"
                                                            checked={provider === "openai"}
                                                            onChange={() => setProvider("openai")}
                                                            className="sr-only"
                                                        />
                                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3 group">
                                                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-green-400 to-emerald-600">O</span>
                                                        </div>
                                                        <span className="font-semibold text-white">OpenAI</span>
                                                        <span className="text-xs text-zinc-500 mt-1">GPT-4 / GPT-3.5</span>
                                                    </label>

                                                    <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${provider === "gemini" ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-800 bg-black/50 hover:border-zinc-700"}`}>
                                                        <input
                                                            type="radio"
                                                            name="provider"
                                                            value="gemini"
                                                            checked={provider === "gemini"}
                                                            onChange={() => setProvider("gemini")}
                                                            className="sr-only"
                                                        />
                                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3">
                                                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-600">G</span>
                                                        </div>
                                                        <span className="font-semibold text-white">Gemini</span>
                                                        <span className="text-xs text-zinc-500 mt-1">Gemini 1.5 Pro</span>
                                                    </label>

                                                    <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${provider === "kimi" ? "border-red-500 bg-red-500/10" : "border-zinc-800 bg-black/50 hover:border-zinc-700"}`}>
                                                        <input
                                                            type="radio"
                                                            name="provider"
                                                            value="kimi"
                                                            checked={provider === "kimi"}
                                                            onChange={() => setProvider("kimi")}
                                                            className="sr-only"
                                                        />
                                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3">
                                                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-red-400 to-orange-600">K</span>
                                                        </div>
                                                        <span className="font-semibold text-white">Kimi</span>
                                                        <span className="text-xs text-zinc-500 mt-1">moonshot-v1</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-white/5">
                                                <Label htmlFor="apiKey">API Key ({provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : 'Kimi'})</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="apiKey"
                                                        type="password"
                                                        value={apiKey}
                                                        onChange={(e) => setApiKey(e.target.value)}
                                                        placeholder={provider === "openai" || provider === "kimi" ? "sk-..." : "AIzaSy..."}
                                                        className="bg-black/60 font-mono text-sm"
                                                        required
                                                    />
                                                    <Key className="absolute right-3 top-3 w-4 h-4 text-zinc-600" />
                                                </div>
                                                <p className="text-xs text-zinc-500">
                                                    {provider === "openai"
                                                        ? "Get your API key from the OpenAI Developer Dashboard."
                                                        : provider === "gemini"
                                                            ? "Create an API key in Google AI Studio."
                                                            : "Create your API key in Moonshot AI Platform."}
                                                </p>
                                            </div>
                                        </form>
                                    </CardContent>
                                    <CardFooter className="bg-white/[0.02] border-t border-white/5 py-4 flex justify-end">
                                        <Button
                                            form="ai-settings-form"
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-500"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Saving...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Save Configuration
                                                </div>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "system" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                                <Card className="border-white/5 bg-black/40">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-white">System Preferences</CardTitle>
                                        <CardDescription>
                                            General configuration for the server management platform.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-48 flex items-center justify-center border-t border-white/5">
                                        <p className="text-zinc-500 italic">No additional system settings required at this time.</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
