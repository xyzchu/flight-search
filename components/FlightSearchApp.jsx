'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

/* ─────── CONSTANTS ─────── */
const mono = '"SF Mono","Fira Code","Cascadia Code","Consolas","Liberation Mono",monospace'
const B = 'text-[14px]'
const pad2 = (n) => String(n).padStart(2, '0')
const COLORS = ['#1a1a1a','#e63946','#457b9d','#2a9d8f','#e9c46a','#f4a261','#264653','#6a4c93','#d62828','#588157']

/* ─────── AIRPORTS ─────── */
const AIRPORTS = [
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'AU', lat: -27.38, lon: 153.12 },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.95, lon: 151.18 },
  { code: 'MEL', name: 'Tullamarine', city: 'Melbourne', country: 'AU', lat: -37.67, lon: 144.84 },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'AU', lat: -31.94, lon: 115.97 },
  { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'AU', lat: -34.94, lon: 138.53 },
  { code: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast', country: 'AU', lat: -28.16, lon: 153.50 },
  { code: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'AU', lat: -16.89, lon: 145.76 },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK', lat: 22.31, lon: 113.91 },
  { code: 'TPE', name: 'Taoyuan Intl', city: 'Taipei', country: 'TW', lat: 25.08, lon: 121.23 },
  { code: 'NRT', name: 'Narita Intl', city: 'Tokyo', country: 'JP', lat: 35.76, lon: 140.39 },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP', lat: 35.55, lon: 139.78 },
  { code: 'KIX', name: 'Kansai Intl', city: 'Osaka', country: 'JP', lat: 34.43, lon: 135.23 },
  { code: 'CTS', name: 'New Chitose', city: 'Sapporo', country: 'JP', lat: 42.77, lon: 141.69 },
  { code: 'FUK', name: 'Fukuoka', city: 'Fukuoka', country: 'JP', lat: 33.59, lon: 130.45 },
  { code: 'OKA', name: 'Naha', city: 'Okinawa', country: 'JP', lat: 26.20, lon: 127.65 },
  { code: 'ICN', name: 'Incheon Intl', city: 'Seoul', country: 'KR', lat: 37.46, lon: 126.44 },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG', lat: 1.36, lon: 103.99 },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH', lat: 13.69, lon: 100.75 },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'MY', lat: 2.75, lon: 101.71 },
  { code: 'MNL', name: 'Ninoy Aquino Intl', city: 'Manila', country: 'PH', lat: 14.51, lon: 121.02 },
  { code: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh', country: 'VN', lat: 10.82, lon: 106.65 },
  { code: 'HAN', name: 'Noi Bai Intl', city: 'Hanoi', country: 'VN', lat: 21.22, lon: 105.81 },
  { code: 'PVG', name: 'Pudong Intl', city: 'Shanghai', country: 'CN', lat: 31.14, lon: 121.81 },
  { code: 'PEK', name: 'Capital Intl', city: 'Beijing', country: 'CN', lat: 40.08, lon: 116.58 },
  { code: 'CAN', name: 'Baiyun Intl', city: 'Guangzhou', country: 'CN', lat: 23.39, lon: 113.30 },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'IN', lat: 28.56, lon: 77.10 },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.25, lon: 55.36 },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'QA', lat: 25.26, lon: 51.61 },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', lat: 51.47, lon: -0.46 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.01, lon: 2.55 },
  { code: 'FRA', name: 'Frankfurt Intl', city: 'Frankfurt', country: 'DE', lat: 50.03, lon: 8.57 },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.31, lon: 4.77 },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'IT', lat: 41.80, lon: 12.25 },
  { code: 'IST', name: 'Istanbul Intl', city: 'Istanbul', country: 'TR', lat: 41.26, lon: 28.74 },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US', lat: 40.64, lon: -73.78 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.94, lon: -118.41 },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', lat: 37.62, lon: -122.38 },
  { code: 'AKL', name: 'Auckland Intl', city: 'Auckland', country: 'NZ', lat: -37.01, lon: 174.79 },
  { code: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'ID', lat: -8.75, lon: 115.17 },
  { code: 'REP', name: 'Siem Reap Intl', city: 'Siem Reap', country: 'KH', lat: 13.41, lon: 103.81 },
  { code: 'DAD', name: 'Da Nang Intl', city: 'Da Nang', country: 'VN', lat: 16.04, lon: 108.20 },
  { code: 'CEB', name: 'Mactan-Cebu', city: 'Cebu', country: 'PH', lat: 10.31, lon: 123.98 },
  { code: 'HKT', name: 'Phuket Intl', city: 'Phuket', country: 'TH', lat: 8.11, lon: 98.32 },
]

