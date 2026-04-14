'use client'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

const mono = '"SF Mono","Fira Code","Cascadia Code","Consolas","Liberation Mono",monospace'
const B = 'text-[14px]'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const emailRedirectTo = typeof window === 'undefined'
    ? undefined
    : `${window.location.origin}/`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      })
      if (error) setError(error.message)
      else setMessage('Check your email for the confirmation link')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#FAFAF5', fontFamily: mono, color: '#1a1a1a' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-[36px] font-bold tracking-tight uppercase leading-none mb-2">
          Flight Search
        </h1>
        <p className={`${B} tracking-[0.1em] uppercase opacity-30 mb-8`}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className={`${B} text-red-600 font-bold`}>{error}</p>
          )}
          {message && (
            <p className={`${B} text-green-700 font-bold`}>{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 ${B} tracking-[0.15em] uppercase font-bold rounded-2xl transition-all ${
              loading
                ? 'bg-[#888] text-[#f5f5ee] cursor-wait'
                : 'bg-[#222] text-[#f5f5ee] hover:bg-[#444]'
            }`}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
          className={`w-full mt-4 py-3 ${B} tracking-[0.1em] uppercase opacity-40 hover:opacity-100 transition-opacity text-center`}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}
