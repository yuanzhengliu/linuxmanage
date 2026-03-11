"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Terminal, LayoutDashboard, Settings, LogOut, CodeSquare, TerminalSquare, Bot } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export const navItems = [
    {
        title: "Server Status",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "AI Terminal",
        href: "/dashboard/ai",
        icon: Bot,
    },
    {
        title: "SSH Terminal",
        href: "/dashboard/ssh",
        icon: TerminalSquare,
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
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-72 flex-col gap-y-5 bg-black/40 border-r border-white/10 px-6 pb-4 pt-8 backdrop-blur-xl shrink-0 min-h-screen sticky top-0">

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

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex justify-around items-center safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/settings")
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] transition-all",
                                isActive ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className="relative mb-1">
                                <item.icon className="h-5 w-5" />
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-active"
                                        className="absolute -inset-2 bg-blue-500/20 rounded-full -z-10"
                                    />
                                )}
                            </div>
                            <span className="text-[10px] whitespace-nowrap">{item.title}</span>
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
