import { useEffect, useState } from 'react'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import ChatSidebar from './components/ChatSidebar'
import MessageList from './components/MessageList'
import WelcomeScreen from './components/WelcomeScreen'
import { dummyResponses } from './data/dummyResponses'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isDark, setIsDark] = useState(
    () => window.localStorage.getItem('chat-theme') === 'dark',
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem('chat-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const startNewChat = () => {
    setMessages([])
    setInput('')
    setAttachments([])
    setIsSidebarOpen(false)
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text && attachments.length === 0) return

    const timestamp = Date.now()
    const response =
      dummyResponses[Math.floor(Math.random() * dummyResponses.length)]
    const sentAttachments = attachments.map(({ name, type, size }) => ({
      name,
      type,
      size,
    }))

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: timestamp, sender: 'user', text, attachments: sentAttachments },
      { id: timestamp + 1, sender: 'assistant', text: response },
    ])
    setInput('')
    setAttachments([])
  }

  return (
    <div
      className={`app-theme h-dvh min-h-[100svh] overflow-hidden bg-[var(--app-bg)] text-[var(--body-color)] transition-colors ${
        isDark ? 'dark' : ''
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1400px] border-x border-[var(--border-color)] bg-[var(--shell-bg)]">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close chat history"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/35 md:hidden"
          />
        )}

        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={startNewChat}
        />

        <main className="relative flex min-w-0 flex-1 flex-col bg-[var(--main-bg)]">
          <ChatHeader
            isDark={isDark}
            onNewChat={startNewChat}
            onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
            onToggleTheme={() => setIsDark((dark) => !dark)}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 sm:px-6">
            {messages.length === 0 ? (
              <WelcomeScreen />
            ) : (
              <MessageList messages={messages} />
            )}
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            attachments={attachments}
            onAddAttachments={(files) =>
              setAttachments((currentFiles) => [...currentFiles, ...files])
            }
            onRemoveAttachment={(index) =>
              setAttachments((currentFiles) =>
                currentFiles.filter((_, fileIndex) => fileIndex !== index),
              )
            }
          />
        </main>
      </div>
    </div>
  )
}

export default App
