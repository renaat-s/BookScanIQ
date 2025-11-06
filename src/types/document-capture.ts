export interface N8nUploadResponse {
  success?: boolean;
  categorizationFailed?: boolean;
  needsMoreInfo?: boolean;
  userName?: string;
  category?: string;
  message?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface EdgeFunctionResponse {
  choices?: Array<{
    message?: {
      content: string;
    };
  }>;
  error?: string;
}

export interface CategoryResult {
  category: string;
  confidence: number;
  details?: string;
}
