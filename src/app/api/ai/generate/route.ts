import { NextResponse } from "next/server"
import OpenAI from "openai"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const prompt = body.prompt
        const provider = body.provider
        const apiKey = body.apiKey?.trim() // 空白文字を除去

        if (!prompt || !provider || !apiKey) {
            return NextResponse.json(
                { error: "Missing required parameters (prompt, provider, apiKey)" },
                { status: 400 }
            )
        }

        const systemPrompt = `You are an expert Linux System Administrator. 
The user will ask you to perform a task on their Linux server.
You must analyze the request and provide ONLY the raw bash command to execute to achieve their goal.
Do not wrap the command in markdown blocks. Do not provide explanations.
If the request requires multiple commands, combine them using && or ;.
Example user input: "Check disk space"
Example response: "df -h"`

        let command = ""

        if (provider === "openai") {
            const openai = new OpenAI({ apiKey })
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: 0,
            })
            command = response.choices[0]?.message?.content?.trim() || ""

        } else if (provider === "gemini") {
            const ai = new GoogleGenAI({ apiKey })
            const response = await ai.models.generateContent({
                model: "gemini-1.5-pro",
                contents: systemPrompt + "\nUser Request: " + prompt,
            })
            command = response.text || ""
        } else if (provider === "kimi") {
            try {
                // まず国際版エンドポイント (.ai) を試行
                const openai = new OpenAI({
                    apiKey,
                    baseURL: "https://api.moonshot.ai/v1"
                })
                const response = await openai.chat.completions.create({
                    model: "moonshot-v1-8k",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0,
                })
                command = response.choices[0]?.message?.content?.trim() || ""
            } catch (kimiError: any) {
                // 認証エラー(401)の場合は、中国国内版エンドポイント (.cn) で再試行
                if (kimiError.status === 401 || kimiError.response?.status === 401) {
                    const openaiCn = new OpenAI({
                        apiKey,
                        baseURL: "https://api.moonshot.cn/v1"
                    })
                    const response = await openaiCn.chat.completions.create({
                        model: "moonshot-v1-8k",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0,
                    })
                    command = response.choices[0]?.message?.content?.trim() || ""
                } else {
                    throw kimiError // 401以外（残高不足やネットワークエラー等）はそのままスロー
                }
            }
        } else {
            return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 })
        }

        // クリーンアップ（マークダウン記法が混入した場合への保険）
        command = command.replace(/^```bash\n?/g, '').replace(/^```\n?/g, '').replace(/\n?```$/g, '').trim()

        return NextResponse.json({
            message: `I have generated the command for your request: "${prompt}"`,
            command
        })

    } catch (error: any) {
        console.error("AI Generation Error:", error)

        let errorMessage = error.message || "Failed to generate command"
        let statusCode = 500

        if (error.status === 401 || error.response?.status === 401) {
            errorMessage = "Invalid Authentication: Please check your API key in Settings."
            statusCode = 401
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        )
    }
}
