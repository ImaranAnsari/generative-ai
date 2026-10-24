import { useState } from 'react'

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to authenticate.')
      onAuthenticated(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-theme min-h-dvh">
      <main className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 py-10">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-7 shadow-sm"
        >
        <p className="text-sm font-medium uppercase tracking-widest text-[#438a73]">Generative AI</p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--title-color)]">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-color)]">
          Sign in to keep your conversations saved and available across sessions.
        </p>

        <label className="mt-6 block text-sm font-medium text-[var(--body-color)]" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--main-bg)] px-3 text-[var(--body-color)] outline-none focus:border-[#438a73]"
        />

        <label className="mt-4 block text-sm font-medium text-[var(--body-color)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--main-bg)] px-3 text-[var(--body-color)] outline-none focus:border-[#438a73]"
        />

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 h-11 w-full rounded-lg bg-[#7ad4ba] font-medium text-[#1b1b1b] hover:bg-[#6ac8ac] disabled:opacity-60"
        >
          {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <p className="mt-5 text-center text-sm text-[var(--muted-color)]">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="font-medium text-[#34745f] hover:underline"
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
        </form>
      </main>
    </div>
  )
}

export default AuthScreen
