import { useRef, useState } from 'react'
import { ApiError, signInWithPassword } from '../api'
import { AlertIcon } from '../icons'
import { AdminChrome } from './AdminShell'
import type { PageData } from '../types'

export function AdminLoginPage({ data }: { data: PageData }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const emailRef = useRef<HTMLInputElement | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      emailRef.current?.focus()
      return
    }
    setSubmitting(true)
    try {
      await signInWithPassword(email.trim(), password)
      window.location.href = '/admin'
    } catch (reason: unknown) {
      setSubmitting(false)
      setError(reason instanceof ApiError ? reason.message : 'Sign-in failed. Check your email and password.')
      emailRef.current?.focus()
    }
  }

  return (
    <AdminChrome email={null} lang={data.lang}>
      <div className="content-wrap narrow-wrap admin-login">
        <p className="eyebrow">Admin</p>
        <h1>Sign in</h1>
        <p className="page-lede">Protected publishing workspace. Public sign-up is not available.</p>
        {error && (
          <p className="status-note status-note-error" role="alert">
            <AlertIcon /> {error}
          </p>
        )}
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">Email
            <input ref={emailRef} id="login-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label htmlFor="login-password">Password
            <input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </AdminChrome>
  )
}
