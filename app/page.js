'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import FlightSearchApp from '@/components/FlightSearchApp'
import AuthForm from '@/components/AuthForm'

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#FAFAF5', fontFamily: '"SF Mono","Fira Code","Consolas",monospace' }}>
      <p className="text-[14px] tracking-[0.15em] uppercase opacity-40 animate-pulse">
        Loading...
      </p>
    </div>
  )

  if (!session) return <AuthForm />
  return <FlightSearchApp session={session} />
}