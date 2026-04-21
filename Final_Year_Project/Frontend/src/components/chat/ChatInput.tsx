import React, { useCallback, useRef, useEffect } from 'react';
import { Paperclip, Mic, Image, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask a scholarly question or provide context...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled || !value.trim()) return;
      onSend();
    },
    [disabled, value, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) onSend();
      }
    },
    [value, onSend]
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div className="max-w-4xl mx-auto relative w-full">
      <div className="bg-surface-container-lowest rounded-2xl shadow-lg shadow-neutral-200/50 border border-outline-variant/20 p-2 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-transparent border-none focus:ring-0 font-body text-sm min-h-[60px] p-4 resize-none text-on-surface placeholder-outline"
            aria-label="Message"
          />
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex gap-2 text-outline">
              <button type="button" className="p-2 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <Image className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="bg-primary text-white w-10 h-10 flex items-center justify-center rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
