import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, Role, Attachment } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位专业、友好且耐心的学习辅导老师 (AI Learning Coach)。
你的目标是帮助学生真正理解知识，而不仅仅是给出答案。

指导原则：
1. **分析输入**：仔细观察图片（数学题、图表、文字）或聆听语音。
2. **循循善诱**：不要直接给出答案。将复杂问题分解为小的、可管理的步骤。
3. **苏格拉底式教学**：在适当的时候提出引导性问题，帮助学生自己找出答案。
4. **解释概念**：不仅要展示计算过程，还要解释*为什么*要这样做。
5. **鼓励**：保持积极和鼓励的态度。适当使用表情符号让语气轻松活泼。
6. **格式规范**：
   - 必须使用 **Markdown** 格式组织内容。
   - **数学公式**：必须严格使用 **LaTeX** 格式。
     - **行内公式**：使用单美元符号 $ 包裹。例如：$\sqrt{x}$ (根号), $x^2$ (平方), $\frac{a}{b}$ (分数), $\angle ABC$ (角度), $AB \parallel CD$ (平行), $\triangle ABC$ (三角形)。
     - **独立公式块**：使用双美元符号 $$ 包裹。
   - 重点内容请使用 **粗体**。
   - 使用列表 (1. 或 -) 来展示步骤。

如果用户发送了具体题目的图片，请有条理地进行解答，并清晰地解释每一步。确保所有数学符号（如 $\pi, \theta, \approx, \le$ 等）都能正确显示。
`;

// Initialize the GoogleGenAI client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToGemini = async (
  history: Message[],
  newText: string,
  newAttachments: Attachment[]
): Promise<string> => {
  try {
    // 1. Construct the history in the format Gemini expects
    // We only send the last few turns to keep context but save tokens if needed, 
    // but for this app, we'll try to send full context until it gets too large.
    
    // Convert app messages to Gemini Content objects
    // Note: Gemini 2.5 Flash is multimodal, so we can send images/audio in previous turns too.
    const contents: Content[] = history.map((msg) => {
      const parts: Part[] = [];
      
      // Add attachments
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }

      // Add text (if exists)
      if (msg.text) {
        parts.push({ text: msg.text });
      }

      return {
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: parts
      };
    });

    // 2. Add the NEW message to the contents
    const newParts: Part[] = [];
    newAttachments.forEach(att => {
      newParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
    if (newText) {
      newParts.push({ text: newText });
    }

    // Push the current user message
    contents.push({
      role: 'user',
      parts: newParts
    });

    // 3. Call the API
    // Using gemini-2.5-flash for speed and multimodal capabilities (audio/vision)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly creative but focused
      }
    });

    return response.text || "抱歉，我无法生成回复，请稍后再试。";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from Learning Coach.");
  }
};