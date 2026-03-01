"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Terminal, LayoutDashboard, Settings, LogOut, CodeSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

const navItems = [
    {
        title: "Server Status",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "AI Terminal",
        href: "/dashboard/ai",
        icon: CodeSquare,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { serverId, serverName, logout } = useAuthStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true)
        }, 0)
        return () => clearTimeout(timer)
    }, [])

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    if (!mounted) return null

    return (
        <div className="flex w-72 flex-col gap-y-5 bg-black/40 border-r border-white/10 px-6 pb-4 pt-8 backdrop-blur-xl shrink-0 min-h-screen sticky top-0">

            {/* サイトロゴ・ヘッダー部分 */}
            <div className="flex h-16 shrink-0 items-center gap-x-3 text-white px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Terminal className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold tracking-wide text-lg text-gradient">SysManage</span>
                    <span className="text-xs text-zinc-500">AI Powered Control</span>
                </div>
            </div>

            {/* ナビゲーション */}
            <nav className="flex flex-1 flex-col mt-4 relative">
                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/settings")
                        return (
                            <li key={item.title}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "group relative flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium transition-all duration-300",
                                        isActive
                                            ? "text-blue-400 bg-blue-500/10"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute inset-0 rounded-md bg-blue-500/10 border border-blue-500/20"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={cn("h-6 w-6 shrink-0 relative z-10", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} aria-hidden="true" />
                                    <span className="relative z-10">{item.title}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* ログインユーザー情報 */}
            <div className="mt-auto border-t border-white/10 pt-6">
                <div className="flex flex-col gap-3">
                    <div className="px-2 text-sm text-zinc-400">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Connected To</div>
                        <div className="font-mono text-blue-400 truncate">{serverId || "Not Connected"}</div>
                        <div className="text-xs truncate">{serverName || "Unknown Host"}</div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5 h-12"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Disconnect
                    </Button>
                </div>
            </div>
        </div>
    )
}