const airportLabel = (code) => {
  const a = AIRPORTS.find(x => x.code === code)
  return a ? `${a.city} (${a.code})` : code
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const fmtDateTime = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

const timeAgo = (d) => {
  const ms = Date.now() - new Date(d).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const timeUntil = (d) => {
  const ms = new Date(d).getTime() - Date.now()
  if (ms < 0) return 'overdue'
  const m = Math.floor(ms / 60000)
  if (m < 60) return `in ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `in ${h}h`
  return `in ${Math.floor(h / 24)}d`
}

/* ─────── URL PARSER (browser) ─────── */
function parseFlightUrl(url) {
  try {
    const u = new URL(url)
    const tfs = u.searchParams.get('tfs')
    if (!tfs) return null

    let b64 = tfs.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)

    // Extract dates
    const dates = []
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    for (let j = 0; j <= bytes.length - 10; j++) {
      let s = ''
      for (let k = 0; k < 10; k++) s += String.fromCharCode(bytes[j + k])
      if (dateRe.test(s)) { dates.push({ index: j, date: s }); j += 9 }
    }

    // Extract airports
    const known = new Set(AIRPORTS.map(a => a.code))
    const airports = []
    for (let j = 0; j <= bytes.length - 3; j++) {
      let s = ''
      for (let k = 0; k < 3; k++) s += String.fromCharCode(bytes[j + k])
      if (/^[A-Z]{3}$/.test(s) && known.has(s)) {
        const bef = j > 0 ? String.fromCharCode(bytes[j - 1]) : ' '
        const aft = j + 3 < bytes.length ? String.fromCharCode(bytes[j + 3]) : ' '
        if (!/[A-Z]/.test(bef) && !/[A-Z]/.test(aft)) {
          airports.push({ index: j, code: s }); j += 2
        }
      }
    }

    // Build legs
    const legs = []
    for (let i = 0; i < dates.length; i++) {
      const di = dates[i].index
      const ni = i + 1 < dates.length ? dates[i + 1].index : bytes.length
      const la = airports.filter(a => a.index > di && a.index < ni)
      const seen = new Set()
      const uc = []
      for (const a of la) { if (!seen.has(a.code)) { seen.add(a.code); uc.push(a.code) } }
      if (uc.length >= 2) legs.push({ from: uc[0], to: uc[1], date: dates[i].date })
    }

    return { dates: dates.map(d => d.date), legs }
  } catch { return null }
}

function computeShiftPreview(baseDates, shiftStart, shiftEnd, stepDays) {
  const previews = []
  for (let i = shiftStart; i <= shiftEnd; i++) {
    const days = i * stepDays
    const shifted = baseDates.map(d => {
      const dt = new Date(d)
      dt.setDate(dt.getDate() + days)
      return dt.toISOString().slice(0, 10)
    })
    previews.push({ shift: i, days, dates: shifted })
  }
  return previews
}

/* ─────── COMPONENT ─────── */
export default function FlightSearchApp({ session }) {
  /* State */
  const [tab, setTab] = useState('track')
  const [searches, setSearches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [confirmDlg, setConfirmDlg] = useState(null)
  const [saving, setSaving] = useState(false)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [fUrl, setFUrl] = useState('')
  const [fName, setFName] = useState('')
  const [fParsed, setFParsed] = useState(null)
  const [fShiftStart, setFShiftStart] = useState(0)
  const [fShiftEnd, setFShiftEnd] = useState(4)
  const [fStepDays, setFStepDays] = useState(7)
  const [fSchedDays, setFSchedDays] = useState(1)
  const [fStopDate, setFStopDate] = useState('')

  // Results
  const [selSearchId, setSelSearchId] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loadingSnap, setLoadingSnap] = useState(false)
  const [expandedRun, setExpandedRun] = useState(null)

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  const ask = (msg, fn) => setConfirmDlg({ msg, fn })
  const doConfirm = () => { confirmDlg?.fn(); setConfirmDlg(null) }

  /* Load tracked searches */
  const loadSearches = useCallback(async () => {
    const { data } = await supabase
      .from('tracked_searches')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setSearches(data)
    setIsLoading(false)
  }, [session.user.id])

  useEffect(() => { loadSearches() }, [loadSearches])

  /* Parse URL on change */
  useEffect(() => {
    if (!fUrl.trim()) { setFParsed(null); return }
    const p = parseFlightUrl(fUrl.trim())
    setFParsed(p)
    if (p?.legs?.length) {
      const codes = p.legs.map(l => l.from)
      codes.push(p.legs[p.legs.length - 1].to)
      setFName(codes.join('-'))
      if (p.dates.length) {
        const first = new Date(p.dates[0])
        first.setDate(first.getDate() - 7)
        setFStopDate(first.toISOString().slice(0, 10))
      }
    }
  }, [fUrl])

  /* Load snapshots for selected search */
  useEffect(() => {
    if (!selSearchId) { setSnapshots([]); return }
    const load = async () => {
      setLoadingSnap(true)
      const { data } = await supabase
        .from('price_snapshots')
        .select('*')
        .eq('tracked_search_id', selSearchId)
        .order('scraped_at', { ascending: false })
        .limit(500)
      if (data) setSnapshots(data)
      setLoadingSnap(false)
    }
    load()
  }, [selSearchId])

  /* Shift preview */
  const shiftPreview = useMemo(() => {
    if (!fParsed?.dates?.length) return []
    return computeShiftPreview(fParsed.dates, fShiftStart, fShiftEnd, fStepDays)
  }, [fParsed, fShiftStart, fShiftEnd, fStepDays])

  /* Save tracked search */
  const saveSearch = async () => {
    if (!fParsed) return notify('Paste a valid Google Flights URL')
    if (!fName.trim()) return notify('Enter a name')
    setSaving(true)
    const { data, error } = await supabase
      .from('tracked_searches')
      .insert({
        user_id: session.user.id,
        name: fName.trim(),
        base_url: fUrl.trim(),
        parsed_legs: fParsed.legs,
        base_dates: fParsed.dates,
        shift_start: fShiftStart,
        shift_end: fShiftEnd,
        shift_step_days: fStepDays,
        schedule_interval_days: fSchedDays,
        stop_date: fStopDate || null,
        is_active: true,
        next_run_at: new Date().toISOString(),
      })
      .select().single()
    setSaving(false)
    if (!error && data) {
      setSearches(prev => [data, ...prev])
      setFUrl(''); setFName(''); setFParsed(null); setShowAdd(false)
      notify('Tracking started!')
    } else {
      notify('Error: ' + (error?.message || 'Unknown'))
    }
  }

  /* Actions */
  const toggleActive = async (s) => {
    const next = !s.is_active
    const upd = { is_active: next, ...(next ? { next_run_at: new Date().toISOString() } : {}) }
    await supabase.from('tracked_searches').update(upd).eq('id', s.id)
    setSearches(prev => prev.map(x => x.id === s.id ? { ...x, ...upd } : x))
    notify(next ? 'Resumed' : 'Paused')
  }

  const runNow = async (s) => {
    await supabase.from('tracked_searches')
      .update({ next_run_at: new Date().toISOString(), is_active: true })
      .eq('id', s.id)
    setSearches(prev => prev.map(x => x.id === s.id
      ? { ...x, next_run_at: new Date().toISOString(), is_active: true } : x))
    notify('Queued — daemon will pick it up')
  }

  const deleteSearch = async (id) => {
    await supabase.from('tracked_searches').delete().eq('id', id)
    setSearches(prev => prev.filter(x => x.id !== id))
    if (selSearchId === id) { setSelSearchId(null); setSnapshots([]) }
  }

  /* Computed: runs grouped from snapshots */
  const runs = useMemo(() => {
    if (!snapshots.length) return []
    const map = {}
    for (const s of snapshots) {
      if (!map[s.run_id]) map[s.run_id] = []
      map[s.run_id].push(s)
    }
    return Object.entries(map).map(([rid, items]) => {
      const sorted = items.sort((a, b) => a.shift_index - b.shift_index)
      const prices = sorted.filter(i => i.cheapest_price).map(i => i.cheapest_price)
      return {
        runId: rid,
        items: sorted,
        time: sorted[0].scraped_at,
        cheapest: prices.length ? Math.min(...prices) : null,
      }
    }).sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [snapshots])

  /* Chart: best price per run over time */
  const trendData = useMemo(() =>
    runs.slice().reverse().filter(r => r.cheapest).map(r => ({
      date: fmtDateTime(r.time),
      best: r.cheapest,
    }))
  , [runs])

  /* Chart: per-shift lines over time */
  const shiftIndices = useMemo(() => {
    const s = new Set()
    for (const r of runs) for (const i of r.items) s.add(i.shift_index)
    return [...s].sort((a, b) => a - b)
  }, [runs])

  const shiftTrendData = useMemo(() =>
    runs.slice().reverse().map(r => {
      const pt = { date: fmtDateTime(r.time) }
      for (const i of r.items) pt[`s${i.shift_index}`] = i.cheapest_price
      return pt
    })
  , [runs])

  /* Selected search object */
  const selSearch = useMemo(() => searches.find(s => s.id === selSearchId), [searches, selSearchId])

  /* Loading */
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF5', fontFamily: mono }}>
      <p className={`${B} tracking-[0.15em] uppercase opacity-40 animate-pulse`}>Loading...</p>
    </div>
  )

  /* ── Input helper ── */
  const Input = ({ label, value, onChange, type = 'text', placeholder = '', className = '' }) => (
    <div className={className}>
      <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">{label}</label>
      <input
        type={type}
        className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
        value={value}
        onChange={e => onChange(type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )

  const Btn = ({ children, onClick, variant = 'default', disabled = false, className = '' }) => {
    const styles = {
      primary: 'bg-[#222] text-[#f5f5ee] font-bold hover:bg-[#444]',
      default: 'border-2 border-[#ccc] hover:border-[#222]',
      danger: 'opacity-35 hover:opacity-100 hover:text-red-600',
      ghost: 'opacity-40 hover:opacity-100',
    }
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${B} tracking-[0.1em] uppercase px-4 py-2.5 rounded-xl transition-all ${styles[variant]} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
      >
        {children}
      </button>
    )
  }

  const Card = ({ children, className = '' }) => (
    <div
      className={className}
      style={{ borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#fff', overflow: 'hidden' }}
    >
      {children}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF5', fontFamily: mono, color: '#1a1a1a' }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        select{-webkit-appearance:none;appearance:none;
          background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat:no-repeat;background-position:right 12px center;background-size:16px;padding-right:36px}
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-[#222] text-[#f5f5ee] shadow-lg">
          <p className={`${B} tracking-[0.08em] uppercase font-bold text-center`}>{toast}</p>
        </div>
      )}

      {/* Confirm */}
      {confirmDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="mx-4 max-w-sm w-full p-6 rounded-2xl" style={{ background: '#FAFAF5', fontFamily: mono }}>
            <p className={`${B} tracking-[0.08em] uppercase font-bold mb-2`}>Confirm</p>
            <p className={`${B} tracking-[0.04em] mb-6 opacity-60 leading-relaxed`}>{confirmDlg.msg}</p>
            <div className="flex gap-2">
              <Btn onClick={() => setConfirmDlg(null)} className="flex-1">Cancel</Btn>
              <Btn onClick={doConfirm} variant="primary" className="flex-1">Confirm</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header>
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-end justify-between gap-4">
          <h1 className="text-[44px] sm:text-[48px] font-bold tracking-tight uppercase leading-none">
            Flight Tracker
          </h1>
          <button onClick={loadSearches} className={`${B} opacity-20 hover:opacity-60 pb-1`}>↻ Refresh</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pb-4">
        <div className="flex items-center gap-2">
          {['track', 'results'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${B} tracking-[0.08em] uppercase px-5 py-2.5 rounded-full transition-all ${
                tab === t ? 'bg-[#222] text-[#f5f5ee] font-bold' : 'bg-[#f0f0ea] opacity-60 hover:opacity-100'
              }`}
            >
              {t}
              {t === 'track' && searches.length > 0 && <span className="ml-1.5 opacity-50">{searches.length}</span>}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => supabase.auth.signOut()}
            className={`${B} tracking-[0.1em] uppercase px-4 py-2.5 rounded-xl bg-[#f0f0ea] opacity-40 hover:opacity-100 transition-opacity`}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── TRACK TAB ── */}
      {tab === 'track' && (
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
          {/* Add button */}
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className={`w-full py-4 ${B} tracking-[0.15em] uppercase font-bold border-2 border-dashed rounded-2xl border-[#bbb] hover:border-[#222] active:bg-[#f0f0e5] transition-all`}
            >
              + Track New URL
            </button>
          )}

          {/* Add form */}
          {showAdd && (
            <Card>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`${B} font-bold tracking-[0.1em] uppercase opacity-30`}>New Tracked Search</span>
                  <button onClick={() => { setShowAdd(false); setFUrl(''); setFParsed(null) }}
                    className={`${B} opacity-25 hover:opacity-100`}>✕</button>
                </div>

                {/* URL */}
                <div>
                  <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">
                    Google Flights URL
                  </label>
                  <textarea
                    className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors resize-none`}
                    rows={3}
                    placeholder="Paste your Google Flights search URL here..."
                    value={fUrl}
                    onChange={e => setFUrl(e.target.value)}
                  />
                </div>

                {/* Parsed preview */}
                {fUrl && !fParsed && (
                  <p className={`${B} text-red-500 opacity-70`}>
                    Could not parse URL. Make sure it's a Google Flights search URL with a tfs= parameter.
                  </p>
                )}
                {fParsed && (
                  <div className="bg-[#f0f0ea] rounded-xl px-4 py-3">
                    <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-2">
                      ✓ Detected {fParsed.legs.length} leg{fParsed.legs.length > 1 ? 's' : ''}
                    </p>
                    {fParsed.legs.map((l, i) => (
                      <p key={i} className={`${B} opacity-60 py-0.5`}>
                        {pad2(i + 1)}. {airportLabel(l.from)} → {airportLabel(l.to)}
                        <span className="opacity-40 ml-2">{l.date}</span>
                      </p>
                    ))}
                  </div>
                )}

                {fParsed && (
                  <>
                    {/* Name */}
                    <Input label="Name" value={fName} onChange={setFName} placeholder="e.g. BNE-HKG-NRT June trip" />

                    {/* Shift settings */}
                    <div>
                      <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-2">
                        Date Shifting
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input label="From shift" type="number" value={fShiftStart} onChange={setFShiftStart} />
                        <Input label="To shift" type="number" value={fShiftEnd} onChange={setFShiftEnd} />
                        <Input label="Step (days)" type="number" value={fStepDays} onChange={setFStepDays} />
                      </div>
                      {shiftPreview.length > 0 && (
                        <div className="mt-2 bg-[#f0f0ea] rounded-xl px-4 py-3 max-h-40 overflow-y-auto">
                          <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-1">
                            Preview — {shiftPreview.length} shift{shiftPreview.length > 1 ? 's' : ''}
                          </p>
                          {shiftPreview.map(sp => (
                            <p key={sp.shift} className={`${B} opacity-50 py-0.5 tabular-nums`}>
                              +{sp.shift} ({sp.days}d): {sp.dates.map(d => fmtDate(d)).join(' · ')}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Re-check every (days)" type="number" value={fSchedDays} onChange={setFSchedDays} />
                      <Input label="Stop date" type="date" value={fStopDate} onChange={setFStopDate} />
                    </div>

                    {/* Save */}
                    <button
                      onClick={saveSearch}
                      disabled={saving}
                      className={`w-full py-4 ${B} tracking-[0.15em] uppercase font-bold rounded-2xl transition-all ${
                        saving ? 'bg-[#888] text-[#f5f5ee] cursor-wait animate-pulse' : 'bg-[#222] text-[#f5f5ee] hover:bg-[#444]'
                      }`}
                    >
                      {saving ? 'Saving...' : '✈ Save & Start Tracking'}
                    </button>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Tracked searches list */}
          {searches.length === 0 && !showAdd && (
            <div className="py-16 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>No tracked searches yet</p>
              <p className={`${B} tracking-[0.1em] uppercase opacity-15 mt-2`}>Add a Google Flights URL to start</p>
            </div>
          )}

          {searches.map(s => (
            <Card key={s.id}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${B} font-bold uppercase`}>{s.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        s.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className={`${B} opacity-40 mt-1`}>
                      {s.parsed_legs?.map(l => l.from).concat(s.parsed_legs?.[s.parsed_legs.length - 1]?.to).filter(Boolean).join(' → ')}
                    </p>
                    <p className={`${B} opacity-25 mt-0.5 tabular-nums`}>
                      {s.shift_end - s.shift_start + 1} shifts × {s.shift_step_days}d · Every {s.schedule_interval_days}d
                      {s.stop_date && ` · Stops ${s.stop_date}`}
                    </p>
                  </div>
                </div>

                <div className={`${B} opacity-30 mt-2 tabular-nums`}>
                  {s.last_run_at ? `Last: ${timeAgo(s.last_run_at)}` : 'No runs yet'}
                  {s.next_run_at && s.is_active && ` · Next: ${timeUntil(s.next_run_at)}`}
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Btn onClick={() => runNow(s)}>Run Now</Btn>
                  <Btn onClick={() => toggleActive(s)}>{s.is_active ? 'Pause' : 'Resume'}</Btn>
                  <Btn onClick={() => { setSelSearchId(s.id); setTab('results') }} variant="ghost">
                    View Results
                  </Btn>
                  <div className="flex-1" />
                  <Btn onClick={() => ask(`Delete "${s.name}" and all its data?`, () => deleteSearch(s.id))} variant="danger">
                    Delete
                  </Btn>
                </div>
              </div>
            </Card>
          ))}

          <div className="pt-4">
            <p className="text-[11px] tracking-[0.12em] uppercase opacity-20 text-center leading-relaxed">
              The scraper daemon must be running on your computer to execute searches.
              <br />Run: node scripts/scraper-daemon.js
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      {tab === 'results' && (
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
          {/* Search selector */}
          <div>
            <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">
              Select Tracked Search
            </label>
            <select
              className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none uppercase tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
              value={selSearchId || ''}
              onChange={e => setSelSearchId(e.target.value || null)}
            >
              <option value="">— Choose —</option>
              {searches.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {!selSearchId && (
            <div className="py-16 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>Select a tracked search to view results</p>
            </div>
          )}

          {selSearchId && loadingSnap && (
            <p className={`${B} tracking-[0.15em] uppercase opacity-40 animate-pulse text-center py-8`}>Loading...</p>
          )}

          {selSearchId && !loadingSnap && runs.length === 0 && (
            <div className="py-16 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>No results yet</p>
              <p className={`${B} tracking-[0.1em] uppercase opacity-15 mt-2`}>
                Waiting for daemon to run first scrape
              </p>
            </div>
          )}

          {selSearchId && !loadingSnap && runs.length > 0 && (
            <>
              {/* Latest run summary */}
              <Card>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`${B} font-bold tracking-[0.1em] uppercase opacity-30`}>
                      Latest Run
                    </span>
                    <span className={`${B} opacity-30 tabular-nums`}>{fmtDateTime(runs[0].time)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {runs[0].items.map(item => {
                      const isBest = item.cheapest_price === runs[0].cheapest && item.cheapest_price
                      return (
                        <div key={item.id} className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                          isBest ? 'bg-emerald-50' : 'bg-[#f8f8f4]'
                        }`}>
                          <div className="min-w-0 flex-1">
                            <span className={`${B} font-bold tabular-nums`}>{item.shift_label}</span>
                            <span className={`${B} opacity-40 ml-2 tabular-nums`}>
                              {item.shifted_dates?.map(d => fmtDate(d)).join(' · ')}
                            </span>
                          </div>
                          <span className={`text-[18px] font-bold tabular-nums ml-3 ${
                            isBest ? 'text-emerald-700' : ''
                          }`}>
                            {item.cheapest_price ? `A$${item.cheapest_price.toLocaleString()}` : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {runs[0].cheapest && (
                    <div className="mt-3 pt-3 border-t border-[#f0f0ea] flex items-center justify-between">
                      <span className={`${B} tracking-[0.1em] uppercase opacity-40`}>Best Price</span>
                      <span className="text-[28px] font-bold tabular-nums text-emerald-700">
                        A${runs[0].cheapest.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Price trend chart */}
              {shiftTrendData.length >= 2 && (
                <Card>
                  <div className="px-5 py-4">
                    <p className={`${B} tracking-[0.12em] uppercase font-bold opacity-40 mb-4`}>
                      Price Trends by Shift
                    </p>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={shiftTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fontFamily: mono, fill: '#999' }}
                          stroke="#ddd"
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fontFamily: mono, fill: '#999' }}
                          stroke="#ddd"
                          tickLine={false}
                          tickFormatter={v => `$${v}`}
                        />
                        <RTooltip
                          contentStyle={{
                            fontFamily: mono, fontSize: 12, borderRadius: 12,
                            border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', background: '#fff',
                          }}
                          formatter={(v, name) => [`A$${v?.toLocaleString() || '—'}`, name]}
                        />
                        <Legend
                          wrapperStyle={{ fontFamily: mono, fontSize: 11 }}
                        />
                        {shiftIndices.map((si, idx) => {
                          const search = selSearch
                          const stepDays = search?.shift_step_days || 7
                          return (
                            <Line
                              key={si}
                              type="monotone"
                              dataKey={`s${si}`}
                              name={`+${si * stepDays}d`}
                              stroke={COLORS[idx % COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                              connectNulls
                            />
                          )
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Overall best trend */}
              {trendData.length >= 2 && (
                <Card>
                  <div className="px-5 py-4">
                    <p className={`${B} tracking-[0.12em] uppercase font-bold opacity-40 mb-4`}>
                      Best Price Over Time
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fontFamily: mono, fill: '#999' }}
                          stroke="#ddd" tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fontFamily: mono, fill: '#999' }}
                          stroke="#ddd" tickLine={false}
                          tickFormatter={v => `$${v}`}
                        />
                        <RTooltip
                          contentStyle={{
                            fontFamily: mono, fontSize: 12, borderRadius: 12,
                            border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', background: '#fff',
                          }}
                          formatter={v => [`A$${v?.toLocaleString()}`, 'Best Price']}
                        />
                        <Line
                          type="monotone" dataKey="best" stroke="#2a9d8f" strokeWidth={2.5}
                          dot={{ fill: '#2a9d8f', r: 4 }} activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Run history */}
              <div>
                <p className={`${B} tracking-[0.12em] uppercase font-bold opacity-40 mb-3`}>
                  All Runs ({runs.length})
                </p>
                <div className="space-y-2">
                  {runs.map(r => {
                    const isExp = expandedRun === r.runId
                    return (
                      <Card key={r.runId}>
                        <button
                          className="w-full text-left px-5 py-3 hover:bg-[#fafaf6] transition-colors"
                          onClick={() => setExpandedRun(isExp ? null : r.runId)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`${B} tabular-nums`}>{fmtDateTime(r.time)}</span>
                              <span className={`${B} opacity-25 ml-2`}>{r.items.length} shifts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`${B} font-bold tabular-nums`}>
                                {r.cheapest ? `A$${r.cheapest.toLocaleString()}` : '—'}
                              </span>
                              <span className={`${B} opacity-20`}>{isExp ? '▲' : '▼'}</span>
                            </div>
                          </div>
                        </button>
                        {isExp && (
                          <div className="px-5 pb-4 space-y-1.5 border-t border-[#f0f0ea] pt-3">
                            {r.items.map(item => (
                              <div key={item.id} className="bg-[#f8f8f4] rounded-xl px-4 py-2.5">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <div>
                                    <span className={`${B} font-bold tabular-nums`}>{item.shift_label}</span>
                                    <span className={`${B} opacity-30 ml-2`}>
                                      {item.result_count} result{item.result_count !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <span className={`${B} font-bold tabular-nums`}>
                                    {item.cheapest_price ? `A$${item.cheapest_price.toLocaleString()}` : '—'}
                                  </span>
                                </div>
                                <p className={`${B} opacity-25 mt-0.5 tabular-nums`}>
                                  {item.shifted_dates?.join(' · ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-[11px] tracking-[0.15em] uppercase opacity-20" style={{ fontFamily: mono }}>
          Flight Price Tracker · Daemon scrapes · UI displays
        </p>
      </footer>
    </div>
  )
}