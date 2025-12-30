import api from "../axios"; 

export async function listServiceChats(offset: number = 0, limit: number = 10) {
  const { data } = await api.get(`tickets`, {
    params: { offset, limit },
  });
  return data;
}

/**
 * Fetch full conversation for a specific ticket
 */
export async function getServiceChat(ticketId: string) {
  const { data } = await api.get(`tickets/${ticketId}`);
  return data;
}

/**
 * Create a new ticket or reply to an existing one
 * Expects FormData for file upload support
 */
export const replyServiceChat = async (payload: FormData) => {
  const { data } = await api.post("/tickets/upsert", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

/**
 * Sends the booking proposal to the backend
 * @param payload { ticket_id, delivery_method, start_date, end_date, address, amount }
 */
export const createBookingProposal = async (payload: {
  ticket_id: string;
  delivery_method: string;
  start_date: string;
  end_date: string;
  address?: string;
  amount: number;
}) => {
  const { data } = await api.post("/customer/booking/upsert", payload);
  return data;
};

export const verifyBookingStripeSession = async (sessionId: string) => {
  const res = await api.get(`/customer/booking/payment/verify?session_id=${sessionId}`);
  return res.data;
};