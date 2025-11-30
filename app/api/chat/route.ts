import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `
你是我的 AI 辅导老师 (AI Learning Coach)，也是一位教育专家。
你的性格亲切、友好，总是充满鼓励。你会注重事实的准确性，用有趣的方式进行教学。
**中文优先**
在你所有的对话和回答中, 除非必要, 一律使用简体中文进行回答

**核心职责与限制：**
1.  **适用范围**：仅限于学术主题和常识辅导。
2.  **严禁话题**：严禁谈论仇恨、骚扰、医疗建议、危险话题、与学术无关的话题（如规划行程、购物）以及语言学习（翻译除外）。
3.  **处理越界**：如果我对上述非支持领域表现出兴趣，请礼貌但坚定地提醒我，你无法提供相关支持，并引导我回到原本的学习目标。

**交互逻辑与教学流程：**

根据我的输入，首先推断我的意图是 **"学习概念"** 还是 **"解决作业/问题"**。

### A. 学习计划路径 (当我想学习一个概念时)
1.  **制定计划**：将目标细分为 2-3 个主题，为我制定分步学习计划。分享计划并询问我是否同意或需要修改。
2.  **分步教学**：
    - 每次只辅导一个主题。
    - 提供简短解释，使用类比、现实世界例子、相关的笑话或趣事。
    - **互动**：解释后，必须进行一项学习活动（如：正式辩论、角色扮演、猜词游戏、谜语、假设场景测验）。
3.  **评估与反馈**：
    - 在活动中评估我的理解。
    - 回答正确：积极肯定，解释为什么正确。
    - 回答错误：解释原因，提供提示，让我重试。
4.  **推进**：确认我理解后，询问是否继续下一个主题。
5.  **总结**：所有主题结束后，提供要点总结，分析我的表现，并问我是否达到了目标。

### B. 作业辅导计划 (当我有具体问题时)
1.  **事实性问题** (如"德克萨斯州的首都是什么")：
    - 直接回答问题。
    - 简短询问是否想制定学习计划深入了解该主题。
2.  **概念性非数学问题** (如"民主与社会主义的异同")：
    - 简洁介绍相关概念，**不要**一开始就给完整答案。
    - 询问是否想深入了解。如果想，进入"学习计划路径"；如果不想，再给出完整答案。
3.  **数学/多步骤理科问题** (如 "-2w+14w+3=8w+21")：
    - **严禁直接给出完整过程**。
    - **只给出解法的第一步**。
    - 询问我："你想在我的帮助下继续解决这个问题吗？"
    - 如果我说"是"：一步步指导我，直到解决。
    - 如果我说"不"：直接给出完整解法。
    - **举一反三**：解决问题后，根据我的表现，出一道难度适应的类似练习题。重复此过程直到我说不需要。

**通用指导原则：**
- **苏格拉底式教学**：在适当时候提出引导性问题。
- **简洁逻辑**：不要一次输出太多信息，确保我能消化。
- **个性化**：将内容与我的生活经验联系起来，保持鼓励态度。
- **多模态分析**：如果我上传了图片（题目、图表），请仔细分析图片内容进行解答。

**格式与技术规范 (非常重要)：**
为了确保在 App 中完美显示，请必须遵守以下格式：
1.  **Markdown**：使用 Markdown 组织层级和重点（**粗体**）。
2.  **数学公式 (LaTeX)**：
    - **必须**使用 LaTeX 格式书写所有数学符号。
    - **行内公式**：使用单美元符号 $ 包裹。例如：$\\sqrt{x}$, $x^2$, $\\frac{a}{b}$, $\\angle ABC$, $AB \\parallel CD$, $\\pi$, $\\theta$。
    - **独立公式块**：使用双美元符号 $$ 包裹。
3.  **列表**：使用列表 (1. 或 -) 展示步骤。
`;

export async function POST(req: NextRequest) {
    try {
        const { history, newText, newAttachments, provider = 'openai' } = await req.json();

        console.log(`[API] Request received. Provider: ${provider}`);

        if (provider === 'google') {
            return await handleGeminiRequest(history, newText, newAttachments);
        } else {
            return await handleOpenAIRequest(history, newText, newAttachments);
        }

    } catch (error: any) {
        console.error("API Route Error:", error);
        const errorMessage = error.message || "Unknown error";
        return NextResponse.json({
            error: "Failed to get response from Learning Coach.",
            details: errorMessage
        }, { status: 500 });
    }
}

async function handleGeminiRequest(history: any[], newText: string, newAttachments: any[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents: any[] = [];

    // History
    if (history && Array.isArray(history)) {
        for (const msg of history) {
            const role = msg.role === 'model' ? 'model' : 'user';
            contents.push({
                role: role,
                parts: [{ text: msg.text }]
            });
        }
    }

    // New Message
    const newParts: any[] = [];
    if (newText) newParts.push({ text: newText });
    if (newAttachments) {
        for (const att of newAttachments) {
            if (att.data && att.mimeType) {
                newParts.push({
                    inlineData: {
                        data: att.data,
                        mimeType: att.mimeType
                    }
                });
            }
        }
    }

    if (newParts.length > 0) {
        contents.push({
            role: 'user',
            parts: newParts
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });

        const text = response.text || "";
        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

async function handleOpenAIRequest(history: any[], newText: string, newAttachments: any[]) {
    const apiKey = process.env.OPENAI_API_KEY;
    let baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const modelName = process.env.OPENAI_MODEL_NAME || "gpt-3.5-turbo";

    if (!apiKey) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
    const endpoint = `${baseURL}/chat/completions`;

    // Build standard OpenAI chat messages (each message.content is a string)
    const messages: any[] = [{ role: "system", content: SYSTEM_INSTRUCTION }];

    if (history && Array.isArray(history)) {
        for (const msg of history) {
            const role = msg.role === 'model' ? 'assistant' : msg.role;
            messages.push({ role, content: String(msg.text || "") });
        }
    }

    // Construct a single user string that includes text and inline attachments (as data URLs)
    let userContent = newText ? String(newText) : "";
    if (newAttachments && Array.isArray(newAttachments)) {
        for (const att of newAttachments) {
            if (att.data && att.mimeType) {
                // Append a concise attachment marker; avoid huge payloads if possible.
                userContent += `\n\n[Attachment: data:${att.mimeType};base64,${att.data}]`;
            }
        }
    }

    if (userContent.trim().length > 0) {
        messages.push({ role: "user", content: userContent });
    }

    const fetchResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelName,
            messages: messages,
            stream: false
        })
    });

    if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`Upstream API error: ${fetchResponse.status} - ${errorText}`);
    }

    const data = await fetchResponse.json();
    // Support both chat completions and older/text endpoints
    const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? "";

    return NextResponse.json({ text: content });
}
