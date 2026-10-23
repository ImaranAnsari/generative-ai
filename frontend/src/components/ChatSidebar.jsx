const chatHistory = ['New Chat']

function ChatSidebar({ isOpen, onClose, onNewChat }) {
  return (
    <aside
      aria-label="Chat history"
      className={`fixed inset-y-0 left-0 z-30 flex w-[min(18rem,85vw)] flex-col border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] p-4 transition-transform duration-200 md:static md:z-auto md:w-[290px] md:shrink-0 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <h1 className="text-[18px] font-medium tracking-[-0.02em] text-[var(--title-color)]">
          Chat History
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat history"
          className="rounded-md p-2 text-[var(--body-color)] hover:bg-[var(--hover-bg)] md:hidden"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="flex w-full items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-left text-[15px] font-medium text-[var(--body-color)] shadow-sm hover:bg-[var(--hover-bg)]"
      >
        <span className="text-[18px] leading-none">＋</span>
        <span>New Chat</span>
      </button>

      <div className="mt-4 flex flex-col gap-2">
        {chatHistory.map((chat, index) => (
          <div
            key={`${chat}-${index}`}
            className={`rounded-md px-3 py-2 text-sm text-[var(--body-color)] ${
              index === 0 ? 'bg-[var(--history-active)] font-medium' : 'bg-transparent'
            }`}
          >
            {chat}
          </div>
        ))}
      </div>
    </aside>
  )
}

export default ChatSidebar
