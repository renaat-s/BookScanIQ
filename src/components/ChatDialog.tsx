import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, EdgeFunctionResponse } from "@/types/document-capture";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  receiptData?: Record<string, unknown>;
  onCategorize: (category: string) => void;
}

const ChatDialog = ({ open, onOpenChange, userName = "there", receiptData, onCategorize }: ChatDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello ${userName}. It seems I wasn't able to scan this Receipt because of some missing details. Could you tell me what this expenditure was for?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submitCategoryToN8n = async (category: string) => {
    try {
      console.log("Submitting category to n8n:", category);
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: { 
          submitCategory: true, 
          category, 
          receiptData,
          userName 
        },
      });

      if (error) {
        console.error("Failed to submit category to n8n:", error);
      } else {
        console.log("Category submitted successfully:", data);
      }
    } catch (err) {
      console.error("Error submitting category:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>("chat-assistant", {
        body: { messages: [...messages, userMessage], userName },
      });

      if (error) {
        throw new Error(error.message || "Failed to get response from assistant");
      }

      const response = data as EdgeFunctionResponse;
      
      if (response?.choices?.[0]?.message?.content) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.choices[0].message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Check if the assistant has determined a category
        const content = response.choices[0].message.content.toLowerCase();
        const categoryPatterns = [
          /categorized as\s+([a-z\s/]+)/i,
          /category:\s*([a-z\s/]+)/i,
          /this is a\s+([a-z\s/]+)/i,
          /type:\s*([a-z\s/]+)/i,
        ];
        
        for (const pattern of categoryPatterns) {
          const match = content.match(pattern);
          if (match) {
            const extractedCategory = match[1].trim();
            // Submit to n8n backend
            await submitCategoryToN8n(extractedCategory);
            setTimeout(() => {
              onCategorize(extractedCategory);
            }, 1000);
            break;
          }
        }
      } else {
        throw new Error("Invalid response format from assistant");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Categorization Assistant</DialogTitle>
          <DialogDescription>
            Help us categorize your receipt by providing additional details
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
