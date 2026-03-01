"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Activity, Cpu, HardDrive, MemoryStick, Server, ShieldCheck, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store"
import { cn } from "@/lib/utils"

// APIから取得するシステムステータスの型
interface SystemStatus {
    os: string
    kernel: string
    uptime: string
    status: string
    cpuUsage: number
    ramTotal: number
    ramUsed: number | string
    diskTotal: number
    diskUsed: number
}

export default function DashboardPage() {
    const { serverName, serverId } = useAuthStore()
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

    const [barValues, setBarValues] = useState<{ rx: number; tx: number; durRx: number; durTx: number }[]>([])

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/server/status")
            if (res.ok) {
                const data = await res.json()
                setSystemStatus(data)
            }
        } catch (e) {
            console.error("Failed to fetch system status:", e)
        }
    }

    useEffect(() => {
        // 初回マウント時に実際のデータを取得
        fetchStatus()

        // グラフ用ダミーデータの初期化
        setBarValues(Array.from({ length: 40 }).map(() => ({
            rx: Math.random() * 60 + 10,
            tx: Math.random() * 40 + 5,
            durRx: 2 + Math.random(),
            durTx: 1.5 + Math.random()
        })))

        // 3秒ごとに実際のシステム情報をポーリング
        const interval = setInterval(() => {
            fetchStatus()
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    if (!systemStatus) return null

    const ramPercentage = Math.round((parseFloat(systemStatus.ramUsed.toString()) / systemStatus.ramTotal) * 100)
    const diskPercentage = Math.round((systemStatus.diskUsed / systemStatus.diskTotal) * 100)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Server className="w-8 h-8 text-blue-400" />
                    {serverName || "Dashboard"}
                </h1>
                <p className="text-zinc-400 mt-2">
                    Real-time metrics and system overview for {serverId}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Status Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="h-full border-green-500/20 bg-green-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck className="w-24 h-24 text-green-500" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardDescription className="text-zinc-400 font-medium">System Status</CardDescription>
                            <CardTitle className="text-4xl text-white font-bold tracking-wider flex items-center gap-3">
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                                </span>
                                {systemStatus.status}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 mt-4 text-sm text-zinc-400 flex flex-col gap-2 font-mono">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span>OS</span>
                                <span className="text-zinc-200">{systemStatus.os}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span>Kernel</span>
                                <span className="text-zinc-200">{systemStatus.kernel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-2 text-zinc-500">
                                <Clock className="w-3 h-3" />
                                Uptime: {systemStatus.uptime}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* CPU Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-zinc-400 font-medium">CPU Usage</CardDescription>
                            <Cpu className="h-5 w-5 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-white tabular-nums">
                                {Math.round(systemStatus.cpuUsage)}<span className="text-2xl text-zinc-500">%</span>
                            </div>

                            <div className="mt-4 h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-out",
                                        systemStatus.cpuUsage > 80 ? "bg-red-500" : systemStatus.cpuUsage > 60 ? "bg-yellow-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${systemStatus.cpuUsage}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                <span>1 min avg</span>
                                <span>Active Processors: 8</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* RAM Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-zinc-400 font-medium">Memory Usage</CardDescription>
                            <MemoryStick className="h-5 w-5 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-white tabular-nums">
                                {systemStatus.ramUsed}<span className="text-2xl text-zinc-500"> / {systemStatus.ramTotal}GB</span>
                            </div>

                            <div className="mt-4 h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-out",
                                        ramPercentage > 85 ? "bg-red-500" : ramPercentage > 70 ? "bg-yellow-500" : "bg-purple-500"
                                    )}
                                    style={{ width: `${ramPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                <span>Total: {systemStatus.ramTotal}GB</span>
                                <span>{ramPercentage}% Used</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Disk Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-zinc-400 font-medium">Disk Space</CardDescription>
                            <HardDrive className="h-5 w-5 text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-white tabular-nums">
                                {systemStatus.diskUsed}<span className="text-2xl text-zinc-500"> / {systemStatus.diskTotal}GB</span>
                            </div>

                            <div className="mt-4 h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${diskPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                <span>Free: {systemStatus.diskTotal - systemStatus.diskUsed}GB</span>
                                <span>{diskPercentage}% Used</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Activity Chart Mock Area */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="mt-8 border-white/5 bg-black/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Network Traffic
                        </CardTitle>
                        <CardDescription>Live incoming/outgoing proxy traffic (Mock Demo)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 w-full flex items-end gap-1 p-4 border border-zinc-800/50 rounded-lg bg-zinc-950/50 relative overflow-hidden">
                            {/* 簡単な偽グラフ */}
                            {barValues.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val.rx}%` }}
                                        transition={{ repeat: Infinity, duration: val.durRx, repeatType: "mirror" }}
                                        className="w-full bg-blue-500/30 rounded-full transition-all group-hover:bg-blue-400"
                                    />
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val.tx}%` }}
                                        transition={{ repeat: Infinity, duration: val.durTx, repeatType: "mirror" }}
                                        className="w-full bg-indigo-500/30 rounded-full transition-all group-hover:bg-indigo-400"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-sm text-zinc-400">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/50"></div> <span className="text-zinc-300">RX (Receive)</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500/50"></div> <span className="text-zinc-300">TX (Transmit)</span></div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

        </div>
    )
}
