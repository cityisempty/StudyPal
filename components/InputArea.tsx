import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Camera, Mic, X, Loader2, StopCircle } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onOpenSelfieCamera: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, onOpenSelfieCamera }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const base64 = dataUrl.split(',')[1];
          const type = file.type.startsWith('image') ? 'image' : 'audio'; // Basic check
          
          setAttachments(prev => [...prev, {
            mimeType: file.type,
            data: base64,
            type: type as 'image' | 'audio',
            previewUrl: dataUrl
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // or webm
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
             // Standardize mime type for Gemini if possible, or use the one from blob
            setAttachments(prev => [...prev, {
              mimeType: audioBlob.type || 'audio/wav',
              data: base64,
              type: 'audio',
              previewUrl: null // No visual preview for audio needed in input bar strictly, or add icon
            }]);
            
            // Auto send? Or let user confirm? Let's let user confirm/add text.
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("无法访问麦克风。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-3 pb-safe-area">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              {att.type === 'image' ? (
                <img src={att.previewUrl} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="h-16 w-16 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg border border-blue-200">
                  <Mic size={20} />
                </div>
              )}
              <button 
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Tools Menu */}
        <div className="flex gap-1 pb-2">
           {/* Hidden File Input */}
           <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" // Limiting to images for this button, could be *
            onChange={handleFileSelect}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="上传图片"
          >
            <ImageIcon size={24} />
          </button>
          
          <button 
            onClick={onOpenSelfieCamera}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="拍照"
          >
            <Camera size={24} />
          </button>

           <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-600 bg-red-100 animate-pulse' : 'text-gray-500 hover:bg-gray-100'}`}
            title="语音输入"
          >
            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-grow bg-gray-100 rounded-2xl p-2 min-h-[44px] flex items-center">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "录音中..." : "有问题尽管问..."}
                className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 resize-none max-h-32 text-base px-2 py-1 no-scrollbar"
                rows={1}
                style={{minHeight: '24px'}}
                disabled={isRecording}
            />
        </div>

        {/* Send Button */}
        <button 
          onClick={handleSend}
          disabled={isLoading || (text.trim() === '' && attachments.length === 0)}
          className={`p-3 rounded-full flex-shrink-0 mb-0.5 transition-all ${
            (text.trim() !== '' || attachments.length > 0) && !isLoading
              ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

export default InputArea;