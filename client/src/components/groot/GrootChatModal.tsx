import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Image as ImageIcon, Upload, XCircle, Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import GrootSvg from "@/components/ui/groot";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  imageBase64?: string;
  isGenerated?: boolean;
}

interface GrootChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrootChatModal({ open, onOpenChange }: GrootChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm GROOT 🌱 Your Electronics Learning Assistant. How can I help you learn today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedImage) || loading) return;

    const userMessage = input.trim();
    const userImage = uploadedImage;
    
    setInput("");
    setUploadedImage(null);
    setImagePreview(null);
    
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage || "Analyze this image",
        imageBase64: userImage || undefined,
      },
    ]);
    setLoading(true);

    try {
      // Determine which endpoint to use
      let endpoint = "/api/groot/chat";
      let body: any = { message: userMessage || "What do you see in this image?" };

      // If image is uploaded, use image analysis endpoint
      if (userImage) {
        endpoint = "/api/groot/analyze-image";
        body = {
          message: userMessage || "Analyze this image and explain what you see. Focus on any electronics components, circuits, or IoT devices.",
          image: userImage,
        };
      } else if (userMessage && (
                 userMessage.toLowerCase().includes("generate") || 
                 userMessage.toLowerCase().includes("create") || 
                 userMessage.toLowerCase().includes("draw") ||
                 userMessage.toLowerCase().includes("make an image") ||
                 userMessage.toLowerCase().includes("show me") ||
                 userMessage.toLowerCase().startsWith("image of"))) {
        // If user wants to generate an image, use image generation endpoint
        endpoint = "/api/groot/generate-image";
        body = { prompt: userMessage };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle image generation response
      if (data.imageUrl) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || "Here's the image I generated for you!",
            imageUrl: data.imageUrl,
            isGenerated: true,
          },
        ]);
      } else if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Sorry 🌱 I'm having trouble right now. Please try again later.";
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry 🌱 ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stopSpeaking = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setSpeaking(false);
  };

  const speakLastAssistant = async () => {
    if (speaking) {
      stopSpeaking();
      return;
    }

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content);
    const text = lastAssistant?.content;
    if (!text) return;

    try {
      setSpeaking(true);
      const response = await fetch("/api/groot/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error("TTS request failed");
        setSpeaking(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (e) {
      console.error("Error playing TTS audio", e);
      setSpeaking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-emerald-500/10 to-green-500/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center text-xl font-bold">
              <GrootSvg width={48} height={48} fill="#6B4F2A" />
              <span>Ask GROOT</span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - GROOT Image/Info */}
          <div className="w-1/3 border-r border-border bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-emerald-50/80 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-emerald-950/30 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200/20 dark:bg-green-800/10 rounded-full blur-xl" />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center relative z-10"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-4 flex items-center justify-center"
              >
                <GrootSvg width={240} height={240} fill="#6B4F2A" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2 bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                I am GROOT
              </h3>
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
                Your Electronics Learning Assistant
              </p>
              <div className="mt-6 space-y-3 text-xs">
                <p className="font-semibold text-foreground text-sm mb-3">I can help with:</p>
                <div className="space-y-2">
                  {[
                    "Electronics fundamentals",
                    "IoT concepts",
                    "Arduino & ESP32",
                    "Sensors & actuators",
                    "Circuit basics",
                  ].map((item, idx) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-center gap-2 text-left text-muted-foreground"
                    >
                      <span className="text-emerald-500">✓</span>
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}
                      <motion.div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground border border-border"
                        )}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Display image if present */}
                        {message.imageUrl && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            <img
                              src={message.imageUrl}
                              alt="Generated by GROOT"
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                        {message.imageBase64 && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            <img
                              src={message.imageBase64}
                              alt="Uploaded image"
                              className="max-w-full h-auto rounded-lg max-h-64 object-contain"
                            />
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </motion.div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="bg-muted text-foreground border border-border rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-gradient-to-t from-muted/50 to-background">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs max-h-32 object-contain"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  title="Upload image"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask GROOT about electronics, IoT, Arduino..."
                  disabled={loading}
                  className="flex-1 bg-background border-border/50 focus:border-emerald-500"
                />
                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !uploadedImage) || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={speakLastAssistant}
                  title={speaking ? "Stop speaking" : "Read latest reply"}
                >
                  {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • ESC to close • Upload images or ask to generate images • Tap speaker to hear Groot
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

