import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Camera, X } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onOpenSelfieCamera: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, onOpenSelfieCamera }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((text.trim() || attachments.length > 0) && !isLoading) {
      onSend(text, attachments);
      setText('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix to get raw base64
        const base64Data = base64String.split(',')[1];

        const newAttachment: Attachment = {
          type: 'image',
          mimeType: file.type,
          data: base64Data,
          previewUrl: base64String
        };
        setAttachments([...attachments, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    setText(target.value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-3 mb-3 overflow-x-auto py-2 px-1">
          {attachments.map((att, index) => (
            <div key={index} className="relative group animate-fade-in">
              <img
                src={att.previewUrl}
                alt="preview"
                className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-md"
              />
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-lg shadow-indigo-500/5 p-2 transition-all focus-within:shadow-indigo-500/10 focus-within:border-indigo-300/50">

        {/* Left Actions */}
        <div className="flex items-center gap-1 mb-1 ml-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200"
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={onOpenSelfieCamera}
            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200"
            title="Take Photo"
          >
            <Camera size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex-grow">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autoResize(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-[120px] py-3 px-2 text-gray-700 placeholder-gray-400 leading-relaxed"
            rows={1}
            style={{ height: 'auto' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && attachments.length === 0) || isLoading}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${(!text.trim() && attachments.length === 0) || isLoading
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30 hover:scale-105 active:scale-95'
            }`}
          title="发送"
        >
          <Send size={20} className={isLoading ? 'opacity-0' : ''} />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
        </button>
      </div>

      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">
          AI 可能会犯错。请核实重要信息。
        </p>
      </div>
    </div>
  );
};

export default InputArea;