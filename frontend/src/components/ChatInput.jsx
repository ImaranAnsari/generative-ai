function ChatInput({
  value,
  onChange,
  onSend,
  webSearch,
  onToggleWebSearch,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  isLoading,
  error,
}) {
  const handleFileChange = (event) => {
    onAddAttachments(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSend()
    }
  }

  return (
    <div className="shrink-0 border-t border-[var(--border-color)] bg-[var(--composer-bg)] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1120px] rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-2 py-2 shadow-sm sm:px-3 sm:py-3">
        {error && (
          <p role="alert" className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {attachments.length > 0 && (
          <ul aria-label="Selected attachments" className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex max-w-full items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)] px-2.5 py-1.5 text-xs text-[var(--body-color)]"
              >
                <span aria-hidden="true">📎</span>
                <span className="max-w-[180px] truncate sm:max-w-[260px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemoveAttachment(index)}
                  className="rounded px-1 text-sm text-[var(--muted-color)] hover:text-[var(--body-color)]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.json,.zip,image/*,audio/*,video/*"
            onChange={handleFileChange}
            className="sr-only"
            id="chat-file-upload"
            aria-label="Upload documents or media"
          />
          <label
            htmlFor="chat-file-upload"
            title="Upload documents or media"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--muted-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--body-color)]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
              strokeWidth="1.8"
            >
              <path d="m12.8 6.5-6.6 6.6a3.6 3.6 0 0 0 5.1 5.1l7.1-7.1a5 5 0 0 0-7.1-7.1l-7.1 7.1" />
            </svg>
          </label>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Send a message..."
            className="h-11 min-w-0 flex-1 border-none bg-transparent px-2 text-[15px] text-[var(--body-color)] placeholder:text-[var(--muted-color)] focus:outline-none sm:h-12"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={isLoading}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#7ad4ba] text-lg text-[#1b1b1b] shadow-sm hover:bg-[#6ac8ac] focus:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden="true">{isLoading ? '…' : '➤'}</span>
          </button>
        </div>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 px-2 text-sm text-[var(--muted-color)]">
          <input
            type="checkbox"
            checked={webSearch}
            onChange={onToggleWebSearch}
            disabled={isLoading}
            className="accent-[#369b7d]"
          />
          Search the web
        </label>
      </div>
    </div>
  )
}

export default ChatInput
