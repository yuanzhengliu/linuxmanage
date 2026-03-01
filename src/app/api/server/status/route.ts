import { NextResponse } from "next/server"
import os from "os"
import child_process from "child_process"
import util from "util"

const exec = util.promisify(child_process.exec)

export async function GET() {
    try {
        let osName = ""
        try {
            if (os.platform() === "linux") {
                const { stdout } = await exec("cat /etc/os-release | grep PRETTY_NAME | cut -d '\"' -f 2")
                osName = stdout.trim()
            } else if (os.platform() === "win32") {
                const { stdout } = await exec("wmic os get Caption")
                osName = stdout.split("\n")[1]?.trim() || "Windows"
            } else {
                osName = `${os.type()} ${os.release()}`
            }
        } catch (e) {
            osName = `${os.type()} ${os.release()}`
        }

        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem
        const uptimeSeconds = os.uptime()

        const days = Math.floor(uptimeSeconds / (3600 * 24))
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600)
        const minutes = Math.floor((uptimeSeconds % 3600) / 60)
        let uptimeStr = ""
        if (days > 0) uptimeStr += `${days} days, `
        if (hours > 0 || days > 0) uptimeStr += `${hours} hours, `
        uptimeStr += `${minutes} minutes`

        const cpus = os.cpus()
        let totalIdle = 0, totalTick = 0
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type as keyof typeof cpu.times]
            }
            totalIdle += cpu.times.idle
        })
        const idle = totalIdle / cpus.length
        const total = totalTick / cpus.length
        // 実際のCPUの計算は難しいが、ひとまずの平均
        const usage = 100 - ~~(100 * idle / total)

        // ディスク容量の取得はOSごとのコマンド依存があるため、ひとまずダミーかNodeでは難しいのでLinux専用とする
        let diskTotal = 500
        let diskUsed = 234
        try {
            if (os.platform() === "linux" || os.platform() === "darwin") {
                const { stdout } = await exec("df -BG / | awk 'NR==2 {print $2, $3}'")
                const [totalG, usedG] = stdout.trim().split(/\s+/)
                if (totalG && usedG) {
                    diskTotal = parseInt(totalG.replace('G', ''), 10)
                    diskUsed = parseInt(usedG.replace('G', ''), 10)
                }
            } else if (os.platform() === "win32") {
                const { stdout } = await exec("wmic logicaldisk get size,freespace,caption")
                const lines = stdout.split('\n').filter(l => l.includes('C:'))
                if (lines.length > 0) {
                    const parts = lines[0].trim().split(/\s+/)
                    if (parts.length >= 3) {
                        const free = parseInt(parts[1], 10) / (1024 ** 3)
                        const tSize = parseInt(parts[2], 10) / (1024 ** 3)
                        diskTotal = Math.round(tSize)
                        diskUsed = Math.round(tSize - free)
                    }
                }
            }
        } catch (e) { /* ignore */ }

        return NextResponse.json({
            os: osName || "Unknown OS",
            kernel: os.release(),
            uptime: uptimeStr,
            status: "Healthy",
            cpuUsage: Math.max(1, Math.min(100, usage)),
            ramTotal: Math.round(totalMem / (1024 ** 3)),
            ramUsed: (usedMem / (1024 ** 3)).toFixed(1),
            diskTotal,
            diskUsed
        })

    } catch (error: any) {
        console.error("OS Status Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch OS status" },
            { status: 500 }
        )
    }
}
