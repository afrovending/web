import api from "../../axios";

export interface AskSellerCopilotPayload {
  message: string;
  conversation_id?: number; // now optional
}

export interface AskSellerCopilotResponse {
  reply: string;
  conversation_id: number;
}

/**
 * Call the backend Seller Copilot API
 */
export async function askSellerCopilot(
  payload: AskSellerCopilotPayload
): Promise<AskSellerCopilotResponse> {
  const response = await api.post<AskSellerCopilotResponse>(
    "/vendor/seller-copilot/chat",
    payload
  );
  return response.data;
}

export interface AiMessage {
  id: number;
  ai_conversation_id: number;
  role: "user" | "assistant" | string;
  content: string;
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AiConversationSummary {
  id: number;
  seller_id: number;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export async function getHistories(): Promise<AiMessage[]> {
  const response = await api.get<AiMessage[]>(
    "/vendor/seller-copilot/histories"
  );
  return response.data;
}

export async function getConversationHistory(
  conversationId: number
): Promise<AiMessage[]> {
  const response = await api.get<AiMessage[]>(
    "/vendor/seller-copilot/history",
    {
      params: {
        conversation_id: conversationId,
      },
    }
  );
  return response.data;
}
