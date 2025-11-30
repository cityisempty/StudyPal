import { Message, Attachment } from "../types";

export async function* streamMessage(
    history: Message[],
    newText: string,
    newAttachments: Attachment[],
    provider: 'openai' | 'google' = 'google'
): AsyncGenerator<string, void, unknown> {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                history,
                newText,
                newAttachments,
                provider
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.text) {
            yield data.text;
        }

    } catch (error) {
        console.error("Request Error:", error);
        throw error;
    }
}
