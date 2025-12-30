import api from "../axios";

export interface ErrorPayload {
  message: string;
  stack?: string;
  digest?: string;
  url: string;
  timestamp: string;
}

// Explicitly defining the return type as Promise<any>
// tells the compiler that 'await' is necessary.
export function reportError(payload: ErrorPayload): Promise<any> {
  return api.post("/report-error", payload);
}
