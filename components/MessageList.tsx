import React, { useEffect, useRef, ReactNode } from 'react';
import { Message, Role } from '../types';
import { Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onAskOtherTeacher?: () => void;
  otherProviderName?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Robust Error Boundary to catch any Markdown/Katex crashes
class MarkdownErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Markdown/Math rendering error:", error);
  }

  render() {
    if (this.state.hasError) {
      // Fallback: Display raw text cleanly
      return (
        <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-red-50 p-2 rounded border border-red-100">
          {this.props.fallback}
        </div>
      );
    }
    return this.props.children;
  }
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onAskOtherTeacher, otherProviderName }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  return (
    <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar">
      {messages.map((msg, index) => {
        const isUser = msg.role === Role.USER;
        const isLast = index === messages.length - 1;
        return (
          <div
            key={msg.id}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md ${isUser
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                : 'bg-white text-indigo-600 border border-indigo-100'
                }`}>
                {isUser ? <User size={18} className="text-white" /> : <Bot size={20} />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm ${isUser
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white user-bubble rounded-tr-none'
                  : 'bg-white/80 backdrop-blur-sm border border-white/50 text-gray-800 rounded-tl-none'
                  }`}>
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={att.previewUrl}
                            alt="attachment"
                            className="h-32 w-auto rounded-lg border-2 border-white/20 shadow-sm object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="markdown-body">
                    <MarkdownErrorBoundary fallback={msg.text}>
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          // Custom renderer for code blocks to handle math/latex better if needed
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                          a: ({ node, ...props }) => <a className="text-indigo-600 hover:underline" {...props} />,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </MarkdownErrorBoundary>
                  </div>

                  {/* Timestamp */}
                  <div className={`text-[10px] mt-1 opacity-70 ${isUser ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Ask Other Teacher Button */}
                {!isUser && isLast && !isLoading && onAskOtherTeacher && (
                  <button
                    onClick={onAskOtherTeacher}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors self-start"
                  >
                    <Sparkles size={12} />
                    听听{otherProviderName}怎么说
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex w-full justify-start animate-fade-in">
          <div className="flex max-w-[75%] gap-3 flex-row">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md bg-white text-indigo-600 border border-indigo-100">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm ml-2">思考中...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;