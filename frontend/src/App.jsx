import { useEffect, useRef, useState } from 'react'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import ChatSidebar from './components/ChatSidebar'
import MessageList from './components/MessageList'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const requestController = useRef(null)
  const [isDark, setIsDark] = useState(
    () => window.localStorage.getItem('chat-theme') === 'dark',
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem('chat-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const startNewChat = () => {
    requestController.current?.abort()
    requestController.current = null
    setMessages([])
    setInput('')
    setAttachments([])
    setIsLoading(false)
    setError('')
    setIsSidebarOpen(false)
  }

  const sendMessage = async () => {
    if (isLoading) return
    const text = input.trim()
    if (!text && attachments.length > 0) {
      setError('Please add a text prompt. File contents are not sent to the AI yet.')
      return
    }
    if (!text) return

    const timestamp = Date.now()
    const sentAttachments = attachments.map(({ name, type, size }) => ({
      name,
      type,
      size,
    }))
    const nextMessages = [
      ...messages.map(({ sender, text: messageText }) => ({
        role: sender,
        content: messageText,
      })),
      { role: 'user', content: text },
    ]
    const controller = new AbortController()
    requestController.current = controller

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: timestamp, sender: 'user', text, attachments: sentAttachments },
    ])
    setInput('')
    setAttachments([])
    setError('')
    setIsLoading(true)

    try {
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      })
      const result = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(result.error || 'The AI request failed.')
      }
      if (typeof result.reply !== 'string' || !result.reply.trim()) {
        throw new Error('The AI service returned an empty response.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { id: timestamp + 1, sender: 'assistant', text: result.reply },
      ])
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'The AI request failed. Please try again.',
        )
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        setIsLoading(false)
      }
    }
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
            isLoading={isLoading}
            error={error}
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
