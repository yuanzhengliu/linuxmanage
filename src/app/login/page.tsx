"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Terminal, ShieldAlert } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { MOCK_SERVERS } from "@/lib/mock-auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const [serverId, setServerId] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { login } = useAuthStore()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // モックのネットワーク遅延
        await new Promise((resolve) => setTimeout(resolve, 800))

        const serverData = MOCK_SERVERS[serverId]
        if (serverData) {
            login(serverData.id, serverData.name)
            router.push("/dashboard")
        } else {
            setError("無効なサーバIDです。 (例: server-001)")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-blue-500/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
                    <CardHeader className="space-y-4 items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                            <Terminal className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                                System Login
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-base mt-2">
                                Linux Server Management Platform
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="serverId">Server ID</Label>
                                <Input
                                    id="serverId"
                                    placeholder="Enter Server ID (e.g. server-001)"
                                    value={serverId}
                                    onChange={(e) => setServerId(e.target.value)}
                                    className="bg-black/40 border-zinc-800 focus-visible:ring-blue-500 text-lg py-6"
                                    required
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    <p>{error}</p>
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.7)]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Connecting...
                                    </div>
                                ) : (
                                    "Connect to Server"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-white/5 pt-6">
                        <p className="text-xs text-zinc-500">
                            Authorized access only. All actions are logged.
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
