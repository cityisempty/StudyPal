import React, { useState } from 'react';
import { Message, Role, Attachment } from './types';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import CameraModal from './components/CameraModal';
import { sendMessageToGemini } from './services/geminiService';
import { GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingCameraCapture, setPendingCameraCapture] = useState<{data: string, mime: string} | null>(null);

  const handleSend = async (text: string, attachments: Attachment[]) => {
    // 1. Add User Message to State
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      attachments: attachments,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Call Gemini API
      // We pass the full message history (excluding the one we just added to state, 
      // but logic inside service handles reconstruction or we pass updated list)
      // Actually, let's pass the *previous* messages + the new content separately to the service wrapper 
      // so it can format the final "turn".
      
      const responseText = await sendMessageToGemini(messages, text, attachments);

      // 3. Add Model Response to State
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: "连接出现问题，请重试。",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = (base64: string, mimeType: string) => {
    // When camera captures, we want to basically inject this into the input area.
    // However, the InputArea state is local. 
    // We can solve this by passing an "externalAttachment" prop to InputArea, 
    // or more simply, just triggering a "send" immediately or asking the user to confirm.
    
    // Let's create a temporary fake attachment to "auto-fill" the input area, 
    // but since InputArea is uncontrolled for outside props in this simple design,
    // we will modify InputArea to accept an initial attachment, or we can just send it immediately?
    
    // Better UX: Send the image immediately with an empty text prompt implied "Solve this" or "Explain this"? 
    // Or let user type? Let's let user type.
    // To do that, we need to lift InputArea state up or expose a method.
    // For simplicity in this structure: We will close camera and pass the data down to InputArea via a key or context?
    // Actually, let's just use a callback prop on InputArea that we can trigger, 
    // but React functional components don't work that way easily without refs.
    
    // Alternative: We store "cameraResult" in App state, pass it to InputArea. 
    // InputArea useEffect detects it, adds to its local state, then clears App state.
    setPendingCameraCapture({ data: base64, mime: mimeType });
    setShowCamera(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <GraduationCap className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-lg text-gray-800 tracking-tight">AI 学习助手</h1>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">
            演示版
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-grow flex flex-col overflow-hidden relative">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>

      {/* Input Area */}
      <div className="flex-shrink-0 z-20">
        <InputArea 
          onSend={handleSend} 
          isLoading={isLoading} 
          onOpenSelfieCamera={() => setShowCamera(true)}
        />
        {/* We use a key trick to force re-render InputArea if we wanted to reset, 
            but here we need to inject the pending capture. 
            Ideally, we'd refactor InputArea to control state from here, but let's use a Wrapper or useEffect inside InputArea.
        */}
        <PendingCaptureHandler 
            pendingCapture={pendingCameraCapture} 
            onConsumed={(text, atts) => {
                handleSend(text, atts);
                setPendingCameraCapture(null);
            }} 
        />
      </div>

      {/* Camera Modal Overlay */}
      {showCamera && (
        <CameraModal 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>
  );
};

// Helper component to handle the logic of "User took a photo, now send it"
// This simplifies the flow without complex state lifting for the InputArea text
const PendingCaptureHandler: React.FC<{
    pendingCapture: {data: string, mime: string} | null,
    onConsumed: (text: string, attachments: Attachment[]) => void
}> = ({ pendingCapture, onConsumed }) => {
    React.useEffect(() => {
        if (pendingCapture) {
             const newAtt: Attachment = {
                mimeType: pendingCapture.mime,
                data: pendingCapture.data,
                type: 'image',
                previewUrl: `data:${pendingCapture.mime};base64,${pendingCapture.data}`
            };
            // Automatically send the image with a default prompt or empty
            // UX Decision: Let's prompt "Help me with this".
            onConsumed("请帮我讲解一下这个。", [newAtt]);
        }
    }, [pendingCapture, onConsumed]);
    return null;
}

export default App;