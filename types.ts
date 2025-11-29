export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type AttachmentType = 'image' | 'audio';

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
  type: AttachmentType;
  previewUrl?: string; // For displaying in UI
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
