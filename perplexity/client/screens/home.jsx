import React, { useState, useEffect, useRef } from 'react';

// --- Icon Components ---
// Using inline SVGs to keep everything in one file. Styles will be applied via CSS classes.

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon-base icon-w-6 icon-h-6"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v-2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon-base icon-w-6 icon-h-6"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon-base icon-w-5 icon-h-5"
  >
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon-base icon-w-4 icon-h-4 icon-mr-2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const NewChatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon-base icon-w-4 icon-h-4 icon-mr-2"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

// --- Main App Component ---
function Home() {
  // --- State ---
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [checkpointId, setCheckpointId] = useState(null);
  
  // State for the in-progress streaming message
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [currentSearchResults, setCurrentSearchResults] = useState([]);
  
  // Loading and system message state
  const [isLoading, setIsLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');

  const chatEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // --- API URL ---
  const API_BASE_URL = 'http://localhost:8000';

  // --- Effects ---

  // Effect to scroll to the bottom of the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAiMessage, systemMessage]);

  // Effect for component cleanup
  useEffect(() => {
    // This function will be called when the component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log('EventSource closed on component unmount');
      }
    };
  }, []);

  // --- Event Handlers ---

  /**
   * Handles the submission of the chat form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Add user message to state
    setMessages((prev) => [...prev, { sender: 'user', content: inputMessage }]);
    setIsLoading(true);
    setSystemMessage('');
    const messageToSend = inputMessage;
    setInputMessage('');

    // --- EventSource Logic ---
    try {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Construct the URL
      let url = `${API_BASE_URL}/chat_stream/${encodeURIComponent(messageToSend)}`;
      if (checkpointId) {
        url += `?checkpoint_id=${checkpointId}`;
      }

      // Create a new EventSource
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      let aiMessageBuffer = '';
      let searchResultsBuffer = [];

      eventSource.onopen = () => {
        console.log('EventSource connected');
      };

      eventSource.onmessage = (event) => {
        // The backend sends data as 'data: {...}\n\n'
        // We need to parse the JSON content
        const eventData = JSON.parse(event.data);

        switch (eventData.type) {
          case 'checkpoint_id':
            console.log('Received checkpoint ID:', eventData.data);
            setCheckpointId(eventData.data);
            break;

          case 'search_start':
            console.log('Search started:', eventData.data);
            setSystemMessage(`Searching for: "${eventData.data}"...`);
            break;

          case 'chat_chunk':
            // Clear system message once text starts streaming
            if (systemMessage) setSystemMessage('');
            
            // Unescape newline and single quote characters
            const unescapedChunk = eventData.data
              .replace(/\\n/g, '\n')
              .replace(/\\'/g, "'");

            aiMessageBuffer += unescapedChunk;
            setCurrentAiMessage(aiMessageBuffer);
            break;

          case 'search_results':
            console.log('Search results received:', eventData.data);
            searchResultsBuffer = eventData.data;
            setCurrentSearchResults(searchResultsBuffer);
            break;

          case 'end':
            console.log('Stream ended');
            eventSource.close();
            eventSourceRef.current = null;
            
            // Add the fully formed AI message to the chat history
            setMessages((prev) => [
              ...prev,
              {
                sender: 'ai',
                content: aiMessageBuffer,
                searchResults: searchResultsBuffer,
              },
            ]);
            
            // Reset temporary and loading states
            setCurrentAiMessage('');
            setCurrentSearchResults([]);
            setSystemMessage('');
            setIsLoading(false);
            break;
            
          default:
            console.warn('Unknown event type:', eventData.type);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource failed:', err);
        setSystemMessage('Error: Could not connect to the server. Please check your connection and try again.');
        setIsLoading(false);
        setCurrentAiMessage('');
        setCurrentSearchResults([]);
        eventSource.close();
        eventSourceRef.current = null;
      };

    } catch (error) {
      console.error('Failed to start chat stream:', error);
      setSystemMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Resets the chat state for a new conversation
   */
  const handleNewChat = () => {
    // Close any active stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Reset all state
    setMessages([]);
    setCheckpointId(null);
    setInputMessage('');
    setCurrentAiMessage('');
    setCurrentSearchResults([]);
    setIsLoading(false);
    setSystemMessage('');
  };

  /**
   * Renders a single chat message
   */
  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user';

    return (
      <div
        key={index}
        className={`message-wrapper ${isUser ? 'message-wrapper-user' : 'message-wrapper-ai'}`}
      >
        <div className={`message-container ${isUser ? 'message-container-user' : 'message-container-ai'}`}>
          <div className={`message-icon ${isUser ? 'message-icon-user' : 'message-icon-ai'}`}>
            {isUser ? <UserIcon /> : <BotIcon />}
          </div>
          <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-ai'}`}>
            {/* Using whitespace-pre-wrap to respect newlines from the AI */}
            <p className="message-text">{msg.content}</p>
            {msg.searchResults && msg.searchResults.length > 0 && (
              <div className="search-section">
                <h4 className="search-title">
                  <SearchIcon />
                  Search Results:
                </h4>
                <ul className="search-list">
                  {msg.searchResults.map((url, i) => (
                    <li key={i} className="search-item">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="search-link"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  /**
   * Renders the streaming AI message
   */
  const renderStreamingMessage = () => {
    if (!currentAiMessage && !systemMessage) return null;

    return (
      <div className="message-wrapper message-wrapper-ai">
        <div className="message-container message-container-ai">
          <div className="message-icon message-icon-ai">
            <BotIcon />
          </div>
          <div className="message-bubble message-bubble-ai">
            {systemMessage && (
              <p className="system-message">
                <SearchIcon /> {systemMessage}
              </p>
            )}
            {currentAiMessage && (
               <p className="message-text">{currentAiMessage}</p>
            )}
            {currentSearchResults && currentSearchResults.length > 0 && (
              <div className="search-section">
                <h4 className="search-title">
                  <SearchIcon />
                  Search Results:
                </h4>
                <ul className="search-list">
                  {currentSearchResults.map((url, i) => (
                    <li key={i} className="search-item">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="search-link-stream"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- JSX ---
  return (
    <>
      <style>{`
        /* Base Styles */
        :root {
          --bg-primary: #f3f4f6; /* gray-100 */
          --bg-secondary: #ffffff; /* white */
          --bg-tertiary: #374151; /* gray-700 */
          --text-primary: #111827; /* gray-900 */
          --text-secondary: #6b7280; /* gray-500 */
          --text-white: #ffffff;
          --blue-500: #3b82f6;
          --blue-600: #2563eb;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-600: #4b5563;
          --gray-800: #1f2937;
          --gray-900: #111827;
          --border-gray-200: #e5e7eb;
          --border-gray-600: #4b5563;
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
          --rounded-lg: 0.5rem;
          --rounded-full: 9999px;
          --transition-colors: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out;
          --font-inter: 'Inter', sans-serif;
        }

        [data-theme="dark"] {
          --bg-primary: #111827; /* gray-900 */
          --bg-secondary: #1f2937; /* gray-800 */
          --bg-tertiary: #374151; /* gray-700 */
          --text-primary: #f9fafb; /* white */
          --text-secondary: #9ca3af; /* gray-400 */
          --text-white: #f9fafb;
          --border-gray-200: #4b5563; /* gray-600 */
          --gray-200: #374151;
          --gray-300: #4b5563;
          --gray-400: #6b7280;
          --gray-600: #9ca3af;
          --gray-800: #111827;
          --gray-900: #111827;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: var(--font-inter);
        }

        /* Icon Styles */
        .icon-base {
          display: inline-block;
          flex-shrink: 0;
        }

        .icon-w-6 { width: 1.5rem; }
        .icon-h-6 { height: 1.5rem; }
        .icon-w-5 { width: 1.25rem; }
        .icon-h-5 { height: 1.25rem; }
        .icon-w-4 { width: 1rem; }
        .icon-h-4 { height: 1rem; }
        .icon-mr-2 { margin-right: 0.5rem; }

        /* Layout */
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        /* Header */
        .header {
          background-color: var(--bg-secondary);
          box-shadow: var(--shadow-md);
          width: 100%;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
          position: sticky;
          top: 0;
        }

        .header h1 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0;
          color: var(--text-primary);
        }

        .new-chat-btn {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: var(--gray-200);
          color: var(--text-primary);
          border-radius: var(--rounded-lg);
          border: none;
          cursor: pointer;
          transition: var(--transition-colors);
        }

        .new-chat-btn:hover {
          background-color: var(--gray-300);
        }

        [data-theme="dark"] .new-chat-btn {
          background-color: var(--bg-tertiary);
          color: var(--text-white);
        }

        [data-theme="dark"] .new-chat-btn:hover {
          background-color: var(--gray-600);
        }

        /* Main Chat Area */
        .chat-main {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .chat-content {
          max-width: 48rem;
          margin: 0 auto;
        }

        /* Message Wrappers */
        .message-wrapper {
          margin-bottom: 1rem;
        }

        .message-wrapper-user {
          display: flex;
          justify-content: flex-end;
        }

        .message-wrapper-ai {
          display: flex;
          justify-content: flex-start;
        }

        .message-container {
          display: flex;
          align-items: flex-start;
          max-width: 32rem;
        }

        .message-container-user {
          flex-direction: row-reverse;
        }

        .message-container-ai {
          flex-direction: row;
        }

        .message-icon {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          border-radius: var(--rounded-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-white);
        }

        .message-icon-user {
          background-color: var(--blue-500);
          margin-left: 0.75rem;
        }

        .message-icon-ai {
          background-color: var(--bg-tertiary);
          margin-right: 0.75rem;
        }

        .message-bubble {
          position: relative;
          padding: 1rem;
          border-radius: var(--rounded-lg);
          box-shadow: var(--shadow-md);
          word-wrap: break-word;
        }

        .message-bubble-user {
          background-color: var(--blue-500);
          color: var(--text-white);
          border-bottom-right-radius: 0;
        }

        .message-bubble-ai {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border-bottom-left-radius: 0;
        }

        [data-theme="dark"] .message-bubble-ai {
          background-color: var(--gray-800);
          color: var(--text-white);
        }

        .message-text {
          margin: 0;
          white-space: pre-wrap;
        }

        /* Search Section */
        .search-section {
          margin-top: 1rem;
          border-top: 1px solid var(--border-gray-200);
          padding-top: 0.75rem;
        }

        [data-theme="dark"] .search-section {
          border-top-color: var(--border-gray-600);
        }

        .search-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .search-list {
          list-style-type: disc;
          list-style-position: inside;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .search-item {
          margin: 0;
        }

        .search-link {
          font-size: 0.875rem;
          color: #93c5fd; /* blue-300 */
          text-decoration: underline;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .search-link:hover {
          color: #60a5fa; /* blue-100 */
        }

        .search-link-stream {
          font-size: 0.875rem;
          color: #60a5fa; /* blue-400 */
          text-decoration: underline;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .search-link-stream:hover {
          color: #3b82f6; /* blue-200 */
        }

        .system-message {
          color: var(--text-secondary);
          font-style: italic;
          display: flex;
          align-items: center;
          margin: 0;
        }

        [data-theme="dark"] .system-message {
          color: var(--gray-400);
        }

        /* Footer */
        .chat-footer {
          background-color: var(--bg-secondary);
          box-shadow: var(--shadow-inner);
          width: 100%;
          padding: 1rem;
          z-index: 10;
          position: sticky;
          bottom: 0;
        }

        .footer-content {
          max-width: 48rem;
          margin: 0 auto;
        }

        .input-form {
          display: flex;
          align-items: center;
          background-color: var(--gray-100);
          border-radius: var(--rounded-lg);
          padding: 0.5rem;
        }

        [data-theme="dark"] .input-form {
          background-color: var(--bg-tertiary);
        }

        .input-field {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1rem;
          padding: 0.5rem;
        }

        .input-field::placeholder {
          color: var(--text-secondary);
        }

        [data-theme="dark"] .input-field {
          color: var(--text-white);
        }

        [data-theme="dark"] .input-field::placeholder {
          color: var(--gray-400);
        }

        .input-field:focus {
          outline: none;
          ring: none;
        }

        .send-btn {
          margin-left: 0.5rem;
          padding: 0.5rem;
          background-color: var(--blue-500);
          color: var(--text-white);
          border-radius: var(--rounded-lg);
          border: none;
          cursor: pointer;
          transition: var(--transition-colors);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          background-color: var(--blue-600);
        }

        .send-btn:disabled {
          background-color: var(--gray-400);
          cursor: not-allowed;
        }

        [data-theme="dark"] .send-btn:disabled {
          background-color: var(--gray-500);
        }

        .footer-note {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          margin: 0;
        }

        [data-theme="dark"] .footer-note {
          color: var(--gray-400);
        }
      `}</style>
      <div className="chat-container" data-theme="light"> {/* Change to "dark" for dark mode */}
        {/* Header */}
        <header className="header">
          <h1>Virtual Assistant</h1>
          <button
            onClick={handleNewChat}
            className="new-chat-btn"
          >
            <NewChatIcon />
            New Chat
          </button>
        </header>

        {/* Chat Area */}
        <main className="chat-main">
          <div className="chat-content">
            {messages.map(renderMessage)}
            {(isLoading || systemMessage) && renderStreamingMessage()}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Input Form */}
        <footer className="chat-footer">
          <div className="footer-content">
            <form
              onSubmit={handleSubmit}
              className="input-form"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isLoading ? 'Waiting for response...' : 'Type your message...'
                }
                className="input-field"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="send-btn"
              >
                <SendIcon />
              </button>
            </form>
            
          </div>
        </footer>
      </div>
    </>
  );
}

export default Home;