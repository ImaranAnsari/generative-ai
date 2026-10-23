function MessageList({ messages }) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[760px] rounded-2xl px-4 py-3 text-[15px] leading-6 ${
              message.sender === 'user'
                ? 'bg-[var(--user-message-bg)] text-[var(--user-message-color)]'
                : 'bg-[var(--assistant-message-bg)] text-[var(--body-color)]'
            }`}
          >
            {message.text && <p>{message.text}</p>}
            {message.attachments?.length > 0 && (
              <ul
                aria-label="Message attachments"
                className={`flex flex-wrap gap-2 ${
                  message.text ? 'mt-2' : ''
                }`}
              >
                {message.attachments.map((attachment) => (
                  <li
                    key={`${attachment.name}-${attachment.size}`}
                    className="flex items-center gap-2 rounded-lg border border-current/15 bg-black/5 px-2.5 py-1.5 text-xs"
                  >
                    <span aria-hidden="true">📎</span>
                    <span className="max-w-[200px] truncate">
                      {attachment.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageList
