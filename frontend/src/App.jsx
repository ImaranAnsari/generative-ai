import { useCallback, useEffect, useRef, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import ChatSidebar from './components/ChatSidebar'
import MessageList from './components/MessageList'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem('chat-token'))
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(token))
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const requestController = useRef(null)
  const conversationLoadRequest = useRef(0)
  const [isDark, setIsDark] = useState(
    () => window.localStorage.getItem('chat-theme') === 'dark',
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const refreshConversations = useCallback(async (authToken) => {
    const response = await fetch('/api/conversations', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not load chat history.')
    setConversations(result.conversations)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('chat-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    if (!token) return
    let isCurrent = true
    const restoreSession = async () => {
      let authenticated = false
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          window.localStorage.removeItem('chat-token')
          setToken(null)
          setUser(null)
          return
        }
        const result = await response.json()
        if (!isCurrent) return
        setUser(result.user)
        authenticated = true
      } catch {
        if (!isCurrent) return
        window.localStorage.removeItem('chat-token')
        setToken(null)
        setUser(null)
      } finally {
        if (isCurrent) {
          setIsCheckingSession(false)
          if (authenticated) {
            refreshConversations(token).catch((loadError) => {
              setError(loadError instanceof Error ? loadError.message : 'Could not load chat history.')
            })
          }
        }
      }
    }
    restoreSession()
    return () => {
      isCurrent = false
    }
  }, [token, refreshConversations])

  const startNewChat = () => {
    conversationLoadRequest.current += 1
    requestController.current?.abort()
    requestController.current = null
    setConversationId(null)
    setMessages([])
    setInput('')
    setAttachments([])
    setIsLoading(false)
    setError('')
    setIsSidebarOpen(false)
  }

  const signOut = () => {
    requestController.current?.abort()
    requestController.current = null
    window.localStorage.removeItem('chat-token')
    setToken(null)
    setUser(null)
    setConversations([])
    startNewChat()
  }

  const selectConversation = async (id) => {
    const requestId = ++conversationLoadRequest.current
    requestController.current?.abort()
    requestController.current = null
    setIsLoading(false)
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (requestId !== conversationLoadRequest.current) return
      if (!response.ok) throw new Error(result.error || 'Could not load this conversation.')
      setConversationId(result.conversation.id)
      setMessages(result.conversation.messages)
      setError('')
      setIsSidebarOpen(false)
    } catch (loadError) {
      if (requestId !== conversationLoadRequest.current) return
      setError(loadError instanceof Error ? loadError.message : 'Could not load this conversation.')
    }
  }

  const sendMessage = async () => {
    if (isLoading) return
    const text = input.trim()
    if (!text && attachments.length > 0) {
      setError('Please add a text prompt. File contents are not sent to the AI yet.')
      return
    }
    if (!text) return

    conversationLoadRequest.current += 1
    const sentAttachments = attachments.map(({ name, type, size }) => ({ name, type, size }))
    const controller = new AbortController()
    requestController.current = controller
    const userMessageId = crypto.randomUUID()

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: userMessageId, sender: 'user', text, attachments: sentAttachments },
    ])
    setInput('')
    setAttachments([])
    setError('')
    setIsLoading(true)

    let streamedAssistantId = null
    try {
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          ...(conversationId ? { conversationId } : {}),
        }),
        signal: controller.signal,
      })

      if (!apiResponse.ok) {
        const result = await apiResponse.json()
        throw new Error(result.error || 'The AI request failed.')
      }
      if (!apiResponse.body) throw new Error('Streaming is not supported by this browser.')

      const reader = apiResponse.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let streamError = ''

      const handleEvent = (block) => {
        const data = block
          .split('\n')
          .filter((line) => line.startsWith('data: '))
          .map((line) => line.slice(6))
          .join('\n')
        if (!data) return
        const event = JSON.parse(data)
        if (event.type === 'start') setConversationId(event.conversationId)
        if (event.type === 'reset' && streamedAssistantId) {
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === streamedAssistantId ? { ...message, text: '' } : message,
            ),
          )
        }
        if (event.type === 'delta') {
          if (!streamedAssistantId) {
            streamedAssistantId = crypto.randomUUID()
            setMessages((currentMessages) => [
              ...currentMessages,
              { id: streamedAssistantId, sender: 'assistant', text: '' },
            ])
          }
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === streamedAssistantId
                ? { ...message, text: message.text + event.text }
                : message,
            ),
          )
        }
        if (event.type === 'error') streamError = event.error
      }

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''
        blocks.forEach(handleEvent)
        if (done) break
      }
      if (buffer.trim()) handleEvent(buffer)
      if (streamError) throw new Error(streamError)
      await refreshConversations(token)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        if (streamedAssistantId) {
          setMessages((currentMessages) =>
            currentMessages.filter((message) => message.id !== streamedAssistantId),
          )
        }
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'The AI request failed. Please try again.'
        try {
          await refreshConversations(token)
          setError(message)
        } catch (historyError) {
          const historyMessage =
            historyError instanceof Error
              ? historyError.message
              : 'Could not refresh chat history.'
          setError(`${message} ${historyMessage}`)
        }
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        setIsLoading(false)
      }
    }
  }

  const handleAuthenticated = (result) => {
    window.localStorage.setItem('chat-token', result.token)
    setToken(result.token)
    setUser(result.user)
    setIsCheckingSession(true)
  }

  const activeTitle =
    conversations.find((conversation) => conversation.id === conversationId)?.title ?? 'New Chat'

  if (isCheckingSession) {
    return (
      <div className="app-theme flex min-h-dvh items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--muted-color)]">
        Loading your conversations…
      </div>
    )
  }

  if (!user || !token) return <AuthScreen onAuthenticated={handleAuthenticated} />

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
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={selectConversation}
        />

        <main className="relative flex min-w-0 flex-1 flex-col bg-[var(--main-bg)]">
          <ChatHeader
            isDark={isDark}
            onNewChat={startNewChat}
            onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
            onToggleTheme={() => setIsDark((dark) => !dark)}
            userEmail={user.email}
            onSignOut={signOut}
            title={activeTitle}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 sm:px-6">
            {messages.length === 0 ? <WelcomeScreen /> : <MessageList messages={messages} />}
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
