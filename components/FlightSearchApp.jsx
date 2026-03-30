'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'

/* ─────── CONSTANTS ─────── */
const mono = '"SF Mono","Fira Code","Cascadia Code","Consolas","Liberation Mono",monospace'
const B = 'text-[14px]'
const uid = () => Math.random().toString(36).slice(2, 11)
const pad2 = (n) => String(n).padStart(2, '0')

/* ─────── AIRPORTS ─────── */
const AIRPORTS = [
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
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'IN', lat: 19.09, lon: 72.87 },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.95, lon: 151.18 },
  { code: 'MEL', name: 'Tullamarine', city: 'Melbourne', country: 'AU', lat: -37.67, lon: 144.84 },
  { code: 'AKL', name: 'Auckland Intl', city: 'Auckland', country: 'NZ', lat: -37.01, lon: 174.79 },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', lat: 51.47, lon: -0.46 },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'UK', lat: 51.15, lon: -0.18 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.01, lon: 2.55 },
  { code: 'FRA', name: 'Frankfurt Intl', city: 'Frankfurt', country: 'DE', lat: 50.03, lon: 8.57 },
  { code: 'MUC', name: 'Munich Intl', city: 'Munich', country: 'DE', lat: 48.35, lon: 11.79 },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.31, lon: 4.77 },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'IT', lat: 41.80, lon: 12.25 },
  { code: 'MAD', name: 'Barajas', city: 'Madrid', country: 'ES', lat: 40.47, lon: -3.56 },
  { code: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'ES', lat: 41.30, lon: 2.08 },
  { code: 'IST', name: 'Istanbul Intl', city: 'Istanbul', country: 'TR', lat: 41.26, lon: 28.74 },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.25, lon: 55.36 },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'QA', lat: 25.26, lon: 51.61 },
  { code: 'ZRH', name: 'Zurich Intl', city: 'Zurich', country: 'CH', lat: 47.46, lon: 8.55 },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'AT', lat: 48.11, lon: 16.57 },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'DK', lat: 55.62, lon: 12.66 },
  { code: 'ARN', name: 'Arlanda', city: 'Stockholm', country: 'SE', lat: 59.65, lon: 17.94 },
  { code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'FI', lat: 60.32, lon: 24.96 },
  { code: 'LIS', name: 'Humberto Delgado', city: 'Lisbon', country: 'PT', lat: 38.77, lon: -9.13 },
  { code: 'ATH', name: 'Eleftherios Venizelos', city: 'Athens', country: 'GR', lat: 37.94, lon: 23.94 },
  { code: 'WAW', name: 'Chopin', city: 'Warsaw', country: 'PL', lat: 52.17, lon: 20.97 },
  { code: 'PRG', name: 'Václav Havel', city: 'Prague', country: 'CZ', lat: 50.10, lon: 14.26 },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US', lat: 40.64, lon: -73.78 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.94, lon: -118.41 },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', lat: 37.62, lon: -122.38 },
  { code: 'ORD', name: "O'Hare Intl", city: 'Chicago', country: 'US', lat: 41.97, lon: -87.91 },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'US', lat: 47.45, lon: -122.31 },
  { code: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'US', lat: 42.36, lon: -71.01 },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'US', lat: 25.80, lon: -80.29 },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'US', lat: 33.64, lon: -84.43 },
  { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', country: 'US', lat: 32.90, lon: -97.04 },
  { code: 'HNL', name: 'Daniel K. Inouye', city: 'Honolulu', country: 'US', lat: 21.32, lon: -157.92 },
  { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'CA', lat: 49.19, lon: -123.18 },
  { code: 'YYZ', name: 'Pearson Intl', city: 'Toronto', country: 'CA', lat: 43.68, lon: -79.63 },
  { code: 'GRU', name: 'Guarulhos', city: 'São Paulo', country: 'BR', lat: -23.43, lon: -46.47 },
  { code: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'AR', lat: -34.82, lon: -58.54 },
  { code: 'JNB', name: 'O.R. Tambo', city: 'Johannesburg', country: 'ZA', lat: -26.13, lon: 28.24 },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'EG', lat: 30.12, lon: 31.41 },
  { code: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'ID', lat: -8.75, lon: 115.17 },
  { code: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'ID', lat: -6.13, lon: 106.66 },
  { code: 'PNH', name: 'Phnom Penh Intl', city: 'Phnom Penh', country: 'KH', lat: 11.55, lon: 104.84 },
  { code: 'CMB', name: 'Bandaranaike', city: 'Colombo', country: 'LK', lat: 7.18, lon: 79.88 },
  { code: 'MLE', name: 'Velana Intl', city: 'Malé', country: 'MV', lat: 4.19, lon: 73.53 },
  { code: 'RGN', name: 'Yangon Intl', city: 'Yangon', country: 'MM', lat: 16.91, lon: 96.13 },
  { code: 'KTM', name: 'Tribhuvan', city: 'Kathmandu', country: 'NP', lat: 27.70, lon: 85.36 },
  { code: 'OSL', name: 'Gardermoen', city: 'Oslo', country: 'NO', lat: 60.20, lon: 11.10 },
]

