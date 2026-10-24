function ChatHeader({
  isDark,
  onNewChat,
  onToggleSidebar,
  onToggleTheme,
  userEmail,
  onSignOut,
  title,
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--header-bg)] px-3 sm:h-[72px] sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open chat history"
          className="rounded-md p-2 text-[var(--body-color)] hover:bg-[var(--hover-bg)] md:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="truncate text-sm font-medium text-[var(--title-color)] sm:text-base">
          {title}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          className="rounded-md border border-[var(--border-color)] bg-[var(--panel-bg)] p-2 text-[var(--body-color)] shadow-sm hover:bg-[var(--hover-bg)]"
        >
          {isDark ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
              <path d="M20.4 15.4A8.5 8.5 0 0 1 8.6 3.6 8.5 8.5 0 1 0 20.4 15.4Z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--panel-bg)] px-3 py-2 text-[14px] text-[var(--body-color)] shadow-sm hover:bg-[var(--hover-bg)]"
        >
          <span className="text-[15px]">＋</span>
          <span className="hidden sm:inline">New Chat</span>
        </button>
        <span className="hidden max-w-40 truncate text-xs text-[var(--muted-color)] lg:inline">
          {userEmail}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md border border-[var(--border-color)] bg-[var(--panel-bg)] px-3 py-2 text-sm text-[var(--body-color)] hover:bg-[var(--hover-bg)]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export default ChatHeader
