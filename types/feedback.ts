export interface FeedbackSubmission {
  message: string;
  email?: string;
  userPrefs?: {
    team?: string;
    division?: string;
    mcpServer?: string;
  };
}

export interface FeedbackResponse {
  success: boolean;
  error?: string;
}