/* ─────── AIRLINES ─────── */
const AIRLINES = [
  { code: 'CX', name: 'Cathay Pacific' },
  { code: 'HX', name: 'Hong Kong Airlines' },
  { code: 'UO', name: 'HK Express' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'NH', name: 'ANA' },
  { code: 'JL', name: 'Japan Airlines' },
  { code: 'EK', name: 'Emirates' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'TG', name: 'Thai Airways' },
  { code: 'MH', name: 'Malaysia Airlines' },
  { code: 'BR', name: 'EVA Air' },
  { code: 'CI', name: 'China Airlines' },
  { code: 'KE', name: 'Korean Air' },
  { code: 'OZ', name: 'Asiana Airlines' },
  { code: 'QF', name: 'Qantas' },
  { code: 'BA', name: 'British Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'AC', name: 'Air Canada' },
  { code: 'NZ', name: 'Air New Zealand' },
  { code: 'CA', name: 'Air China' },
  { code: 'MU', name: 'China Eastern' },
  { code: 'CZ', name: 'China Southern' },
  { code: 'VN', name: 'Vietnam Airlines' },
  { code: 'PR', name: 'Philippine Airlines' },
  { code: 'TR', name: 'Scoot' },
  { code: '5J', name: 'Cebu Pacific' },
]

/* ─────── UTILITIES ─────── */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const hashStr = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const pseudoRandom = (seed) => {
  let s = ((seed % 2147483647) + 2147483647) % 2147483647
  if (s === 0) s = 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const airportLabel = (code) => {
  const a = AIRPORTS.find((x) => x.code === code)
  return a ? `${a.city} (${a.code})` : code
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

/* ─────── MOCK FLIGHT GENERATOR ─────── */
const generateFlights = (fromCode, toCode, date, airlineCode) => {
  const from = AIRPORTS.find((a) => a.code === fromCode)
  const to = AIRPORTS.find((a) => a.code === toCode)
  if (!from || !to) return []

  const dist = haversine(from.lat, from.lon, to.lat, to.lon)
  const timeHour = Math.floor(Date.now() / 3600000)
  const seed = hashStr(`${fromCode}${toCode}${date}${airlineCode}`) + timeHour
  const rand = pseudoRandom(seed)

  const basePricePerKm = 0.055 + rand() * 0.04
  const basePrice = Math.max(65, Math.round(dist * basePricePerKm))

  const numFlights = 2 + Math.floor(rand() * 3)
  const flights = []
  const aircraftPool = ['A350-900', 'A350-1000', 'B777-300ER', 'B787-9', 'A330-300', 'B777-200', 'A321neo']
  const cabins = ['Economy', 'Premium Economy', 'Business', 'First']

  for (let i = 0; i < numFlights; i++) {
    const depHour = 6 + Math.floor(rand() * 16)
    const depMin = Math.floor(rand() * 12) * 5
    const baseDur = Math.round((dist / 820) * 60)
    const durationMin = Math.max(50, baseDur + Math.floor(rand() * 30) - 10)
    const arrTotal = depHour * 60 + depMin + durationMin
    const arrHour = Math.floor(arrTotal / 60) % 24
    const arrMin = Math.floor((arrTotal % 60) / 5) * 5
    const nextDay = arrTotal >= 1440

    const priceMulti = 1 + i * 0.25 + rand() * 0.12
    const price = Math.round(basePrice * priceMulti)
    const flightNum = `${airlineCode}${100 + Math.floor(rand() * 900)}`
    const aircraft = aircraftPool[Math.floor(rand() * aircraftPool.length)]
    const cabin = cabins[Math.min(i, cabins.length - 1)]
    const stops = dist > 8000 ? (rand() > 0.55 ? 1 : 0) : dist > 14000 ? (rand() > 0.3 ? 1 : 2) : 0

    flights.push({
      id: uid(),
      flightNumber: flightNum,
      airline: AIRLINES.find((a) => a.code === airlineCode)?.name || airlineCode,
      airlineCode,
      from: fromCode,
      to: toCode,
      date,
      departureTime: `${pad2(depHour)}:${pad2(depMin)}`,
      arrivalTime: `${pad2(arrHour)}:${pad2(arrMin)}`,
      duration: `${Math.floor(durationMin / 60)}h ${pad2(durationMin % 60)}m`,
      durationMin,
      aircraft,
      cabin,
      price,
      currency: 'USD',
      nextDay,
      stops,
    })
  }
  return flights.sort((a, b) => a.price - b.price)
}

/* ─────── LEG FACTORY ─────── */
const mkLeg = (from = '', to = '') => ({
  id: uid(),
  from,
  to,
  date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  fromQ: from ? airportLabel(from) : '',
  toQ: to ? airportLabel(to) : '',
})

/* ─────── COMPONENT ─────── */
export default function FlightSearchApp({ session }) {
  /* ── State ── */
  const [tab, setTab] = useState('search')
  const [legs, setLegs] = useState([mkLeg()])
  const [airline, setAirline] = useState('CX')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selectedFlights, setSelectedFlights] = useState({})
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [focusField, setFocusField] = useState(null)
  const [confirmDlg, setConfirmDlg] = useState(null)
  const [expandedHist, setExpandedHist] = useState(null)
  const [histRoute, setHistRoute] = useState('all')

  const loadedRef = useRef(false)
  const blurRef = useRef(null)

  /* ── Load History ── */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('flight_searches')
          .select('*')
          .eq('user_id', session.user.id)
          .order('searched_at', { ascending: false })
          .limit(200)
        if (data) setHistory(data)
      } catch {}
      loadedRef.current = true
      setIsLoading(false)
    }
    load()
  }, [session.user.id])

  /* ── Airport Suggestions ── */
  const suggestions = useMemo(() => {
    if (!focusField) return []
    const leg = legs[focusField.legIdx]
    if (!leg) return []
    const q = (focusField.field === 'from' ? leg.fromQ : leg.toQ).toLowerCase().trim()
    if (!q) return AIRPORTS.slice(0, 6)
    return AIRPORTS.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [focusField, legs])

  /* ── Leg Operations ── */
  const updLeg = (idx, updates) =>
    setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, ...updates } : l)))

  const handleInput = (legIdx, field, value) => {
    updLeg(legIdx, { [field]: '', [field + 'Q']: value })
    if (blurRef.current) clearTimeout(blurRef.current)
    setFocusField({ legIdx, field })
  }

  const handleFocus = (legIdx, field) => {
    if (blurRef.current) clearTimeout(blurRef.current)
    setFocusField({ legIdx, field })
  }

  const handleBlur = () => {
    blurRef.current = setTimeout(() => setFocusField(null), 200)
  }

  const selectAirport = (legIdx, field, airport) => {
    const label = `${airport.city} (${airport.code})`
    updLeg(legIdx, { [field]: airport.code, [field + 'Q']: label })
    if (field === 'to' && legIdx < legs.length - 1) {
      updLeg(legIdx + 1, { from: airport.code, fromQ: label })
    }
    setFocusField(null)
  }

  const swapLeg = (idx) => {
    const l = legs[idx]
    updLeg(idx, { from: l.to, to: l.from, fromQ: l.toQ, toQ: l.fromQ })
  }

  const addLeg = () => {
    const last = legs[legs.length - 1]
    const nl = mkLeg()
    if (last?.to) {
      nl.from = last.to
      nl.fromQ = last.toQ
    }
    if (last?.date) {
      const d = new Date(last.date)
      d.setDate(d.getDate() + 3)
      nl.date = d.toISOString().slice(0, 10)
    }
    setLegs((prev) => [...prev, nl])
  }

  const removeLeg = (idx) => {
    if (legs.length <= 1) return
    setLegs((prev) => prev.filter((_, i) => i !== idx))
  }

  /* ── Search ── */
  const searchFlights = () => {
    if (legs.some((l) => !l.from || !l.to || !l.date)) {
      setToast('Fill in all destinations and dates')
      setTimeout(() => setToast(''), 3000)
      return
    }
    if (legs.some((l) => l.from === l.to)) {
      setToast('Origin and destination cannot be the same')
      setTimeout(() => setToast(''), 3000)
      return
    }
    setSearching(true)
    setResults(null)
    setSelectedFlights({})
    setTimeout(() => {
      const lr = legs.map((l) => ({
        legId: l.id,
        from: l.from,
        to: l.to,
        date: l.date,
        flights: generateFlights(l.from, l.to, l.date, airline),
      }))
      setResults(lr)
      setSearching(false)
      const auto = {}
      lr.forEach((r) => {
        if (r.flights[0]) auto[r.legId] = r.flights[0].id
      })
      setSelectedFlights(auto)
      setTimeout(() => {
        const el = document.getElementById('search-results')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 1000 + Math.random() * 800)
  }

  /* ── Save Search ── */
  const saveSearch = async () => {
    if (!results) return
    const details = results.map((lr) => {
      const f = lr.flights.find((f) => f.id === selectedFlights[lr.legId]) || lr.flights[0]
      return f
    })
    const total = details.reduce((s, f) => s + (f?.price || 0), 0)
    const rk = legs
      .map((l) => l.from)
      .concat([legs[legs.length - 1].to])
      .join('-')
    const an = AIRLINES.find((a) => a.code === airline)?.name || airline
    setSaving(true)
    const { data, error } = await supabase
      .from('flight_searches')
      .insert({
        user_id: session.user.id,
        legs: legs.map((l) => ({ from: l.from, to: l.to, date: l.date })),
        airline_code: airline,
        airline_name: an,
        results: details,
        total_price: total,
        route_key: rk,
      })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setHistory((prev) => [data, ...prev])
      setToast('Saved to history')
      setTimeout(() => setToast(''), 3000)
    } else {
      setToast('Failed to save')
      setTimeout(() => setToast(''), 3000)
    }
  }

  /* ── Re-search from history ── */
  const reSearch = (h) => {
    if (!h.legs) return
    const newLegs = h.legs.map((l) => ({
      id: uid(),
      from: l.from,
      to: l.to,
      date: l.date,
      fromQ: airportLabel(l.from),
      toQ: airportLabel(l.to),
    }))
    setLegs(newLegs)
    setAirline(h.airline_code || 'CX')
    setResults(null)
    setSelectedFlights({})
    setTab('search')
    setToast('Loaded from history — tap Search')
    setTimeout(() => setToast(''), 3000)
  }

  /* ── Delete History ── */
  const delHist = async (id) => {
    await supabase.from('flight_searches').delete().eq('id', id)
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }
  const clearHistory = async () => {
    await supabase.from('flight_searches').delete().eq('user_id', session.user.id)
    setHistory([])
    setExpandedHist(null)
  }

  const ask = (msg, fn) => setConfirmDlg({ msg, fn })
  const doConfirm = () => {
    confirmDlg?.fn()
    setConfirmDlg(null)
  }

  /* ── Computed ── */
  const uniqueRoutes = useMemo(() => [...new Set(history.map((h) => h.route_key))], [history])
  const filtHist = useMemo(
    () => (histRoute === 'all' ? history : history.filter((h) => h.route_key === histRoute)),
    [history, histRoute]
  )
  const chartData = useMemo(
    () =>
      filtHist
        .slice()
        .reverse()
        .map((h) => ({
          date: new Date(h.searched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: h.total_price,
          route: h.route_key?.replace(/-/g, ' → '),
        })),
    [filtHist]
  )
  const totalPrice = useMemo(() => {
    if (!results) return 0
    return results.reduce((s, lr) => {
      const f = lr.flights.find((f) => f.id === selectedFlights[lr.legId]) || lr.flights[0]
      return s + (f?.price || 0)
    }, 0)
  }, [results, selectedFlights])

  /* ── Render Helpers ── */
  const renderSuggestions = (legIdx, field) => {
    if (focusField?.legIdx !== legIdx || focusField?.field !== field || suggestions.length === 0) return null
    return (
      <div
        className="absolute top-full left-0 right-0 z-40 mt-1 rounded-xl shadow-lg overflow-hidden"
        style={{ background: '#fff', border: '1px solid #e0e0d5' }}
      >
        {suggestions.map((a) => (
          <button
            key={a.code}
            className={`w-full text-left px-4 py-3 ${B} hover:bg-[#f0f0ea] transition-colors border-b border-[#f5f5f0] last:border-0`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => selectAirport(legIdx, field, a)}
          >
            <span className="font-bold">{a.code}</span>
            <span className="ml-2 opacity-60">
              {a.city}, {a.country}
            </span>
            <span className="ml-2 opacity-30 hidden sm:inline">{a.name}</span>
          </button>
        ))}
      </div>
    )
  }

  /* ── Loading ── */
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF5', fontFamily: mono }}>
        <p className={`${B} tracking-[0.15em] uppercase opacity-40 animate-pulse`}>Loading...</p>
      </div>
    )

  /* ── Main Render ── */
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF5', fontFamily: mono, color: '#1a1a1a' }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        select { -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; padding-right: 36px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-[#222] text-[#f5f5ee] shadow-lg">
          <p className={`${B} tracking-[0.08em] uppercase font-bold text-center`}>{toast}</p>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="mx-4 max-w-sm w-full p-6 rounded-2xl" style={{ background: '#FAFAF5', fontFamily: mono }}>
            <p className={`${B} tracking-[0.08em] uppercase font-bold mb-2`}>Confirm</p>
            <p className={`${B} tracking-[0.04em] mb-6 opacity-60 leading-relaxed`}>{confirmDlg.msg}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDlg(null)}
                className={`flex-1 ${B} tracking-[0.1em] uppercase px-5 py-3 rounded-xl border-2 border-[#ccc] hover:border-[#222] transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={doConfirm}
                className={`flex-1 ${B} tracking-[0.1em] uppercase px-5 py-3 rounded-xl bg-[#222] text-[#f5f5ee] font-bold hover:bg-[#444] transition-colors`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header>
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-end justify-between gap-4">
          <h1 className="text-[44px] sm:text-[48px] font-bold tracking-tight uppercase leading-none">Flight Search</h1>
          <span className={`${B} tracking-[0.1em] uppercase opacity-30 pb-1 flex-shrink-0`}>
            {saving ? 'Saving...' : ''}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pb-4">
        <div className="flex items-center gap-2">
          {['search', 'history'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${B} tracking-[0.08em] uppercase px-5 py-2.5 rounded-full transition-all ${
                tab === t ? 'bg-[#222] text-[#f5f5ee] font-bold' : 'bg-[#f0f0ea] opacity-60 hover:opacity-100'
              }`}
            >
              {t}
              {t === 'history' && history.length > 0 && (
                <span className="ml-1.5 opacity-50">{history.length}</span>
              )}
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

      {/* ── SEARCH TAB ── */}
      {tab === 'search' && (
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
          {/* Airline Selector */}
          <div>
            <label className={`text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5`}>
              Airline
            </label>
            <select
              className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none uppercase tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
            >
              {AIRLINES.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>

          {/* Flight Legs */}
          {legs.map((leg, idx) => (
            <div
              key={leg.id}
              style={{
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                background: '#fff',
                overflow: 'visible',
                position: 'relative',
              }}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`${B} font-bold tracking-[0.1em] uppercase opacity-30`}>
                    Leg {pad2(idx + 1)}
                  </span>
                  {legs.length > 1 && (
                    <button
                      onClick={() => removeLeg(idx)}
                      className={`${B} opacity-25 hover:opacity-100 hover:text-red-600 transition-all`}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* From */}
                <div className="relative mb-2">
                  <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">
                    From
                  </label>
                  <input
                    className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
                    placeholder="City or airport code..."
                    value={leg.fromQ}
                    onChange={(e) => handleInput(idx, 'from', e.target.value)}
                    onFocus={() => handleFocus(idx, 'from')}
                    onBlur={handleBlur}
                  />
                  {renderSuggestions(idx, 'from')}
                </div>

                {/* Swap */}
                <div className="flex justify-center my-1">
                  <button
                    onClick={() => swapLeg(idx)}
                    className={`${B} px-3 py-1 rounded-full bg-[#f0f0ea] opacity-35 hover:opacity-100 transition-opacity tracking-wide`}
                  >
                    ⇅
                  </button>
                </div>

                {/* To */}
                <div className="relative mb-3">
                  <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">
                    To
                  </label>
                  <input
                    className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
                    placeholder="City or airport code..."
                    value={leg.toQ}
                    onChange={(e) => handleInput(idx, 'to', e.target.value)}
                    onFocus={() => handleFocus(idx, 'to')}
                    onBlur={handleBlur}
                  />
                  {renderSuggestions(idx, 'to')}
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none tracking-wide border-2 border-transparent focus:border-[#222] transition-colors`}
                    value={leg.date}
                    onChange={(e) => updLeg(idx, { date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Stop */}
          <button
            onClick={addLeg}
            className={`w-full py-4 ${B} tracking-[0.15em] uppercase font-bold border-2 border-dashed rounded-2xl border-[#bbb] hover:border-[#222] active:bg-[#f0f0e5] transition-all`}
          >
            + Add Stop
          </button>

          {/* Search Button */}
          <button
            onClick={searchFlights}
            disabled={searching}
            className={`w-full py-5 ${B} tracking-[0.15em] uppercase font-bold rounded-2xl transition-all ${
              searching ? 'bg-[#888] text-[#f5f5ee] cursor-wait animate-pulse' : 'bg-[#222] text-[#f5f5ee] hover:bg-[#444]'
            }`}
          >
            {searching ? 'Searching Flights...' : '✈ Search Flights'}
          </button>

          {/* Results */}
          {results && (
            <div id="search-results" className="space-y-5 pt-2">
              <p className={`${B} tracking-[0.12em] uppercase font-bold opacity-40`}>
                {results.reduce((s, lr) => s + lr.flights.length, 0)} Flights Found
              </p>

              {results.map((lr) => (
                <div key={lr.legId}>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`${B} font-bold uppercase`}>
                      {lr.from} → {lr.to}
                    </span>
                    <span className={`${B} opacity-30`}>{fmtDate(lr.date)}</span>
                  </div>

                  <div className="space-y-2">
                    {lr.flights.map((f) => {
                      const isSel = selectedFlights[lr.legId] === f.id
                      return (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFlights((p) => ({ ...p, [lr.legId]: f.id }))}
                          className={`w-full text-left rounded-2xl px-5 py-4 transition-all ${
                            isSel ? 'bg-[#222] text-[#f5f5ee]' : 'bg-white hover:bg-[#f8f8f4]'
                          }`}
                          style={{ boxShadow: isSel ? 'none' : '0 2px 8px rgba(0,0,0,0.05)' }}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`${B} font-bold tabular-nums`}>{f.flightNumber}</span>
                              <span className={`${B} tabular-nums`}>
                                {f.departureTime} → {f.arrivalTime}
                                {f.nextDay && <span className="opacity-50 text-[11px] ml-1">+1</span>}
                              </span>
                              <span className={`${B} opacity-50`}>{f.duration}</span>
                            </div>
                            <span className="text-[22px] font-bold tabular-nums">${f.price.toLocaleString()}</span>
                          </div>
                          <div className={`flex items-center gap-3 mt-1.5 ${B} opacity-45 flex-wrap`}>
                            <span>{f.cabin}</span>
                            <span>·</span>
                            <span>{f.stops === 0 ? 'Non-stop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}</span>
                            <span>·</span>
                            <span>{f.aircraft}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Total & Save */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t-2 border-[#e8e8e0]">
                <div>
                  <span className={`${B} tracking-[0.12em] uppercase opacity-40 block`}>Total</span>
                  <span className="text-[36px] font-bold tabular-nums leading-tight">
                    ${totalPrice.toLocaleString()}
                  </span>
                  <span className={`${B} opacity-30 ml-2`}>
                    {results.length} leg{results.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={saveSearch}
                  disabled={saving}
                  className={`${B} tracking-[0.12em] uppercase px-6 py-3.5 rounded-xl border-2 border-[#222] hover:bg-[#222] hover:text-[#f5f5ee] transition-all font-bold`}
                >
                  {saving ? 'Saving...' : 'Save to History'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-5">
          {history.length === 0 ? (
            <div className="py-20 text-center">
              <p className={`${B} tracking-[0.12em] uppercase opacity-20`}>No searches yet</p>
              <p className={`${B} tracking-[0.1em] uppercase opacity-15 mt-2`}>
                Search for flights to build history
              </p>
            </div>
          ) : (
            <>
              {/* Route Filter */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold block mb-1.5">
                    Filter by Route
                  </label>
                  <select
                    className={`w-full ${B} bg-[#f0f0ea] rounded-xl px-4 py-3 outline-none uppercase tracking-wide`}
                    value={histRoute}
                    onChange={(e) => setHistRoute(e.target.value)}
                  >
                    <option value="all">All Routes ({history.length})</option>
                    {uniqueRoutes.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/-/g, ' → ')} ({history.filter((h) => h.route_key === r).length})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => ask('Clear all search history?', clearHistory)}
                  className={`${B} tracking-[0.1em] uppercase px-4 py-3 rounded-xl border border-[#ddd] opacity-40 hover:opacity-100 hover:border-red-400 hover:text-red-600 transition-all mt-5`}
                >
                  Clear All
                </button>
              </div>

              {/* Chart */}
              {chartData.length >= 2 && (
                <div
                  style={{
                    borderRadius: '20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    background: '#fff',
                    padding: '20px',
                  }}
                >
                  <p className={`${B} tracking-[0.12em] uppercase font-bold opacity-40 mb-4`}>Price Trend</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#222" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#222" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                        tickFormatter={(v) => `$${v}`}
                      />
                      <RTooltip
                        contentStyle={{
                          fontFamily: mono,
                          fontSize: 12,
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          background: '#fff',
                        }}
                        formatter={(v) => [`$${v.toLocaleString()}`, 'Total Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#222"
                        strokeWidth={2}
                        fill="url(#priceGrad)"
                        dot={{ fill: '#222', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#222' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {histRoute !== 'all' && (
                    <p className={`${B} opacity-25 mt-2 text-center`}>
                      {histRoute.replace(/-/g, ' → ')}
                    </p>
                  )}
                </div>
              )}

              {/* History List */}
              <div className="space-y-3">
                {filtHist.map((h) => {
                  const isExpanded = expandedHist === h.id
                  return (
                    <div
                      key={h.id}
                      style={{
                        borderRadius: '20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        background: '#fff',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        className="w-full text-left px-5 py-4 hover:bg-[#fafaf6] transition-colors"
                        onClick={() => setExpandedHist(isExpanded ? null : h.id)}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="min-w-0 flex-1">
                            <span className={`${B} font-bold uppercase`}>
                              {h.route_key?.replace(/-/g, ' → ')}
                            </span>
                            <span className={`${B} opacity-30 ml-2`}>{h.airline_name}</span>
                          </div>
                          <span className="text-[20px] font-bold tabular-nums flex-shrink-0">
                            ${h.total_price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className={`${B} opacity-30`}>
                            {new Date(h.searched_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <span className={`${B} opacity-20`}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-4 space-y-3 border-t border-[#f0f0ea]">
                          {/* Travel dates */}
                          <div className="pt-3">
                            <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-2">
                              Itinerary
                            </p>
                            {h.legs?.map((l, i) => (
                              <p key={i} className={`${B} opacity-50 py-0.5`}>
                                {pad2(i + 1)}. {airportLabel(l.from)} → {airportLabel(l.to)}{' '}
                                <span className="opacity-50">on {l.date}</span>
                              </p>
                            ))}
                          </div>
                          {/* Flight details */}
                          <div>
                            <p className="text-[10px] tracking-[0.12em] uppercase opacity-40 font-bold mb-2">
                              Selected Flights
                            </p>
                            {h.results?.map((f, i) => (
                              <div key={i} className="bg-[#f8f8f4] rounded-xl px-4 py-3 mb-2">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`${B} font-bold tabular-nums`}>{f.flightNumber}</span>
                                    <span className={`${B} tabular-nums`}>
                                      {f.departureTime} → {f.arrivalTime}
                                    </span>
                                    <span className={`${B} opacity-40`}>{f.duration}</span>
                                  </div>
                                  <span className={`${B} font-bold tabular-nums`}>
                                    ${f.price?.toLocaleString()}
                                  </span>
                                </div>
                                <p className={`${B} opacity-35 mt-1`}>
                                  {f.cabin} · {f.aircraft} ·{' '}
                                  {f.stops === 0 ? 'Non-stop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => reSearch(h)}
                              className={`${B} tracking-[0.1em] uppercase px-4 py-2.5 rounded-xl border border-[#ccc] hover:border-[#222] transition-colors`}
                            >
                              Search Again
                            </button>
                            <button
                              onClick={() => ask('Delete this search?', () => delHist(h.id))}
                              className={`${B} tracking-[0.1em] uppercase px-4 py-2.5 rounded-xl opacity-35 hover:opacity-100 hover:text-red-600 transition-all`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-[11px] tracking-[0.15em] uppercase opacity-40" style={{ fontFamily: mono }}>
          © {new Date().getFullYear()} Flight Search App. All rights reserved.
        </p>
        <p className="text-[10px] tracking-[0.12em] uppercase opacity-20 mt-1" style={{ fontFamily: mono }}>
          Prices are simulated · Connect a real API for live data
        </p>
      </footer>
    </div>
  )
}