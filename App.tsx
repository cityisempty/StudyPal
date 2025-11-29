import React, { useState } from 'react';
import { Message, Role, Attachment } from './types';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import CameraModal from './components/CameraModal';
import { streamMessageFromGemini } from './services/geminiService';
import { GraduationCap, Trash2 } from 'lucide-react';

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

    // Use functional update to ensure we have the latest state if things happen fast
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // 2. Prepare Placeholder for Bot Response
    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, initialBotMessage]);

    try {
      // 3. Call Gemini API Stream
      // Note: We pass the *current* messages (excluding the empty bot placeholder we just added)
      // to the service. The service handles the construction.
      // We need to pass the list *before* the new user message was effectively committed if we were strictly react pure,
      // but here we just pass `messages` (which is previous history) and append the new input args in the service call.
      
      const stream = streamMessageFromGemini(messages, text, attachments);
      
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: fullText } 
            : msg
        ));
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: msg.text + "\n\n(连接中断，请重试)" } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      if (confirm("确定要清空当前对话开始新的话题吗？")) {
        setMessages([]);
      }
    }
  };

  const handleCameraCapture = (base64: string, mimeType: string) => {
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
        <div className="flex items-center gap-2">
           <button 
            onClick={handleNewChat}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-red-500 rounded-full transition-colors"
            title="新对话"
          >
            <Trash2 size={20} />
          </button>
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
            onConsumed("请帮我讲解一下这个。", [newAtt]);
        }
    }, [pendingCapture, onConsumed]);
    return null;
}

export default App;