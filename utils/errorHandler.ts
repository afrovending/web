import toast from "react-hot-toast";

interface ValidationError {
  [field: string]: string[];
}

interface ApiErrorResponse {
  status?: string;
  message?: string;
  errors?: ValidationError;
}

export const parseApiError = (error: any): string => {
  if (!error) return "An unexpected error occurred";

  const errorData = error?.response?.data || error?.data || error;

  if (typeof errorData === "string") {
    return errorData;
  }

  if (errorData?.errors && typeof errorData.errors === "object") {
    const allErrors: string[] = [];
    
    for (const [field, messages] of Object.entries(errorData.errors)) {
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          allErrors.push(`${fieldName}: ${msg}`);
        });
      } else if (typeof messages === "string") {
        const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        allErrors.push(`${fieldName}: ${messages}`);
      }
    }

    if (allErrors.length > 0) {
      return allErrors.join("\n");
    }
  }

  if (errorData?.message) {
    return errorData.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred";
};

export const showApiError = (error: any, customMessage?: string): void => {
  const errorMessage = customMessage || parseApiError(error);
  
  const errorData = error?.response?.data || error?.data || error;
  
  if (errorData?.errors && typeof errorData.errors === "object") {
    const errorMessages: string[] = [];
    
    for (const [field, messages] of Object.entries(errorData.errors)) {
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          errorMessages.push(msg);
        });
      } else if (typeof messages === "string") {
        errorMessages.push(messages as string);
      }
    }

    if (errorMessages.length === 1) {
      toast.error(errorMessages[0]);
    } else if (errorMessages.length > 1) {
      // Join multiple errors with line breaks
      const formattedMessage = "Validation errors:\n" + errorMessages.map(msg => `• ${msg}`).join('\n');
      toast.error(formattedMessage, {
        duration: 5000,
      });
    } else {
      toast.error(errorMessage);
    }
  } else {
    toast.error(errorMessage);
  }
};

export const handleApiError = (error: any, options?: {
  customMessage?: string;
  showToast?: boolean;
  duration?: number;
}): string => {
  const { customMessage, showToast = true, duration } = options || {};
  
  const message = parseApiError(error);
  
  if (showToast) {
    const errorData = error?.response?.data || error?.data || error;
    
    if (errorData?.errors && Object.keys(errorData.errors).length > 1) {
      showApiError(error, customMessage);
    } else {
      toast.error(customMessage || message, { duration });
    }
  }
  
  return message;
};