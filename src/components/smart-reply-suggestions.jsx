"use client";

import * as React from "react";
import { getSmartReplySuggestions } from "@/app/actions.js";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Sparkles } from "lucide-react";

export default function SmartReplySuggestions({
  chatHistory,
  onSuggestionClick,
}) {
  const [suggestions, setSuggestions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const lastMessage = chatHistory.split("\n").pop();

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!chatHistory) return;
      setLoading(true);
      try {
        const result = await getSmartReplySuggestions(chatHistory);
        setSuggestions(result.suggestions || []);
      } catch (error) {
        console.error("Failed to fetch smart replies:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
        fetchSuggestions();
    }, 500); // Debounce to avoid excessive calls

    return () => clearTimeout(timer);
  }, [lastMessage]); // Rerun only when the last message changes

  if (loading) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
       <Sparkles className="w-4 h-4 text-muted-foreground" />
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
