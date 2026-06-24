import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  Lock, 
  MessageSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Menu, 
  X, 
  Cpu,
  Activity,
  Zap,
  ChevronRight,
  Send,
  User,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Module, Message } from './types.ts';
import { SYSTEM_INSTRUCTION } from './constants.ts';
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { LiveAssistantService } from './services/liveAssistant.ts';
import { playPcm } from './utils/audio.ts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = ({ 
  activeModule, 
  setActiveModule, 
  isOpen, 
  onClose 
}: { 
  activeModule: Module, 
  setActiveModule: (m: Module) => void,
  isOpen: boolean,
  onClose: () => void
}) => {
  const modules = [
    { id: Module.TERMINAL, icon: TerminalIcon, label: 'Terminal' },
    { id: Module.ASSISTANT, icon: MessageSquare, label: 'Live Assistant' },
    { id: Module.VULNERABILITY, icon: ShieldAlert, label: 'Vulnerability Scan' },
    { id: Module.ENCRYPTION, icon: Lock, label: 'Encryption' },
  ];

  const handleModuleSelect = (m: Module) => {
    setActiveModule(m);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-matrix-border bg-matrix-bg flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-20",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-matrix-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-matrix-green/20 border border-matrix-green flex items-center justify-center rounded-sm animate-pulse shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <Cpu className="w-5 h-5 text-matrix-green" />
            </div>
            <h1 className="text-xl font-mono font-bold tracking-tighter terminal-glow text-matrix-green">KRYPTOS</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-matrix-green/60 hover:text-matrix-green">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-4">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModuleSelect(m.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-3 transition-all font-mono text-sm group relative",
                activeModule === m.id 
                  ? "text-matrix-green bg-matrix-green/5" 
                  : "text-matrix-green/40 hover:text-matrix-green hover:bg-matrix-green/5"
              )}
            >
              {activeModule === m.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-full bg-matrix-green shadow-[0_0_10px_rgba(0,255,65,0.5)]" 
                />
              )}
              <m.icon className={cn("w-4 h-4", activeModule === m.id ? "opacity-100" : "opacity-40 group-hover:opacity-100")} />
              <span>{m.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-matrix-border">
          <div className="flex items-center gap-2 text-[10px] font-mono text-matrix-green/30 uppercase tracking-widest mb-2">
            <Activity className="w-3 h-3" />
            System Status
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-matrix-green/40">Uptime</span>
              <span className="text-matrix-green/60">99.99%</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-matrix-green/40">Latency</span>
              <span className="text-matrix-green/60">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = ({ title, onOpenMenu }: { title: string, onOpenMenu: () => void }) => (
  <header className="h-16 border-b border-matrix-border glass-panel flex items-center justify-between px-4 lg:px-6 z-10">
    <div className="flex items-center gap-3 lg:gap-4">
      <button 
        onClick={onOpenMenu}
        className="lg:hidden p-2 -ml-2 text-matrix-green/60 hover:text-matrix-green"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-matrix-green animate-pulse shadow-[0_0_8px_rgba(0,255,65,0.8)]" />
        <span className="font-mono text-[9px] lg:text-xs text-matrix-green/60 uppercase tracking-widest truncate max-w-[80px] xs:max-w-[120px] lg:max-w-none animate-pulse">Secure Link Active</span>
      </div>
      <div className="h-4 w-[1px] bg-matrix-border hidden sm:block" />
      <h2 className="font-mono text-xs lg:text-sm text-matrix-green uppercase tracking-widest truncate">{title}</h2>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-2 lg:px-3 py-1 bg-matrix-green/5 border border-matrix-green/20 rounded-sm">
        <Zap className="w-3 h-3 text-matrix-green" />
        <span className="font-mono text-[8px] lg:text-[10px] text-matrix-green/80 uppercase whitespace-nowrap">L3 Clearance</span>
      </div>
    </div>
  </header>
);

// --- Main App ---

const CodeBlock = ({ children, className }: { children: any; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!className) {
    return <code className="bg-matrix-green/10 px-1 rounded text-matrix-green">{children}</code>;
  }

  return (
    <div className="relative group/code my-4">
      <div className="absolute right-2 top-2 z-20 opacity-0 group-hover/code:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-matrix-bg/80 border border-matrix-green/30 rounded-sm hover:bg-matrix-green/20 text-matrix-green transition-all active:scale-90"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {language && (
        <div className="absolute left-4 -top-2 px-2 py-0.5 bg-matrix-bg border border-matrix-green/20 text-[8px] text-matrix-green/40 font-bold uppercase tracking-widest rounded-sm z-10">
          {language}
        </div>
      )}
      <pre className="p-4 pt-6 bg-black/40 border border-matrix-green/10 rounded-sm overflow-x-auto scrollbar-thin">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

const COMMANDS = [
  'help', 'clear', 'scan', 'encrypt', 'decrypt', 'status', 'whoami', 'exit', 
  'nmap', 'sqlmap', 'metasploit', 'burp', 'kali', 'termux', 'python', 'node',
  'ls', 'cd', 'cat', 'grep', 'ssh', 'ftp', 'ping', 'traceroute'
];

const SyntaxHighlighter = ({ text }: { text: string }) => {
  const parts = text.split(/(\s+)/);
  return (
    <div className="flex flex-wrap whitespace-pre pointer-events-none">
      {parts.map((part, i) => {
        const isCommand = COMMANDS.includes(part.toLowerCase());
        const isFlag = part.startsWith('-');
        const isPath = part.includes('/') || part.includes('.');
        
        return (
          <span 
            key={i} 
            className={cn(
              isCommand ? "text-matrix-green font-bold" : 
              isFlag ? "text-yellow-500/80" : 
              isPath ? "text-blue-400/80" : 
              "text-matrix-green/60"
            )}
          >
            {part}
          </span>
        );
      })}
    </div>
  );
};

const Typewriter = ({ text, delay = 10 }: { text: string, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);

  return (
    <div className="relative">
      <ReactMarkdown components={{ code: CodeBlock }}>{displayedText}</ReactMarkdown>
      {!isComplete && <span className="inline-block w-1.5 h-4 bg-matrix-green ml-1 animate-pulse" />}
    </div>
  );
};

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>(Module.TERMINAL);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'boot-1',
      role: 'model',
      text: '`[SYSTEM]: KRYPTOS OS v4.2.0 INITIALIZED.`',
      timestamp: Date.now() - 3000,
    },
    {
      id: 'boot-2',
      role: 'model',
      text: '`[LINK]: SECURE NEURAL CONNECTION ESTABLISHED.`',
      timestamp: Date.now() - 2000,
    },
    {
      id: 'boot-3',
      role: 'model',
      text: 'Greetings, Recruit. I am Kryptos. I am here to guide you on your journey to becoming a guardian of our digital frontiers. What shall we analyze today?',
      timestamp: Date.now() - 1000,
    }
  ]);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  // ... rest of state
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveAssistantRef = useRef<LiveAssistantService | null>(null);

  useEffect(() => {
    if (liveAssistantRef.current) {
      liveAssistantRef.current.setPlaybackRate(voiceSpeed);
    }
  }, [voiceSpeed]);

  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [encryptionInput, setEncryptionInput] = useState('');
  const [encryptionOutput, setEncryptionOutput] = useState('');

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  const handleEncrypt = () => {
    // Simple mock encryption (Base64 for demo)
    setEncryptionOutput(btoa(encryptionInput));
  };

  const handleDecrypt = () => {
    try {
      setEncryptionOutput(atob(encryptionInput));
    } catch {
      setEncryptionOutput('ERROR: Invalid ciphertext');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    const cmd = input.trim().toLowerCase();
    if (cmd === 'clear') {
      setMessages([]);
      setInput('');
      setHistory(prev => [input, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      return;
    }

    if (cmd === 'help') {
      setMessages(prev => [...prev, userMessage, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "### KRYPTOS OS COMMANDS\n\n- `help`: Show this menu\n- `clear`: Wipe terminal history\n- `scan`: Initialize vulnerability scan\n- `encrypt [text]`: Encrypt data\n- `decrypt [text]`: Decrypt data\n- `status`: Check system integrity\n- `whoami`: Display clearance level\n\n*Neural link active. Speak or type to interact.*",
        timestamp: Date.now() + 2,
      }]);
      setInput('');
      setHistory(prev => [input, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      return;
    }

    if (cmd === 'status') {
      setMessages(prev => [...prev, userMessage, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "### SYSTEM STATUS\n\n- **Uptime**: 99.99%\n- **Latency**: 12ms\n- **Clearance**: L3\n- **Neural Link**: STABLE\n- **Encryption**: AES-256 ACTIVE",
        timestamp: Date.now() + 2,
      }]);
      setInput('');
      setHistory(prev => [input, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      return;
    }

    if (cmd === 'whoami') {
      setMessages(prev => [...prev, userMessage, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "### USER PROFILE\n\n- **Clearance**: Level 3 (Guardian Recruit)\n- **Specialization**: Cyber Defense\n- **Status**: ACTIVE",
        timestamp: Date.now() + 2,
      }]);
      setInput('');
      setHistory(prev => [input, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      return;
    }

    setHistory(prev => [input, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStreamingMessage('`[ANALYZING INPUT...]`');
    scrollToBottom();

    try {
      // Small artificial delay for 'vibe'
      await new Promise(resolve => setTimeout(resolve, 500));
      setStreamingMessage('`[DECRYPTING RESPONSE...]`');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: messages.concat(userMessage).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + " Focus on building skilled hackers for national security. Always encourage ethical behavior and discourage unethical actions. Keep responses punchy and terminal-appropriate.",
        }
      });

      let fullText = '';
      let isFirstChunk = true;
      for await (const chunk of stream) {
        if (isFirstChunk) {
          setStreamingMessage('');
          isFirstChunk = false;
        }
        const chunkText = chunk.text || '';
        fullText += chunkText;
        setStreamingMessage(fullText);
        scrollToBottom();
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: fullText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingMessage(null);

      if (isTtsEnabled) {
        handleTts(fullText);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setStreamingMessage(null);
    }
  };

  const handleTts = async (text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a professional, authoritative veteran voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        playPcm(base64Audio, 24000, voiceSpeed);
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  const startStt = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    // @ts-ignore
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const toggleLiveAssistant = async () => {
    if (isLiveActive) {
      liveAssistantRef.current?.disconnect();
      setIsLiveActive(false);
    } else {
      if (!liveAssistantRef.current) {
        liveAssistantRef.current = new LiveAssistantService(process.env.GEMINI_API_KEY!);
      }
      liveAssistantRef.current.setPlaybackRate(voiceSpeed);
      await liveAssistantRef.current.connect({
        onOpen: () => setIsLiveActive(true),
        onClose: () => setIsLiveActive(false),
        onError: (err) => {
          console.error("Live Assistant Error:", err);
          setIsLiveActive(false);
        },
        onMessage: (text) => {
          // Optionally show live transcription in terminal
          console.log("Live Assistant:", text);
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const words = input.split(' ');
      const lastWord = words[words.length - 1].toLowerCase();
      if (lastWord) {
        const match = COMMANDS.find(c => c.startsWith(lastWord));
        if (match) {
          words[words.length - 1] = match;
          setInput(words.join(' '));
        }
      }
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-matrix-bg text-matrix-green font-sans relative overflow-hidden crt-flicker">
      <div className="scanline" />
      
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,65,0.02)_0%,transparent_100%)]">
        <Header title={activeModule} onOpenMenu={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 overscroll-contain">
          {activeModule === Module.TERMINAL && (
            <div className="font-mono text-sm space-y-6 max-w-4xl mx-auto relative min-h-full">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,65,0.05)_0%,transparent_100%)] animate-pulse pointer-events-none" />
              
              <div className="flex items-center gap-4 text-matrix-green/40 border-b border-matrix-border/30 pb-4 mb-4 sm:mb-8 relative z-10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] flex-1">KRYPTOS OS v4.2.0 [STABLE] - SECURE SHELL</div>
                <button 
                  onClick={() => setMessages([])}
                  className="text-[8px] uppercase tracking-widest text-matrix-green/20 hover:text-red-500/60 transition-colors"
                >
                  [Wipe Session]
                </button>
              </div>

              <AnimatePresence initial={false}>
                <div className="relative z-10 space-y-4 sm:space-y-6">
                  {messages.map((m) => (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "group flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-sm transition-all duration-300",
                        m.role === 'user' 
                          ? "bg-matrix-green/5 border-l-2 border-matrix-green/40 deep-coding-glow" 
                          : "bg-black/40 border-l-2 border-transparent hover:bg-matrix-green/[0.02]"
                      )}
                    >
                    <div className="shrink-0 flex flex-col items-center gap-1 sm:gap-2">
                      <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-sm border flex items-center justify-center",
                        m.role === 'user' ? "border-matrix-green/30 bg-matrix-green/10" : "border-matrix-green/10 bg-black/40"
                      )}>
                        {m.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-matrix-green/60" /> : <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-matrix-green" />}
                      </div>
                      <div className="text-[7px] sm:text-[8px] font-bold opacity-20 uppercase tracking-tighter">
                        {m.role === 'user' ? 'USR' : 'SYS'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] sm:text-[10px] font-bold text-matrix-green/40 uppercase tracking-widest truncate">
                          {m.role === 'user' ? 'Local User' : 'Kryptos Intelligence'}
                        </span>
                        <span className="text-[7px] sm:text-[8px] opacity-20 whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn(
                        "prose prose-invert prose-green max-w-none prose-xs sm:prose-sm leading-relaxed overflow-x-auto",
                        m.role === 'model' && "terminal-glow"
                      )}>
                        <ReactMarkdown
                          components={{
                            code: CodeBlock
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}

                  {streamingMessage !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-sm bg-matrix-green/5 border-l-2 border-matrix-green/40 deep-coding-glow"
                    >
                      <div className="shrink-0 flex flex-col items-center gap-1 sm:gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm border border-matrix-green/30 bg-matrix-green/10 flex items-center justify-center animate-pulse">
                          <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-matrix-green" />
                        </div>
                        <div className="text-[7px] sm:text-[8px] font-bold opacity-20 uppercase tracking-tighter">SYS</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] sm:text-[10px] font-bold text-matrix-green/40 uppercase tracking-widest">Kryptos Intelligence</span>
                          <div className="typing-indicator flex items-center">
                            <span />
                          </div>
                        </div>
                        <div className="prose prose-invert prose-green max-w-none prose-xs sm:prose-sm leading-relaxed overflow-x-auto terminal-glow">
                          <ReactMarkdown
                            components={{
                              code: CodeBlock
                            }}
                          >
                            {streamingMessage}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}

          {activeModule === Module.ASSISTANT && (
            <div className="h-full flex flex-col items-center justify-center space-y-6 sm:space-y-8 p-4">
              <div className="relative">
                <div className={cn(
                  "w-32 h-32 sm:w-48 sm:h-48 rounded-full border-2 border-matrix-green/20 flex items-center justify-center transition-all duration-500",
                  isLiveActive ? "scale-110 border-matrix-green shadow-[0_0_30px_rgba(0,255,65,0.2)]" : ""
                )}>
                  <div className={cn(
                    "w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-matrix-green/40 flex items-center justify-center",
                    isLiveActive ? "animate-pulse" : ""
                  )}>
                    <Mic className={cn("w-8 h-8 sm:w-12 sm:h-12 transition-colors", isLiveActive ? "text-matrix-green" : "text-matrix-green/20")} />
                  </div>
                  
                  {isLiveActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                          className="absolute w-full h-full rounded-full border border-matrix-green"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-mono font-bold tracking-widest uppercase">
                  {isLiveActive ? 'Live Link Active' : 'Real-time Voice Assistant'}
                </h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1.0, 1.25, 1.5, 2.0].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setVoiceSpeed(speed)}
                      className={cn(
                        "px-3 py-1 border border-matrix-border rounded-sm text-xs font-mono transition-all",
                        voiceSpeed === speed ? "bg-matrix-green text-black border-matrix-green" : "text-matrix-green/40 hover:text-matrix-green"
                      )}
                    >
                      {speed}x Speed
                    </button>
                  ))}
                </div>
                <p className="text-matrix-green/40 font-mono text-xs max-w-md">
                  {isLiveActive 
                    ? 'Full-duplex audio stream established. Speak naturally.' 
                    : 'Establish a low-latency neural link for real-time tactical briefings.'}
                </p>
              </div>

              <button 
                onClick={toggleLiveAssistant}
                className={cn(
                  "btn-primary px-8 py-3 text-lg flex items-center gap-3",
                  isLiveActive ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20" : ""
                )}
              >
                {isLiveActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isLiveActive ? 'Terminate Link' : 'Initialize Link'}
              </button>
            </div>
          )}

          {activeModule === Module.VULNERABILITY && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Network Integrity', value: '98%', status: 'Secure' },
                  { label: 'Active Threats', value: isScanning ? 'ANALYZING...' : '0', status: isScanning ? 'Warning' : 'Optimal' },
                  { label: 'Encryption Strength', value: 'AES-256', status: 'High' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 border border-matrix-border bg-matrix-surface/50 rounded-sm space-y-2">
                    <div className="text-[10px] font-mono text-matrix-green/40 uppercase tracking-widest">{stat.label}</div>
                    <div className="text-2xl font-mono font-bold">{stat.value}</div>
                    <div className="text-[10px] font-mono text-matrix-green uppercase">{stat.status}</div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border border-matrix-border bg-matrix-surface/50 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm uppercase tracking-widest">Vulnerability Scanner</h3>
                  <button 
                    onClick={startScan} 
                    disabled={isScanning}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isScanning ? 'Scanning...' : 'Start Deep Scan'}
                  </button>
                </div>
                <div className="h-48 border border-matrix-border bg-black/40 rounded-sm flex flex-col items-center justify-center relative overflow-hidden p-6">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                  
                  {isScanning ? (
                    <div className="w-full space-y-4 z-10">
                      <div className="flex justify-between font-mono text-xs">
                        <span>Scanning system files...</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-matrix-border rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-matrix-green shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <div className="font-mono text-[9px] sm:text-[10px] text-matrix-green/40 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                        <span>[OK] /etc/passwd</span>
                        <span>[OK] /var/log/auth.log</span>
                        <span>[OK] /usr/bin/sudo</span>
                        <span>[OK] /home/user/.ssh</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-matrix-green/20 font-mono text-xs animate-pulse z-10">
                      {scanProgress === 100 ? 'Scan Complete. No vulnerabilities found.' : 'Waiting for target initialization...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeModule === Module.ENCRYPTION && (
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-6 border border-matrix-border bg-matrix-surface/50 rounded-sm space-y-4">
                <h3 className="font-mono text-xs sm:text-sm uppercase tracking-widest">Kryptos Cipher Engine</h3>
                <textarea 
                  value={encryptionInput}
                  onChange={(e) => setEncryptionInput(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-matrix-border p-3 sm:p-4 font-mono text-sm text-matrix-green focus:outline-none focus:border-matrix-green/50 transition-colors resize-none"
                  placeholder="Enter plaintext or ciphertext..."
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button onClick={handleEncrypt} className="btn-primary flex-1">Encrypt (Base64)</button>
                  <button onClick={handleDecrypt} className="btn-primary flex-1">Decrypt (Base64)</button>
                </div>
                {encryptionOutput && (
                  <div className="p-4 bg-matrix-green/5 border border-matrix-green/20 rounded-sm space-y-2">
                    <div className="text-[10px] font-mono text-matrix-green/40 uppercase">Output</div>
                    <div className="font-mono text-sm break-all">{encryptionOutput}</div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border border-matrix-border bg-matrix-green/5 rounded-sm flex items-start gap-3">
                <Lock className="w-5 h-5 text-matrix-green shrink-0 mt-1" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold uppercase">Security Protocol</div>
                  <div className="text-[10px] font-mono text-matrix-green/60">
                    All encryption operations are performed locally. No keys or data are transmitted to the server.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        {activeModule === Module.TERMINAL && (
          <div className="p-4 lg:p-6 border-t border-matrix-border glass-panel deep-coding-glow">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 lg:gap-4">
              <div className="w-full flex-1 relative group/input">
                <div className="absolute inset-y-0 left-4 right-12 flex items-center pointer-events-none z-10 opacity-0 group-focus-within/input:opacity-100 transition-opacity overflow-hidden">
                  <SyntaxHighlighter text={input} />
                </div>
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Execute command or ask Kryptos..."
                  className={cn(
                    "w-full bg-black/40 border border-matrix-border px-4 py-3 font-mono text-sm focus:outline-none focus:border-matrix-green/50 transition-colors pr-12 relative z-0",
                    input ? "text-transparent caret-matrix-green" : "text-matrix-green"
                  )}
                />
                <button 
                  onClick={startStt}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors",
                    isRecording ? "text-red-500 animate-pulse" : "text-matrix-green/40 hover:text-matrix-green"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex border border-matrix-border rounded-sm overflow-hidden">
                  {[1.0, 1.25, 1.5, 2.0].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setVoiceSpeed(speed)}
                      className={cn(
                        "px-2 py-1 text-[10px] font-mono transition-colors",
                        voiceSpeed === speed ? "bg-matrix-green text-black" : "text-matrix-green/40 hover:text-matrix-green hover:bg-matrix-green/5"
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  className={cn(
                    "p-3 border border-matrix-border transition-all",
                    isTtsEnabled ? "bg-matrix-green/10 text-matrix-green border-matrix-green/30" : "text-matrix-green/40 hover:text-matrix-green"
                  )}
                  title="Toggle Voice Briefing"
                >
                  {isTtsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleSend}
                  className="btn-primary p-3 flex-1 sm:flex-none flex justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
