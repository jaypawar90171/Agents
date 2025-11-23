import { useState, useCallback } from "react";

export const useChatStream = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkpointId, setCheckpointId] = useState(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const sendMessage = useCallback(
    async (userMessage) => {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);
      setIsSearching(false);
      setCurrentSearchQuery("");

      let aiMessage = "";
      let sources = [];

      try {
        const url = checkpointId
          ? `http://localhost:8000/chat_stream/${encodeURIComponent(
              userMessage
            )}?checkpoint_id=${checkpointId}`
          : `http://localhost:8000/chat_stream/${encodeURIComponent(
              userMessage
            )}`;

        const response = await fetch(url);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "checkpoint_id") {
                  setCheckpointId(parsed.data);
                } else if (parsed.type === "chat_chunk") {
                  aiMessage += parsed.data;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (
                      newMessages[newMessages.length - 1]?.role === "assistant"
                    ) {
                      newMessages[newMessages.length - 1].content = aiMessage;
                    } else {
                      newMessages.push({
                        role: "assistant",
                        content: aiMessage,
                      });
                    }
                    return newMessages;
                  });
                } else if (parsed.type === "search_start") {
                  setIsSearching(true);
                  setCurrentSearchQuery(parsed.data);
                } else if (parsed.type === "search_results") {
                  sources = parsed.data;
                  setIsSearching(false);
                } else if (parsed.type === "end") {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (
                      newMessages[newMessages.length - 1]?.role === "assistant"
                    ) {
                      newMessages[newMessages.length - 1].sources = sources;
                      newMessages[newMessages.length - 1].isSearching = false;
                    }
                    return newMessages;
                  });
                }
              } catch (err) {
                console.error("Parse error:", err);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [checkpointId]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setCheckpointId(null);
    setCurrentSearchQuery("");
    setIsSearching(false);
  }, []);

  return {
    messages,
    isLoading,
    isSearching,
    currentSearchQuery,
    sendMessage,
    resetChat,
  };
};
