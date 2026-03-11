import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server } from "socket.io"
import * as pty from "node-pty"
import os from "os"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true)
            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error("Error occurred handling", req.url, err)
            res.statusCode = 500
            res.end("internal server error")
        }
    })

    // Setup Socket.IO
    const io = new Server(server, {
        path: "/api/socket/io",
        addTrailingSlash: false,
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id)

        // Linux/Mac = bash, Windows = powershell.exe
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

        let ptyProcess = null;

        socket.on("init", (config) => {
            try {
                ptyProcess = pty.spawn(shell, [], {
                    name: 'xterm-color',
                    cols: config?.cols || 80,
                    rows: config?.rows || 24,
                    cwd: process.env.HOME || process.env.USERPROFILE || process.cwd(),
                    env: process.env
                })

                ptyProcess.onData((data) => {
                    socket.emit("data", data)
                })

                ptyProcess.onExit((e) => {
                    socket.emit("data", `\r\n[Process exited with code ${e.exitCode}]\r\n`)
                })
            } catch (err) {
                console.error("Failed to spawn PTY", err)
                socket.emit("data", "\r\n[Failed to initialize terminal]\r\n")
            }
        })

        socket.on("data", (data) => {
            if (ptyProcess) {
                ptyProcess.write(data)
            }
        })

        socket.on("resize", (size) => {
            if (ptyProcess && size) {
                try {
                    ptyProcess.resize(size.cols, size.rows)
                } catch (e) {
                    // ignore resize error on exited process
                }
            }
        })

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id)
            if (ptyProcess) {
                ptyProcess.kill()
            }
        })
    })

    server.once("error", (err) => {
        console.error(err)
        process.exit(1)
    })

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`)
    })
})
