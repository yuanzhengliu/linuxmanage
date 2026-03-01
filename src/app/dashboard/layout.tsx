"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/layout/sidebar"
import { motion, AnimatePresence } from "framer-motion"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { serverId } = useAuthStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true)
        }, 0)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (mounted && !serverId) {
            router.push("/login")
        }
    }, [serverId, router, mounted])

    if (!mounted || !serverId) return null

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-blue-500/30">
            {/* 共通の背景パターン */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
                {/* 装飾用のグラデーション */}
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
            </div>

            <Sidebar />

            <main className="flex-1 overflow-y-auto relative z-10 w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="page-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="h-full p-8 max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
