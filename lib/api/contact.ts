import api from "./axios";
import { AxiosError } from "axios";

interface Payload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default async function contactUs(formData: Payload) {
  try {
    const response = await api.post("/contact-us", {
      ...formData,
      device_name: navigator.userAgent, 
    });

    return {
      success: true,
      message: response.data?.message || "Message sent successfully",
      data: response.data,
    };
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;

    console.error("Contact form error:", error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        "An error occurred while sending your message. Please try again.",
    };
  }
}

export async function getPolicy(type: string) {
  const response = await api.get(`/policy/${type}`);
  return response.data.data;
}
export async function getFaq(type: string) {
  const response = await api.get(`/faqs`, {
    params: { type } 
  });
  return response.data.data;
}
export async function listTutorials(offset: number, limit: number) {
  const response = await api.get(`/tutorials`, {
    params: { offset, limit },
  });
  return response.data;
}

export async function getTutorialBySlug(slug: string) {
  const response = await api.get(`/tutorials/${slug}`);
  return response.data; 
}
