'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, Attachment } from '../types';
import MessageList from '../components/MessageList';
import InputArea from '../components/InputArea';
import CameraModal from '../components/CameraModal';
import { streamMessage } from '../services/chatService';
import { GraduationCap, Sparkles, Trash2, Menu, Bot, Zap } from 'lucide-react';

const PendingCaptureHandler: React.FC<{
    pendingCapture: { data: string, mime: string } | null,
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

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [pendingCameraCapture, setPendingCameraCapture] = useState<{ data: string, mime: string } | null>(null);
    const [currentProvider, setCurrentProvider] = useState<'openai' | 'google'>('google');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string, attachments: Attachment[], overrideProvider?: 'openai' | 'google') => {
        const providerToUse = overrideProvider || currentProvider;

        // If not overriding (normal send), add user message
        if (!overrideProvider) {
            const userMessage: Message = {
                id: Date.now().toString(),
                role: Role.USER,
                text: text,
                attachments: attachments,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, userMessage]);
        }

        setIsLoading(true);

        const botMessageId = (Date.now() + 1).toString();
        const initialBotMessage: Message = {
            id: botMessageId,
            role: Role.MODEL,
            text: '',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, initialBotMessage]);

        try {
            const stream = streamMessage(messages, text, attachments, providerToUse);
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

    const handleAskOtherTeacher = () => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === Role.USER);
        if (!lastUserMessage) return;

        const otherProvider = currentProvider === 'openai' ? 'google' : 'openai';
        handleSend(lastUserMessage.text, lastUserMessage.attachments || [], otherProvider);
    };

    const handleNewChat = () => {
        if (messages.length > 0) {
            if (confirm("确定要清空当前对话开始新的话题吗？")) {
                setMessages([]);
            }
        }
    };

    const handleCameraCapture = (dataUrl: string) => {
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64 = matches[2];
            setPendingCameraCapture({ data: base64, mime: mimeType });
            setShowCamera(false);
        } else {
            console.error("Invalid data URL format");
            setShowCamera(false);
        }
    };


    return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">

            <div className="w-full max-w-5xl h-full flex flex-col glass-panel rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in">

                {/* Header */}
                <header className="bg-white/40 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                            <GraduationCap className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-gray-800 tracking-tight flex items-center gap-2">
                                StudyPal <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200">Beta</span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">您的 AI 学习助手</p>
                        </div>
                    </div>

                    {/* Provider Switcher */}
                    <div className="flex items-center bg-white/50 rounded-full p-1 border border-white/50 shadow-sm hidden md:flex">
                        <button
                            onClick={() => setCurrentProvider('openai')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${currentProvider === 'openai'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-white/50'
                                }`}
                        >
                            <Bot size={14} />
                            OpenAI老师
                        </button>
                        <button
                            onClick={() => setCurrentProvider('google')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${currentProvider === 'google'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-white/50'
                                }`}
                        >
                            <Zap size={14} />
                            Gemini老师
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNewChat}
                            className="p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-200 group"
                            title="开始新对话"
                        >
                            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </header>

                {/* Main Chat Area */}
                <main className="flex-grow flex flex-col overflow-hidden relative bg-white/30">
                    {messages.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 animate-slide-up">
                            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-200 animate-pulse-slow">
                                <Sparkles className="text-white w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-3">你好, 同学!</h2>
                            <p className="text-gray-600 max-w-md text-lg leading-relaxed">
                                我是你的 AI 辅导老师。问我问题，上传题目，或者我们可以一起探索新知识。
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
                                {["解释量子物理", "解决这道数学题", "考考我的历史知识", "制定学习计划"].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(suggestion, [])}
                                        className="p-4 bg-white/60 hover:bg-white/90 border border-white/50 rounded-xl text-left text-gray-700 font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <MessageList
                            messages={messages}
                            isLoading={isLoading}
                            onAskOtherTeacher={handleAskOtherTeacher}
                            otherProviderName={currentProvider === 'openai' ? 'Gemini老师' : 'OpenAI老师'}
                        />
                    )}
                    <div ref={messagesEndRef} />
                </main>

                {/* Input Area */}
                <div className="flex-shrink-0 z-20 bg-white/40 backdrop-blur-md border-t border-white/20 p-4 md:p-6">
                    <InputArea
                        onSend={(text, atts) => handleSend(text, atts)}
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
        </div>
    );
};

export default App;
