const API_BASE_URL = "http://127.0.0.1:8000";

async function fetchWrapper(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Send cookies to FastAPI
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = await response.text() || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  checkAuthStatus: () => fetchWrapper("/auth/status"),
  getUserInfo: () => fetchWrapper("/user-info"),
  
  // Emails
  fetchEmails: (emailCount: number, customEmails: string[] = [], customEvents: string[] = []) => {
    const params = new URLSearchParams();
    params.append("email_count", emailCount.toString());
    customEmails.forEach(e => params.append("custom_emails", e));
    customEvents.forEach(e => params.append("custom_events", e));
    
    return fetchWrapper(`/fetch-mails?${params.toString()}`);
  },
  
  // Summary
  summarizeText: (text: string) => 
    fetchWrapper("/summarize", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
    
  // Documents
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchWrapper("/upload-document", {
      method: "POST",
      body: formData,
    });
  },
  
  // Analytics
  getUnreadPrimary7d: () => fetchWrapper("/unread-primary-7d"),
};
