// types/chat.ts

export interface Message {
  id: string;
  is_me: boolean;
  text: string;
  file: string | null;
  timestamp: string;
  is_read: boolean;
}

export interface Participant {
  id: number;
  full_name: string;
  profile_photo: string | null;
  is_online: boolean;
  role?: string;
}

export interface ServiceContext {
  id: number;
  title: string;
  slug: string;
  image: string | null;
}

export interface Ticket {
  id: number; // Database ID
  ticket_id: string; // TCK-XXXX format
  title: string | null;
  subject: string;
  description?: string | Message[]; // description is the JSON conversation
  file: string | null;
  file_public_id: string | null;
  priority_level: "low" | "medium" | "high";
  response_status: "open" | "close" | "ongoing";
  service_id: number;
  customer_id: number;
  service_provider_id: number;
  customer_last_read_at: string | null;
  provider_last_read_at: string | null;

  // Flattened fields from your listTickets transformer
  full_name?: string;
  profile_photo?: string | null;
  last_message?: string | null;
  last_message_time?: string | null;
  online_status?: "online" | "offline";
}

export interface ChatDetailResponse {
  ticket_id: string;
  db_id: number;
  subject: string;
  priority: string;
  status: string;
  participant: Participant;
  service_context: ServiceContext | null;
  messages: Message[];
}
