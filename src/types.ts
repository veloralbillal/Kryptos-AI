export enum Module {
  TERMINAL = 'terminal',
  ASSISTANT = 'assistant',
  VULNERABILITY = 'vulnerability',
  ENCRYPTION = 'encryption',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
