"use server";

import { getSmartReplySuggestions as getSmartReplySuggestionsAI } from "@/ai/flows/smart-reply-suggestions.js";

export async function getSmartReplySuggestions(chatHistory) {
  if (!chatHistory.trim()) {
    return { suggestions: [] };
  }
  try {
    const result = await getSmartReplySuggestionsAI({ chatHistory });
    return result;
  } catch (error) {
    console.error("Error getting smart reply suggestions:", error);
    // In a real app, you might want to log this to a monitoring service
    return { suggestions: [] };
  }
}
