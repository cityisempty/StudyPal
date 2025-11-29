import React, { useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 mt-20">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Bot size={48} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">你好！我是你的 AI 学习助手</h2>
          <p className="max-w-xs text-sm">
            拍照上传题目、提问或练习概念。我在这里助你学习一臂之力！
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex w-full gap-3 ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            msg.role === Role.USER ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
             {msg.role === Role.USER ? <User size={16} /> : <Bot size={16} />}
          </div>

          {/* Bubble */}
          <div className={`flex flex-col max-w-[85%] ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
            
            {/* Attachments */}
            {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2 justify-end">
                    {msg.attachments.map((att, i) => (
                        att.type === 'image' && att.previewUrl ? (
                            <img 
                                key={i} 
                                src={att.previewUrl} 
                                alt="Attachment" 
                                className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 shadow-sm object-cover" 
                            />
                        ) : att.type === 'audio' ? (
                            <div key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">语音片段</div>
                        ) : null
                    ))}
                </div>
            )}

            {/* Text Content */}
            {msg.text && (
                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden ${
                msg.role === Role.USER 
                    ? 'bg-indigo-600 text-white rounded-tr-sm user-bubble' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                    <div className="markdown-body">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            // Override link opening in new tab
                            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                </div>
            )}
            
            <span className="text-[10px] text-gray-400 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex w-full gap-3">
           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
             <Bot size={16} />
          </div>
          <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;