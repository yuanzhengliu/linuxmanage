import { NextResponse } from "next/server"
import OpenAI from "openai"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const command = body.command
        const output = body.output
        const provider = body.provider
        const apiKey = body.apiKey?.trim()
        const os = body.os || "Linux"

        if (!command || output === undefined || !provider || !apiKey) {
            return NextResponse.json(
                { error: "Missing required parameters (command, output, provider, apiKey)" },
                { status: 400 }
            )
        }

        let truncatedOutput = output
        if (truncatedOutput.length > 2000) {
            truncatedOutput = truncatedOutput.substring(0, 2000) + "\n... (output truncated)"
        }

        const systemPrompt = `You are an expert ${os} System Administrator.
The user has executed a command on their ${os} server, and you need to explain the execution output to them clearly and concisely.
Command executed: \`${command}\`
Execution output:
\`\`\`
${truncatedOutput}
\`\`\`
Analyze the output and provide a brief, easy-to-understand explanation of what happened. Was it successful? Did it error? What does the output signify?`

        let explanation = ""

        if (provider === "openai") {
            const openai = new OpenAI({ apiKey })
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Please explain the execution result." }
                ],
                temperature: 0.3,
            })
            explanation = response.choices[0]?.message?.content?.trim() || ""

        } else if (provider === "gemini") {
            const ai = new GoogleGenAI({ apiKey })
            const response = await ai.models.generateContent({
                model: "gemini-1.5-pro",
                contents: systemPrompt + "\nPlease explain the execution result.",
            })
            explanation = response.text || ""
        } else if (provider === "kimi") {
            try {
                const openai = new OpenAI({
                    apiKey,
                    baseURL: "https://api.moonshot.ai/v1"
                })
                const response = await openai.chat.completions.create({
                    model: "moonshot-v1-8k",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: "Please explain the execution result." }
                    ],
                    temperature: 0.3,
                })
                explanation = response.choices[0]?.message?.content?.trim() || ""
            } catch (kimiError: any) {
                if (kimiError.status === 401 || kimiError.response?.status === 401) {
                    const openaiCn = new OpenAI({
                        apiKey,
                        baseURL: "https://api.moonshot.cn/v1"
                    })
                    const response = await openaiCn.chat.completions.create({
                        model: "moonshot-v1-8k",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: "Please explain the execution result." }
                        ],
                        temperature: 0.3,
                    })
                    explanation = response.choices[0]?.message?.content?.trim() || ""
                } else {
                    throw kimiError
                }
            }
        } else {
            return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 })
        }

        return NextResponse.json({
            explanation
        })

    } catch (error: any) {
        console.error("AI Explanation Error:", error)

        let errorMessage = error.message || "Failed to generate explanation"
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
