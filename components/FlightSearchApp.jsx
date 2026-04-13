// supabase account rsychu@gmail.com
'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { APP_DEPLOYED_AT } from '@/lib/build-info'

/* ─────── CONSTANTS ─────── */
const mono = '"SF Mono","Fira Code","Cascadia Code","Consolas","Liberation Mono",monospace'
const B = 'text-[14px]'
const pad2 = (n) => String(n).padStart(2, '0')

/* ─────── AIRPORTS ─────── */
const AIRPORTS = [
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'AU' },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU' },
  { code: 'MEL', name: 'Tullamarine', city: 'Melbourne', country: 'AU' },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'AU' },
  { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'AU' },
  { code: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast', country: 'AU' },
  { code: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'AU' },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK' },
  { code: 'TPE', name: 'Taoyuan Intl', city: 'Taipei', country: 'TW' },
  { code: 'NRT', name: 'Narita Intl', city: 'Tokyo', country: 'JP' },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP' },
  { code: 'KIX', name: 'Kansai Intl', city: 'Osaka', country: 'JP' },
  { code: 'CTS', name: 'New Chitose', city: 'Sapporo', country: 'JP' },
  { code: 'FUK', name: 'Fukuoka', city: 'Fukuoka', country: 'JP' },
  { code: 'OKA', name: 'Naha', city: 'Okinawa', country: 'JP' },
  { code: 'ICN', name: 'Incheon Intl', city: 'Seoul', country: 'KR' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH' },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'MY' },
  { code: 'MNL', name: 'Ninoy Aquino Intl', city: 'Manila', country: 'PH' },
  { code: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh', country: 'VN' },
  { code: 'HAN', name: 'Noi Bai Intl', city: 'Hanoi', country: 'VN' },
  { code: 'PVG', name: 'Pudong Intl', city: 'Shanghai', country: 'CN' },
  { code: 'PEK', name: 'Capital Intl', city: 'Beijing', country: 'CN' },
  { code: 'CAN', name: 'Baiyun Intl', city: 'Guangzhou', country: 'CN' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'IN' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE' },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'QA' },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR' },
  { code: 'FRA', name: 'Frankfurt Intl', city: 'Frankfurt', country: 'DE' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL' },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'IT' },
  { code: 'IST', name: 'Istanbul Intl', city: 'Istanbul', country: 'TR' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US' },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US' },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US' },
  { code: 'AKL', name: 'Auckland Intl', city: 'Auckland', country: 'NZ' },
  { code: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'ID' },
  { code: 'REP', name: 'Siem Reap Intl', city: 'Siem Reap', country: 'KH' },
  { code: 'DAD', name: 'Da Nang Intl', city: 'Da Nang', country: 'VN' },
  { code: 'CEB', name: 'Mactan-Cebu', city: 'Cebu', country: 'PH' },
  { code: 'HKT', name: 'Phuket Intl', city: 'Phuket', country: 'TH' },
]

const airportLabel = (code) => {
  const a = AIRPORTS.find(x => x.code === code)
  return a ? `${a.city} (${a.code})` : code
}
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtDateTime = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDeployStamp = (d) =>
  new Date(d).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
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

const normalizePositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/* ─────── FLIGHT SNIPPET PARSER ─────── */
// Format: "12:05 AM12:05 AM on Wed, Apr 29 – 6:50 AM6:50 AM on Wed, Apr 29Cathay Pacific8 hr 45 min...Nonstop...A$1,108..."
// or with stop: "7:10 PM...– 6:55 AM+1...Thu, Apr 30Qantas, Cathay Pacific13 hr 45 min...1 stop...A$1,191..."
function parseFlightSnippet(text) {
  if (!text || typeof text !== 'string') return null

  // Departure time: very first HH:MM AM/PM in the string
  const depM = text.match(/^(\d{1,2}:\d{2}\s*[AP]M)/i)
  const depTime = depM ? depM[1] : null

  // Arrival time + next-day flag: first HH:MM AM/PM immediately after " – "
  let arrTime = null
  const dashIdx = text.indexOf(' – ')
  if (dashIdx !== -1) {
    const arrM = text.slice(dashIdx + 3).match(/^(\d{1,2}:\d{2}\s*[AP]M)(\+\d)?/i)
    if (arrM) arrTime = arrM[1].trim() + (arrM[2] || '')
  }

  // Duration: first "N hr M min" or "N hr"
  const durM = text.match(/(\d+)\s*hr(?:\s*(\d+)\s*min)?/)
  const duration = durM ? `${durM[1]}h${durM[2] ? ` ${durM[2]}m` : ''}` : null

  // Stops
  const stopsM = text.match(/Nonstop|\d+\s*stop/i)
  const stops = stopsM ? stopsM[0] : null

  // Airline: appears right after the arrival date "Day, Mon DD" and before the duration
  // e.g. "...Wed, Apr 29Cathay Pacific8 hr..." or "...Thu, Apr 30Qantas, Cathay Pacific13 hr..."
  const airlineM = text.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w+\s+\d+([^0-9]+?)(?=\d+\s*hr)/)
  const airline = airlineM ? airlineM[1].trim().replace(/^[\s,–-]+|[\s,–-]+$/g, '') : null

  // Price: first A$N,NNN
  const priceM = text.match(/A\$([\d,]+)/)
  const price = priceM ? parseInt(priceM[1].replace(/,/g, '')) : null

  return { airline, depTime, arrTime, duration, stops, price }
}

/* ─────── TRAVEL START DATE HELPERS ─────── */
// Returns a resolved date string for PREVIEW purposes only.
// For 'relative' mode the daemon recomputes at run time.
function getTravelStartDate(mode, relativeDays, customDate) {
  if (mode === 'relative') {
    const d = new Date()
    d.setDate(d.getDate() + (relativeDays || 0))
    return d.toISOString().slice(0, 10)
  }
  if (mode === 'custom') return customDate || null
  return null // 'url' → no offset
}

function adjustBaseDates(baseDates, travelStartDate) {
  if (!travelStartDate || !baseDates?.length) return baseDates
  const first = new Date(baseDates[0] + 'T00:00:00')
  const target = new Date(travelStartDate + 'T00:00:00')
  const offset = Math.round((target - first) / 86400000)
  return baseDates.map(d => {
    const dt = new Date(d + 'T00:00:00')
    dt.setDate(dt.getDate() + offset)
    return dt.toISOString().slice(0, 10)
  })
}

/* ─────── URL PARSER — v4 ─────── */
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

    const dates = []
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    for (let j = 0; j <= bytes.length - 10; j++) {
      let s = ''
      for (let k = 0; k < 10; k++) s += String.fromCharCode(bytes[j + k])
      if (dateRe.test(s)) { dates.push({ index: j, date: s }); j += 9 }
    }
    if (!dates.length) return null

    const known = new Set(AIRPORTS.map(a => a.code))
    const allCodes = []
    for (let j = 0; j <= bytes.length - 3; j++) {
      let s = ''
      for (let k = 0; k < 3; k++) s += String.fromCharCode(bytes[j + k])
      if (/^[A-Z]{3}$/.test(s) && known.has(s)) {
        const befChar = j > 0 ? String.fromCharCode(bytes[j - 1]) : '\x00'
        const aftChar = j + 3 < bytes.length ? String.fromCharCode(bytes[j + 3]) : '\x00'
        if (!/[A-Z]/.test(befChar) && !/[A-Z]/.test(aftChar)) {
          allCodes.push({ index: j, code: s })
          j += 2
        }
      }
    }

    // Google Flights can repeat the same departure date inside one logical leg
    // block, so we collapse consecutive identical dates before slicing segments.
    const dateBlocks = []
    for (const d of dates) {
      const prev = dateBlocks[dateBlocks.length - 1]
      if (prev?.date === d.date) {
        prev.endIndex = d.index + 10
      } else {
        dateBlocks.push({ date: d.date, index: d.index, endIndex: d.index + 10 })
      }
    }

    const legs = dateBlocks.map((d, i) => {
      const segStart = d.index + 10
      const segEnd = i + 1 < dateBlocks.length ? dateBlocks[i + 1].index : bytes.length
      const segCodes = allCodes.filter(c => c.index >= segStart && c.index < segEnd)
      const unique = []
      for (const c of segCodes) {
        if (!unique.length || c.code !== unique[unique.length - 1]) unique.push(c.code)
      }
      return {
        date: d.date,
        from: unique.length >= 2 ? unique[0] : null,
        to: unique.length >= 2 ? unique[unique.length - 1] : (unique.length === 1 ? unique[0] : null),
      }
    })

    for (let i = 1; i < legs.length; i++) {
      if (!legs[i].from && legs[i].to && legs[i - 1].to) {
        legs[i].from = legs[i - 1].to
      }
    }
    if (!legs[0].from && legs[0].to && legs.length > 1 && legs[legs.length - 1].to) {
      legs[0].from = legs[legs.length - 1].to
    }

    const valid = legs.filter(l => l.from && l.to)
    return valid.length ? { dates: dateBlocks.map(d => d.date), legs: valid } : null
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

/* ─────── STATUS HELPERS ─────── */
function searchStatus(s) {
  const isOneOff = (s.schedule_interval_days || 0) === 0
  if (s.is_active) return { label: isOneOff ? 'Queued' : 'Active', color: 'bg-emerald-100 text-emerald-700' }
  if (isOneOff && s.last_run_at) return { label: 'Completed', color: 'bg-blue-100 text-blue-700' }
  return { label: 'Paused', color: 'bg-gray-100 text-gray-500' }
}

/* ─────── COMPONENT ─────── */
export default function FlightSearchApp({ session }) {
  /* ── State ── */
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
  const [fOneOff, setFOneOff] = useState(false)
  const [fStartMode, setFStartMode] = useState('url')      // 'url' | 'relative' | 'custom'
  const [fRelativeDays, setFRelativeDays] = useState(14)
  const [fTravelStart, setFTravelStart] = useState('')       // custom date
  const [fHasEndDate, setFHasEndDate] = useState(true)

  // Edit
  const [editingId, setEditingId] = useState(null)
  const [eFields, setEFields] = useState({})
  const [eSaving, setESaving] = useState(false)
  const [eUrlParsed, setEUrlParsed] = useState(null)

  // Results
  const [selSearchId, setSelSearchId] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loadingSnap, setLoadingSnap] = useState(false)
  const [expandedShiftIds, setExpandedShiftIds] = useState(new Set())
  const [selectedResultCell, setSelectedResultCell] = useState(null)
  const [shareModalId, setShareModalId] = useState(null)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [sharedTokenInput, setSharedTokenInput] = useState('')
  const [sharedViewData, setSharedViewData] = useState(null)
  const [loadingSharedView, setLoadingSharedView] = useState(false)

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  const ask = (msg, fn) => setConfirmDlg({ msg, fn })
  const doConfirm = () => { confirmDlg?.fn(); setConfirmDlg(null) }

  /* ── Load searches ── */
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

  /* ── Parse URL on change (add form) ── */
  useEffect(() => {
    if (!fUrl.trim()) { setFParsed(null); return }
    const p = parseFlightUrl(fUrl.trim())
    setFParsed(p)
    if (p?.legs?.length) {
      const codes = p.legs.map(l => l.from)
      codes.push(p.legs[p.legs.length - 1].to)
      setFName(codes.join('-'))
    }
  }, [fUrl])

  /* ── Auto stop date (add form) ── */
  useEffect(() => {
    if (!fParsed?.dates?.length || !fHasEndDate || fOneOff) return
    const tsd = getTravelStartDate(fStartMode, fRelativeDays, fTravelStart)
    const adjusted = adjustBaseDates(fParsed.dates, tsd)
    if (adjusted?.length) {
      const first = new Date(adjusted[0])
      first.setDate(first.getDate() - 7)
      setFStopDate(first.toISOString().slice(0, 10))
    }
  }, [fParsed, fStartMode, fRelativeDays, fTravelStart, fHasEndDate, fOneOff])

  /* ── Adjusted base dates (add form) ── */
  const adjustedBaseDates = useMemo(() => {
    if (!fParsed?.dates?.length) return []
    const tsd = getTravelStartDate(fStartMode, fRelativeDays, fTravelStart)
    return tsd ? adjustBaseDates(fParsed.dates, tsd) : fParsed.dates
  }, [fParsed, fStartMode, fRelativeDays, fTravelStart])

  /* ── Shift preview (add form) ── */
  const shiftPreview = useMemo(() => {
    if (!adjustedBaseDates.length) return []
    return computeShiftPreview(adjustedBaseDates, fShiftStart, fShiftEnd, fStepDays)
  }, [adjustedBaseDates, fShiftStart, fShiftEnd, fStepDays])

  /* ── Edit: adjusted base dates ── */
  const eAdjustedDates = useMemo(() => {
    if (!eUrlParsed?.dates?.length || !editingId) return []
    const tsd = getTravelStartDate(eFields.startMode, eFields.relativeDays, eFields.travelStart)
    return tsd ? adjustBaseDates(eUrlParsed.dates, tsd) : eUrlParsed.dates
  }, [eUrlParsed, eFields.startMode, eFields.relativeDays, eFields.travelStart, editingId])

  /* ── Edit: shift preview ── */
  const eShiftPreview = useMemo(() => {
    if (!eAdjustedDates.length || !editingId) return []
    return computeShiftPreview(eAdjustedDates, eFields.shift_start ?? 0, eFields.shift_end ?? 4, eFields.shift_step_days ?? 7)
  }, [eAdjustedDates, eFields.shift_start, eFields.shift_end, eFields.shift_step_days, editingId])

  /* ── Load snapshots ── */
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

  /* ── Save new search ── */
  const saveSearch = async () => {
    if (!fParsed) return notify('Paste a valid Google Flights URL')
    if (!fName.trim()) return notify('Enter a name')
    if (fStartMode === 'custom' && !fTravelStart) return notify('Choose a fixed departure date')
    if (!fOneOff && fHasEndDate && !fStopDate) return notify('Choose a stop date or switch to no end date')
    if (!fOneOff && fSchedDays < 1) return notify('Re-check interval must be at least 1 day')
    setSaving(true)
    const { data, error } = await supabase
      .from('tracked_searches')
      .insert({
        user_id: session.user.id,
        name: fName.trim(),
        base_url: fUrl.trim(),
        parsed_legs: fParsed.legs,
        base_dates: fParsed.dates,
        travel_date_mode: fStartMode,
        travel_date_relative_days: fStartMode === 'relative' ? fRelativeDays : null,
        travel_start_date: fStartMode === 'custom' ? fTravelStart || null : null,
        shift_start: fShiftStart,
        shift_end: fShiftEnd,
        shift_step_days: fStepDays,
        schedule_interval_days: fOneOff ? 0 : normalizePositiveInt(fSchedDays),
        stop_date: fOneOff ? null : (fHasEndDate ? fStopDate || null : null),
        is_active: true,
        next_run_at: new Date().toISOString(),
      })
      .select().single()
    setSaving(false)
    if (!error && data) {
      setSearches(prev => [data, ...prev])
      resetAddForm()
      notify(fOneOff ? 'Queued for one-off run!' : 'Tracking started!')
    } else {
      notify('Error: ' + (error?.message || 'Unknown'))
    }
  }

  const resetAddForm = () => {
    setFUrl(''); setFName(''); setFParsed(null); setShowAdd(false)
    setFOneOff(false); setFStartMode('url'); setFRelativeDays(14)
    setFTravelStart(''); setFHasEndDate(true); setFStopDate('')
  }

  /* ── Edit handlers ── */
  const startEdit = (s) => {
    setEditingId(s.id)
    const parsed = parseFlightUrl(s.base_url)
    setEUrlParsed(parsed)
    // Restore mode: use saved mode, or infer from old records
    const mode = s.travel_date_mode || (s.travel_start_date ? 'custom' : 'url')
    setEFields({
      name: s.name || '',
      base_url: s.base_url || '',
      shift_start: s.shift_start ?? 0,
      shift_end: s.shift_end ?? 4,
      shift_step_days: s.shift_step_days ?? 7,
      schedule_interval_days: s.schedule_interval_days ?? 1,
      stop_date: s.stop_date || '',
      oneoff: (s.schedule_interval_days || 0) === 0,
      startMode: mode,
      relativeDays: s.travel_date_relative_days ?? 14,
      travelStart: s.travel_start_date || '',
      hasEndDate: !!s.stop_date,
    })
  }

  const updateE = (k, v) => setEFields(prev => ({ ...prev, [k]: v }))

  const handleEUrlChange = (url) => {
    updateE('base_url', url)
    const parsed = url.trim() ? parseFlightUrl(url.trim()) : null
    setEUrlParsed(parsed)
  }

  const saveEdit = async () => {
    if (!eFields.name?.trim()) return notify('Enter a name')
    if (!eUrlParsed) return notify('Paste a valid Google Flights URL before saving')
    if (eFields.startMode === 'custom' && !eFields.travelStart) return notify('Choose a fixed departure date')
    if (!eFields.oneoff && eFields.hasEndDate && !eFields.stop_date) return notify('Choose a stop date or switch to no end date')
    if (!eFields.oneoff && normalizePositiveInt(eFields.schedule_interval_days, 0) < 1) {
      return notify('Re-check interval must be at least 1 day')
    }
    setESaving(true)
    const upd = {
      name: eFields.name.trim(),
      base_url: eFields.base_url,
      parsed_legs: eUrlParsed?.legs || [],
      base_dates: eUrlParsed?.dates || [],
      travel_date_mode: eFields.startMode,
      travel_date_relative_days: eFields.startMode === 'relative' ? eFields.relativeDays : null,
      travel_start_date: eFields.startMode === 'custom' ? eFields.travelStart || null : null,
      shift_start: eFields.shift_start,
      shift_end: eFields.shift_end,
      shift_step_days: eFields.shift_step_days,
      schedule_interval_days: eFields.oneoff ? 0 : normalizePositiveInt(eFields.schedule_interval_days),
      stop_date: eFields.oneoff ? null : (eFields.hasEndDate ? eFields.stop_date || null : null),
    }
    const { error } = await supabase.from('tracked_searches').update(upd).eq('id', editingId)
    setESaving(false)
    if (!error) {
      setSearches(prev => prev.map(s => s.id === editingId ? { ...s, ...upd } : s))
      setEditingId(null)
      notify('Updated!')
    } else {
      notify('Error: ' + error.message)
    }
  }

  /* ── Actions ── */
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
    notify('Deleted')
  }

  const deleteRun = async (runId) => {
    if (!selSearchId) return
    const { error } = await supabase
      .from('price_snapshots')
      .delete()
      .eq('tracked_search_id', selSearchId)
      .eq('run_id', runId)
    if (error) return notify('Error: ' + error.message)
    setSnapshots(prev => prev.filter(s => s.run_id !== runId))
    setSelectedResultCell(prev => prev?.runId === runId ? null : prev)
    notify('Run deleted')
  }

  /* ── Share functions ── */
  const toggleShiftExpand = (id) => {
    setExpandedShiftIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const generateShareToken = async (searchId) => {
    const token = crypto.randomUUID()
    const { error } = await supabase.from('tracked_searches')
      .update({ share_token: token }).eq('id', searchId)
    if (!error) {
      setSearches(prev => prev.map(s => s.id === searchId ? { ...s, share_token: token } : s))
      notify('Share link generated!')
    } else notify('Error: ' + error.message)
  }

  const revokeShare = async (searchId) => {
    const { error } = await supabase.from('tracked_searches')
      .update({ share_token: null }).eq('id', searchId)
    if (!error) {
      setSearches(prev => prev.map(s => s.id === searchId ? { ...s, share_token: null } : s))
      setShareModalId(null)
      notify('Sharing revoked')
    } else notify('Error: ' + error.message)
  }

  const loadSharedView = useCallback(async (tokenOrUrl) => {
    let token = (tokenOrUrl || '').trim()
    try { const u = new URL(token); token = u.searchParams.get('share') || token } catch {}
    if (!token) return notify('Invalid share link')
    setSharedViewData(null)
    setLoadingSharedView(true)
    const { data: search, error: searchError } = await supabase
      .rpc('get_search_by_share_token', { p_token: token })
      .maybeSingle()
    if (searchError) {
      setLoadingSharedView(false)
      return notify('Error: ' + searchError.message)
    }
    if (!search) { setLoadingSharedView(false); return notify('Shared search not found') }
    const { data: snaps, error: snapsError } = await supabase
      .rpc('get_snapshots_by_share_token', { p_token: token })
    if (snapsError) {
      setLoadingSharedView(false)
      return notify('Error: ' + snapsError.message)
    }
    setSharedViewData({ search, snapshots: snaps || [] })
    setLoadingSharedView(false)
  }, [])

  /* ── Computed: runs ── */
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
      return { runId: rid, items: sorted, time: sorted[0].scraped_at, cheapest: prices.length ? Math.min(...prices) : null }
    }).sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [snapshots])

  const recentRuns = useMemo(() => runs.slice(0, 5), [runs])
  const comparisonRows = useMemo(() => {
    if (!recentRuns.length) return []
    const rowMap = new Map()
    for (const run of recentRuns) {
      for (const item of run.items) {
        const rowKey = String(item.shift_index ?? item.shift_label ?? item.id)
        const firstDate = item.shifted_dates?.[0] || null
        const existing = rowMap.get(rowKey)
        if (!existing) {
          rowMap.set(rowKey, {
            key: rowKey,
            shiftIndex: item.shift_index ?? 0,
            shiftLabel: item.shift_label,
            firstDate,
            sampleDates: item.shifted_dates || [],
            cells: { [run.runId]: item },
          })
        } else {
          existing.cells[run.runId] = item
          if (!existing.firstDate && firstDate) existing.firstDate = firstDate
          if ((!existing.sampleDates || existing.sampleDates.length === 0) && item.shifted_dates?.length) {
            existing.sampleDates = item.shifted_dates
          }
        }
      }
    }
    return [...rowMap.values()].sort((a, b) => {
      const aDate = a.firstDate ? new Date(a.firstDate).getTime() : Number.MAX_SAFE_INTEGER
      const bDate = b.firstDate ? new Date(b.firstDate).getTime() : Number.MAX_SAFE_INTEGER
      if (aDate !== bDate) return aDate - bDate
      return a.shiftIndex - b.shiftIndex
    })
  }, [recentRuns])
  const selectedRun = useMemo(
    () => recentRuns.find(r => r.runId === selectedResultCell?.runId) || null,
    [recentRuns, selectedResultCell]
  )
  const selectedItem = useMemo(
    () => selectedRun?.items.find(item => item.id === selectedResultCell?.itemId) || null,
    [selectedRun, selectedResultCell]
  )

  useEffect(() => {
    if (!selectedResultCell) return
    if (!selectedRun || !selectedItem) setSelectedResultCell(null)
  }, [selectedResultCell, selectedRun, selectedItem])

  /* ── URL share param on mount ── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = new URLSearchParams(window.location.search).get('share')
    if (token) { setSharedTokenInput(token); setTab('results'); loadSharedView(token) }
  }, [loadSharedView])

  /* ── Loading ── */
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF5', fontFamily: mono }}>
      <p className={`${B} tracking-[0.15em] uppercase opacity-40 animate-pulse`}>Loading...</p>
    </div>
  )

  /* ── Reusable UI ── */
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
      <button onClick={onClick} disabled={disabled}
        className={`${B} tracking-[0.1em] uppercase px-4 py-2.5 rounded-xl transition-all ${styles[variant]} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
      >{children}</button>
    )
  }

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-[#222]' : 'bg-[#d0d0c8]'}`}
        onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </div>
      <span className={`${B} tracking-[0.08em] uppercase ${checked ? 'opacity-80' : 'opacity-40'}`}>{label}</span>
    </label>
  )

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`text-[12px] tracking-[0.06em] uppercase px-3 py-1.5 rounded-full transition-all ${
        active ? 'bg-[#222] text-[#f5f5ee] font-bold' : 'bg-[#f0f0ea] opacity-60 hover:opacity-100'
      }`}>
      {label}
    </button>
  )

  const Card = ({ children, className = '' }) => (
    <div className={className}
      style={{ borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#fff', overflow: 'hidden' }}>
      {children}
    </div>
  )

  /* ── Shared sub-components ── */
  const TravelStartPicker = ({ mode, onModeChange, relativeDays, onRelativeDaysChange, customDate, onCustomChange, baseDates, adjustedDates }) => {
    // Compute inline preview for relative mode
    let relativePreview = null
    if (mode === 'relative') {
      const d = new Date()
      d.setDate(d.getDate() + (relativeDays || 0))
      relativePreview = d.toISOString().slice(0, 10)
    }

    return (
      <div>
        <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">First Departure Date</label>
        <div className="flex gap-1.5 flex-wrap">
          <Pill label="URL Dates" active={mode === 'url'} onClick={() => onModeChange('url')} />
          <Pill label="Days from Now" active={mode === 'relative'} onClick={() => onModeChange('relative')} />
          <Pill label="Fixed Date" active={mode === 'custom'} onClick={() => onModeChange('custom')} />
        </div>

        {mode === 'relative' && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={relativeDays}
                onChange={e => onRelativeDaysChange(parseInt(e.target.value, 10) || 0)}
                className={`${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
                style={{ width: '100px' }}
              />
              <span className={`${B} opacity-40`}>days from today</span>
              {relativePreview && (
                <span className={`${B} opacity-30 tabular-nums`}>→ {fmtDate(relativePreview)}</span>
              )}
            </div>
            <p className="text-[10px] tracking-[0.08em] uppercase opacity-25 mt-1.5">
              Recalculated each time the daemon runs
            </p>
          </div>
        )}

        {mode === 'custom' && (
          <input type="date" value={customDate}
            onChange={e => onCustomChange(e.target.value)}
            className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors mt-2`}
          />
        )}

        {mode !== 'url' && adjustedDates?.length > 0 && baseDates?.length > 0 && (
          <div className="mt-2 bg-emerald-50 rounded-xl px-4 py-2.5">
            <p className="text-[10px] tracking-[0.12em] uppercase text-emerald-700 font-bold mb-1">✈ Adjusted Dates{mode === 'relative' ? ' (as of today)' : ''}</p>
            {adjustedDates.map((d, i) => (
              <p key={i} className={`${B} text-emerald-700 opacity-70 py-0.5 tabular-nums`}>
                <span className="opacity-40 line-through mr-2">{baseDates[i]}</span>
                → {fmtDate(d)}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  const EndDatePicker = ({ hasEnd, onHasEndChange, date, onDateChange, disabled = false }) => (
    <div>
      <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">Stop Tracking</label>
      <div className="flex gap-1.5 flex-wrap">
        <Pill label="No End Date" active={!hasEnd} onClick={() => onHasEndChange(false)} />
        <Pill label="Until Date" active={hasEnd} onClick={() => onHasEndChange(true)} />
      </div>
      {hasEnd && !disabled && (
        <input type="date" value={date}
          onChange={e => onDateChange(e.target.value)}
          className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors mt-2`}
        />
      )}
    </div>
  )

  /* ── Display helpers ── */
  const routeLabel = (legs) => {
    if (!legs?.length) return ''
    const codes = legs.map(l => l.from)
    codes.push(legs[legs.length - 1].to)
    return codes.join(' → ')
  }

  const travelLabel = (s) => {
    const mode = s.travel_date_mode || (s.travel_start_date ? 'custom' : 'url')
    if (mode === 'relative') return `✈ +${s.travel_date_relative_days ?? 14}d from run date`
    if (mode === 'custom' && s.travel_start_date) return `✈ Departs ${fmtDate(s.travel_start_date)}`
    return null
  }

  const scheduleLabel = (s) => {
    const isOneOff = (s.schedule_interval_days || 0) === 0
    const shifts = `${(s.shift_end ?? 0) - (s.shift_start ?? 0) + 1} shifts × ${s.shift_step_days ?? 7}d`
    if (isOneOff) return `${shifts} · One-off`
    let label = `${shifts} · Every ${s.schedule_interval_days}d`
    if (s.stop_date) label += ` · Stops ${s.stop_date}`
    else label += ' · No end date'
    return label
  }

  const ResultDetailCard = ({ item, runTime, onClose }) => {
    if (!item) return null
    const flights = Array.isArray(item.flights_raw) ? item.flights_raw : []
    return (
      <Card>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className={`${B} font-bold tabular-nums`}>{item.shift_label}</p>
              <p className={`${B} opacity-25 mt-0.5 tabular-nums`}>{item.shifted_dates?.join(' · ')}</p>
              {runTime && (
                <p className="text-[10px] tracking-[0.12em] uppercase opacity-35 mt-2">
                  Run · {fmtDateTime(runTime)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`${B} font-bold tabular-nums`}>
                {item.cheapest_price ? `A$${item.cheapest_price.toLocaleString()}` : '—'}
              </span>
              <button onClick={onClose} className={`${B} opacity-25 hover:opacity-100`}>✕</button>
            </div>
          </div>

          <div className="bg-[#f8f8f4] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#ebebeb] flex items-center justify-between gap-2">
              <span className={`${B} opacity-40 tabular-nums`}>
                {item.result_count} result{item.result_count !== 1 ? 's' : ''}
              </span>
              {item.url_used && (
                <a href={item.url_used} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] tracking-[0.06em] uppercase opacity-40 hover:opacity-80 underline underline-offset-2 transition-opacity">
                  Open on Google Flights ↗
                </a>
              )}
            </div>
            <div className="px-4 pb-3 pt-1 space-y-1">
              {flights.length === 0 && (
                <p className={`${B} opacity-25 py-2`}>No scraped flight details</p>
              )}
              {flights.map((raw, fi) => {
                const f = parseFlightSnippet(raw)
                return (
                  <div key={fi} className="flex flex-wrap items-baseline gap-x-3 gap-y-0 py-1 border-b border-[#eee] last:border-0">
                    {f?.airline && <span className={`${B} font-bold opacity-80`}>{f.airline}</span>}
                    {f?.depTime && <span className={`${B} tabular-nums opacity-60`}>{f.depTime} – {f.arrTime}</span>}
                    {f?.duration && <span className="text-[12px] opacity-40">{f.duration}</span>}
                    {f?.stops && <span className={`text-[12px] ${f.stops === 'Nonstop' ? 'text-emerald-600 opacity-80' : 'opacity-50'}`}>{f.stops}</span>}
                    {f?.price && <span className={`${B} font-bold ml-auto tabular-nums`}>A${f.price.toLocaleString()}</span>}
                    {!f?.airline && !f?.depTime && <span className="text-[11px] opacity-30 font-mono">{String(raw).slice(0, 120)}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    )
  }

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

      {/* Share Modal */}
      {shareModalId && (() => {
        const s = searches.find(x => x.id === shareModalId)
        if (!s) return null
        const link = s.share_token ? `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?share=${s.share_token}` : null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="mx-4 max-w-sm w-full p-6 rounded-2xl space-y-4" style={{ background: '#FAFAF5', fontFamily: mono }}>
              <div className="flex items-center justify-between">
                <p className={`${B} font-bold tracking-[0.1em] uppercase`}>Share Results</p>
                <button onClick={() => { setShareModalId(null); setShareLinkCopied(false) }} className={`${B} opacity-25 hover:opacity-100`}>✕</button>
              </div>
              <p className={`${B} opacity-50 leading-relaxed`}>{s.name}</p>
              {!link ? (
                <div className="space-y-3">
                  <p className={`${B} opacity-40 text-[12px] leading-relaxed`}>
                    Generate a link so others can view these results (read-only). They must be logged in to view.
                  </p>
                  <Btn onClick={() => generateShareToken(s.id)} variant="primary" className="w-full">Generate Share Link</Btn>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#f0f0ea] rounded-xl px-3 py-2 break-all">
                    <p className="text-[11px] opacity-50 font-mono leading-relaxed">{link}</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn onClick={() => { navigator.clipboard.writeText(link); setShareLinkCopied(true); setTimeout(() => setShareLinkCopied(false), 2000) }}
                      variant="primary" className="flex-1">
                      {shareLinkCopied ? '✓ Copied!' : 'Copy Link'}
                    </Btn>
                    <Btn onClick={() => ask('Revoke this share link? Anyone with the link will lose access.', () => revokeShare(s.id))} variant="danger">
                      Revoke
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Header */}
      <header>
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-end justify-between gap-4">
          <h1 className="text-[44px] sm:text-[48px] font-bold tracking-tight uppercase leading-none">Flight Tracker</h1>
          <button onClick={loadSearches} className={`${B} opacity-20 hover:opacity-60 pb-1`}>↻ Refresh</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pb-4">
        <div className="flex items-center gap-2">
          {['track', 'results'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`${B} tracking-[0.08em] uppercase px-5 py-2.5 rounded-full transition-all ${
                tab === t ? 'bg-[#222] text-[#f5f5ee] font-bold' : 'bg-[#f0f0ea] opacity-60 hover:opacity-100'
              }`}>
              {t}{t === 'track' && searches.length > 0 && <span className="ml-1.5 opacity-50">{searches.length}</span>}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => supabase.auth.signOut()}
            className={`${B} tracking-[0.1em] uppercase px-4 py-2.5 rounded-xl bg-[#f0f0ea] opacity-40 hover:opacity-100 transition-opacity`}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ════════ TRACK TAB ════════ */}
      {tab === 'track' && (
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">

          {!showAdd && (
            <button onClick={() => setShowAdd(true)}
              className={`w-full py-4 ${B} tracking-[0.15em] uppercase font-bold border-2 border-dashed rounded-2xl border-[#bbb] hover:border-[#222] active:bg-[#f0f0e5] transition-all`}>
              + Track New URL
            </button>
          )}

          {/* ── Add form ── */}
          {showAdd && (
            <Card>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`${B} font-bold tracking-[0.1em] uppercase opacity-30`}>New Tracked Search</span>
                  <button onClick={resetAddForm} className={`${B} opacity-25 hover:opacity-100`}>✕</button>
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">Google Flights URL</label>
                  <textarea
                    className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors resize-none`}
                    rows={3} placeholder="Paste your Google Flights search URL here..."
                    value={fUrl} onChange={e => setFUrl(e.target.value)}
                  />
                </div>

                {fUrl && !fParsed && (
                  <p className={`${B} text-red-500 opacity-70`}>
                    Could not parse URL. Make sure it's a Google Flights search URL with a tfs= parameter.
                  </p>
                )}
                {fParsed && (
                  <div className="bg-[#f0f0ea] rounded-xl px-4 py-3">
                    <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-2">
                      ✓ Detected {fParsed.legs.length} leg{fParsed.legs.length !== 1 ? 's' : ''}
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
                    <Input label="Name" value={fName} onChange={setFName} placeholder="e.g. BNE-HKG-PVG June trip" />

                    <TravelStartPicker
                      mode={fStartMode}
                      onModeChange={setFStartMode}
                      relativeDays={fRelativeDays}
                      onRelativeDaysChange={setFRelativeDays}
                      customDate={fTravelStart}
                      onCustomChange={setFTravelStart}
                      baseDates={fParsed.dates}
                      adjustedDates={adjustedBaseDates}
                    />

                    <div>
                      <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-2">Date Shifting</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input label="From shift" type="number" value={fShiftStart} onChange={setFShiftStart} />
                        <Input label="To shift" type="number" value={fShiftEnd} onChange={setFShiftEnd} />
                        <Input label="Step (days)" type="number" value={fStepDays} onChange={setFStepDays} />
                      </div>
                      {shiftPreview.length > 0 && (
                        <div className="mt-2 bg-[#f0f0ea] rounded-xl px-4 py-3 max-h-40 overflow-y-auto">
                          <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-1">
                            Preview — {shiftPreview.length} shift{shiftPreview.length !== 1 ? 's' : ''}
                          </p>
                          {shiftPreview.map(sp => (
                            <p key={sp.shift} className={`${B} opacity-50 py-0.5 tabular-nums`}>
                              +{sp.shift} ({sp.days}d): {sp.dates.map(d => fmtDate(d)).join(' · ')}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <Toggle label="One-off (run once, don't repeat)" checked={fOneOff} onChange={setFOneOff} />
                    </div>

                      {!fOneOff && (
                        <div className="space-y-3">
                        <Input label="Re-check every (days)" type="number" value={fSchedDays} onChange={v => setFSchedDays(normalizePositiveInt(v))} />
                         <EndDatePicker
                           hasEnd={fHasEndDate}
                           onHasEndChange={setFHasEndDate}
                           date={fStopDate}
                          onDateChange={setFStopDate}
                        />
                      </div>
                    )}

                    <button onClick={saveSearch} disabled={saving}
                      className={`w-full py-4 ${B} tracking-[0.15em] uppercase font-bold rounded-2xl transition-all ${
                        saving ? 'bg-[#888] text-[#f5f5ee] cursor-wait animate-pulse' : 'bg-[#222] text-[#f5f5ee] hover:bg-[#444]'
                      }`}>
                      {saving ? 'Saving...' : fOneOff ? '✈ Queue One-Off Run' : '✈ Save & Start Tracking'}
                    </button>
                  </>
                )}
              </div>
            </Card>
          )}

          {searches.length === 0 && !showAdd && (
            <div className="py-16 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>No tracked searches yet</p>
              <p className={`${B} tracking-[0.1em] uppercase opacity-15 mt-2`}>Add a Google Flights URL to start</p>
            </div>
          )}

          {/* ── Search cards ── */}
          {searches.map(s => {
            const status = searchStatus(s)
            const isEditing = editingId === s.id
            const isOneOff = (s.schedule_interval_days || 0) === 0
            const travel = travelLabel(s)

            return (
              <Card key={s.id}>
                <div className="px-5 py-4">

                  {!isEditing && (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`${B} font-bold uppercase`}>{s.name}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className={`${B} opacity-40 mt-1`}>{routeLabel(s.parsed_legs)}</p>
                          {travel && (
                            <p className={`${B} opacity-40 mt-0.5 tabular-nums`}>
                              <span className="text-emerald-600">{travel}</span>
                            </p>
                          )}
                          <p className={`${B} opacity-25 mt-0.5 tabular-nums`}>{scheduleLabel(s)}</p>
                        </div>
                      </div>

                      <div className={`${B} opacity-30 mt-2 tabular-nums`}>
                        {s.last_run_at ? `Last: ${timeAgo(s.last_run_at)}` : 'No runs yet'}
                        {s.next_run_at && s.is_active && !isOneOff && ` · Next: ${timeUntil(s.next_run_at)}`}
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Btn onClick={() => runNow(s)}>Run Now</Btn>
                        {!isOneOff && <Btn onClick={() => toggleActive(s)}>{s.is_active ? 'Pause' : 'Resume'}</Btn>}
                        <Btn onClick={() => startEdit(s)} variant="ghost">Edit</Btn>
                        <Btn onClick={() => { setSelSearchId(s.id); setTab('results') }} variant="ghost">Results</Btn>
                        <Btn onClick={() => { setShareModalId(s.id); setShareLinkCopied(false) }} variant="ghost">Share</Btn>
                        <div className="flex-1" />
                        <Btn onClick={() => ask(`Delete "${s.name}" and all its data?`, () => deleteSearch(s.id))} variant="danger">Delete</Btn>
                      </div>
                    </>
                  )}

                  {/* ── Edit view ── */}
                  {isEditing && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`${B} font-bold tracking-[0.1em] uppercase opacity-30`}>Edit Search</span>
                        <button onClick={() => setEditingId(null)} className={`${B} opacity-25 hover:opacity-100`}>✕</button>
                      </div>

                      <div>
                        <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">Google Flights URL</label>
                        <textarea
                          className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors resize-none`}
                          rows={3} value={eFields.base_url}
                          onChange={e => handleEUrlChange(e.target.value)}
                        />
                      </div>

                      {eFields.base_url && !eUrlParsed && (
                        <p className={`${B} text-red-500 opacity-70`}>
                          Could not parse URL. Check the tfs= parameter.
                        </p>
                      )}
                      {eUrlParsed && (
                        <div className="bg-[#f0f0ea] rounded-xl px-4 py-3">
                          <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-1">
                            ✓ {eUrlParsed.legs.length} leg{eUrlParsed.legs.length !== 1 ? 's' : ''} detected
                          </p>
                          {eUrlParsed.legs.map((l, i) => (
                            <p key={i} className={`${B} opacity-50 py-0.5`}>
                              {pad2(i + 1)}. {airportLabel(l.from)} → {airportLabel(l.to)}
                              <span className="opacity-40 ml-2">{l.date}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <Input label="Name" value={eFields.name} onChange={v => updateE('name', v)} />

                      <TravelStartPicker
                        mode={eFields.startMode}
                        onModeChange={v => updateE('startMode', v)}
                        relativeDays={eFields.relativeDays}
                        onRelativeDaysChange={v => updateE('relativeDays', v)}
                        customDate={eFields.travelStart}
                        onCustomChange={v => updateE('travelStart', v)}
                        baseDates={eUrlParsed?.dates || []}
                        adjustedDates={eAdjustedDates}
                      />

                      <div>
                        <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-2">Date Shifting</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input label="From shift" type="number" value={eFields.shift_start} onChange={v => updateE('shift_start', v)} />
                          <Input label="To shift" type="number" value={eFields.shift_end} onChange={v => updateE('shift_end', v)} />
                          <Input label="Step (days)" type="number" value={eFields.shift_step_days} onChange={v => updateE('shift_step_days', v)} />
                        </div>
                        {eShiftPreview.length > 0 && (
                          <div className="mt-2 bg-[#f0f0ea] rounded-xl px-4 py-3 max-h-40 overflow-y-auto">
                            <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-1">
                              Preview — {eShiftPreview.length} shift{eShiftPreview.length !== 1 ? 's' : ''}
                            </p>
                            {eShiftPreview.map(sp => (
                              <p key={sp.shift} className={`${B} opacity-50 py-0.5 tabular-nums`}>
                                +{sp.shift} ({sp.days}d): {sp.dates.map(d => fmtDate(d)).join(' · ')}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <Toggle label="One-off (run once, don't repeat)" checked={eFields.oneoff} onChange={v => updateE('oneoff', v)} />

                      {!eFields.oneoff && (
                        <div className="space-y-3">
                          <Input label="Re-check every (days)" type="number" value={eFields.schedule_interval_days} onChange={v => updateE('schedule_interval_days', normalizePositiveInt(v))} />
                          <EndDatePicker
                            hasEnd={eFields.hasEndDate}
                            onHasEndChange={v => updateE('hasEndDate', v)}
                            date={eFields.stop_date}
                            onDateChange={v => updateE('stop_date', v)}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Btn onClick={() => setEditingId(null)} className="flex-1">Cancel</Btn>
                        <Btn onClick={saveEdit} variant="primary" disabled={eSaving} className="flex-1">
                          {eSaving ? 'Saving...' : 'Save Changes'}
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}

          <div className="pt-4">
            <p className="text-[11px] tracking-[0.12em] uppercase opacity-20 text-center leading-relaxed">
              Daemon must be running to execute scrapes: node scripts/scraper-daemon.js
            </p>
          </div>
        </div>
      )}

      {/* ════════ RESULTS TAB ════════ */}
      {tab === 'results' && (
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">Select Tracked Search</label>
            <select
              className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none uppercase tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
              value={selSearchId || ''} onChange={e => setSelSearchId(e.target.value || null)}>
              <option value="">— Choose —</option>
              {searches.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* ── View Shared Search ── */}
          <div>
            <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">View Shared Search</label>
            <div className="flex gap-2">
              <input
                className={`flex-1 ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
                placeholder="Paste share link or token..."
                value={sharedTokenInput}
                onChange={e => setSharedTokenInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadSharedView(sharedTokenInput)}
              />
              <Btn onClick={() => loadSharedView(sharedTokenInput)} disabled={loadingSharedView}>
                {loadingSharedView ? '...' : 'Load'}
              </Btn>
              {sharedViewData && <Btn onClick={() => { setSharedViewData(null); setSharedTokenInput('') }}>Clear</Btn>}
            </div>
          </div>

          {/* ── Shared View Results ── */}
          {sharedViewData && (() => {
            const sv = sharedViewData.search
            const svSnaps = sharedViewData.snapshots
            const svRuns = (() => {
              const map = {}
              for (const s of svSnaps) { if (!map[s.run_id]) map[s.run_id] = []; map[s.run_id].push(s) }
              return Object.entries(map).map(([rid, items]) => {
                const sorted = items.sort((a, b) => a.shift_index - b.shift_index)
                const prices = sorted.filter(i => i.cheapest_price).map(i => i.cheapest_price)
                return { runId: rid, items: sorted, time: sorted[0].scraped_at, cheapest: prices.length ? Math.min(...prices) : null }
              }).sort((a, b) => new Date(b.time) - new Date(a.time))
            })()
            return (
              <Card>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${B} font-bold uppercase`}>{sv.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-700">Shared</span>
                  </div>
                  <p className={`${B} opacity-40`}>{sv.parsed_legs?.map(l => `${l.from}→${l.to}`).join(' · ')}</p>
                  {svRuns.length === 0 && <p className={`${B} opacity-25`}>No results yet</p>}
                  {svRuns.length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold`}>Latest Run — {fmtDateTime(svRuns[0].time)}</p>
                      {svRuns[0].items.map(item => {
                        const isBest = item.cheapest_price === svRuns[0].cheapest && item.cheapest_price
                        const isExp = expandedShiftIds.has('sv_' + item.id)
                        const flights = Array.isArray(item.flights_raw) ? item.flights_raw : []
                        return (
                          <div key={item.id} className={`rounded-xl overflow-hidden ${isBest ? 'bg-emerald-50' : 'bg-[#f8f8f4]'}`}>
                            <div className="flex items-center justify-between py-2 px-3">
                              <div className="min-w-0 flex-1">
                                <span className={`${B} font-bold tabular-nums`}>{item.shift_label}</span>
                                <span className={`${B} opacity-40 ml-2 tabular-nums`}>{item.shifted_dates?.map(d => fmtDate(d)).join(' · ')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[18px] font-bold tabular-nums ${isBest ? 'text-emerald-700' : ''}`}>
                                  {item.cheapest_price ? `A$${item.cheapest_price.toLocaleString()}` : '—'}
                                </span>
                                {flights.length > 0 && (
                                  <button onClick={() => toggleShiftExpand('sv_' + item.id)}
                                    className={`text-[11px] tracking-[0.06em] uppercase px-2 py-1 rounded-lg transition-all ${isExp ? 'bg-[#ddd] opacity-80' : 'opacity-30 hover:opacity-70'}`}>
                                    {isExp ? '▲' : `▼ ${flights.length}`}
                                  </button>
                                )}
                              </div>
                            </div>
                            {isExp && (
                              <div className={`px-3 pb-3 pt-1 border-t ${isBest ? 'border-emerald-100' : 'border-[#ebebeb]'} space-y-1`}>
                                {flights.map((raw, fi) => {
                                  const f = parseFlightSnippet(raw)
                                  return (
                                    <div key={fi} className="flex flex-wrap items-baseline gap-x-3 gap-y-0 py-1 border-b border-[#eee] last:border-0">
                                      {f?.airline && <span className={`${B} font-bold opacity-80`}>{f.airline}</span>}
                                      {f?.depTime && <span className={`${B} tabular-nums opacity-60`}>{f.depTime} – {f.arrTime}</span>}
                                      {f?.duration && <span className="text-[12px] opacity-40">{f.duration}</span>}
                                      {f?.stops && <span className={`text-[12px] ${f.stops === 'Nonstop' ? 'text-emerald-600 opacity-80' : 'opacity-50'}`}>{f.stops}</span>}
                                      {f?.price && <span className={`${B} font-bold ml-auto tabular-nums`}>A${f.price.toLocaleString()}</span>}
                                    </div>
                                  )
                                })}
                                {item.url_used && (
                                  <a href={item.url_used} target="_blank" rel="noopener noreferrer"
                                    className="inline-block mt-1 text-[11px] tracking-[0.06em] uppercase opacity-40 hover:opacity-80 underline underline-offset-2 transition-opacity">
                                    Open on Google Flights ↗
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {svRuns[0].cheapest && (
                        <div className="pt-2 border-t border-[#f0f0ea] flex items-center justify-between">
                          <span className={`${B} tracking-[0.1em] uppercase opacity-40`}>Best Price</span>
                          <span className="text-[28px] font-bold tabular-nums text-emerald-700">A${svRuns[0].cheapest.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })()}

          {!selSearchId && !sharedViewData && (
            <div className="py-8 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>Select a tracked search or load a shared link</p>
            </div>
          )}

          {selSearchId && loadingSnap && (
            <p className={`${B} tracking-[0.15em] uppercase opacity-40 animate-pulse text-center py-8`}>Loading...</p>
          )}

          {selSearchId && !loadingSnap && runs.length === 0 && (
            <div className="py-16 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>No results yet</p>
              <p className={`${B} tracking-[0.1em] uppercase opacity-15 mt-2`}>Waiting for daemon to run first scrape</p>
            </div>
          )}

          {selSearchId && !loadingSnap && runs.length > 0 && (
            <>
              <Card>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className={`${B} font-bold tracking-[0.1em] uppercase opacity-30`}>Results Matrix</p>
                      <p className="text-[10px] tracking-[0.12em] uppercase opacity-25 mt-1">
                        Departure dates by row · last 5 runs by column
                      </p>
                    </div>
                    <span className={`${B} opacity-30 tabular-nums`}>{recentRuns.length} run{recentRuns.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="text-left align-bottom py-2 pr-3 border-b border-[#ecece4] min-w-[220px]">
                            <span className="text-[10px] tracking-[0.12em] uppercase opacity-35 font-bold">Departure Dates</span>
                          </th>
                          {recentRuns.map(run => (
                            <th key={run.runId} className="align-bottom py-2 px-2 border-b border-[#ecece4] min-w-[120px]">
                              <div className="space-y-2">
                                <button
                                  onClick={() => ask(`Delete run from ${fmtDateTime(run.time)}?`, () => deleteRun(run.runId))}
                                  className="text-[10px] tracking-[0.12em] uppercase opacity-20 hover:opacity-80 transition-opacity"
                                >
                                  Delete
                                </button>
                                <div>
                                  <p className="text-[11px] tracking-[0.08em] uppercase opacity-35 font-bold">{fmtDateTime(run.time)}</p>
                                  <p className="text-[10px] opacity-25 mt-1">{run.items.length} shifts</p>
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map(row => (
                          <tr key={row.key}>
                            <td className="align-top py-3 pr-3 border-b border-[#f0f0ea]">
                              <p className={`${B} font-bold tabular-nums`}>{row.firstDate ? fmtDate(row.firstDate) : row.shiftLabel}</p>
                              <p className="text-[11px] opacity-25 mt-1 tabular-nums">{row.sampleDates?.join(' · ') || row.shiftLabel}</p>
                            </td>
                            {recentRuns.map(run => {
                              const item = row.cells[run.runId]
                              const selected = selectedResultCell?.runId === run.runId && selectedResultCell?.itemId === item?.id
                              return (
                                <td key={run.runId} className="align-top px-2 py-3 border-b border-[#f0f0ea]">
                                  {item ? (
                                    <button
                                      onClick={() => setSelectedResultCell({ runId: run.runId, itemId: item.id })}
                                      className={`w-full text-left rounded-xl px-3 py-3 transition-all ${selected ? 'bg-[#222] text-[#f5f5ee]' : 'bg-[#f8f8f4] hover:bg-[#efefe8]'}`}
                                    >
                                      <span className={`block ${B} font-bold tabular-nums`}>{item.cheapest_price ? `A$${item.cheapest_price.toLocaleString()}` : '—'}</span>
                                      <span className={`block text-[10px] tracking-[0.08em] uppercase mt-1 ${selected ? 'opacity-70' : 'opacity-30'}`}>
                                        {item.result_count} result{item.result_count !== 1 ? 's' : ''}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="w-full rounded-xl px-3 py-3 bg-[#fbfbf8] text-[12px] opacity-20 text-center">—</div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {selectedItem && (
                <ResultDetailCard
                  item={selectedItem}
                  runTime={selectedRun?.time}
                  onClose={() => setSelectedResultCell(null)}
                />
              )}
            </>
          )}
        </div>
      )}

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-[11px] tracking-[0.15em] uppercase opacity-20" style={{ fontFamily: mono }}>
          Flight Price Tracker · Daemon scrapes · UI displays
        </p>
        <p className="text-[11px] tracking-[0.12em] uppercase opacity-20 mt-2" style={{ fontFamily: mono }}>
          Last Deploy · {fmtDeployStamp(APP_DEPLOYED_AT)}
        </p>
      </footer>
    </div>
  )
}
