'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getFieldLabel, getValueLabel, formatRelativeTime } from '@/lib/dispatchActivity'

export default function ActivityTimeline({ dispatchId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!dispatchId) return
    let active = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('dispatch_timeline')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!active) return
      if (error) {
        console.error('Error cargando timeline:', error)
        setEvents([])
      } else {
        setEvents(data || [])
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [dispatchId, supabase])

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando historial...</p>
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">Sin actividad registrada todavía.</p>
        <p className="text-xs text-gray-400 mt-1">Los cambios futuros aparecerán aquí.</p>
      </div>
    )
  }

  const visible = expanded ? events : events.slice(0, 10)

  const dotColor = (eventType) => {
    if (eventType?.startsWith('stage_')) return 'bg-[#0A3D5C]'
    if (eventType === 'dua_status' || eventType === 'mrn_number') return 'bg-blue-500'
    if (eventType === 'eta') return 'bg-orange-500'
    if (eventType === 'notes') return 'bg-gray-400'
    return 'bg-[#F4C542]'
  }

  return (
    <div>
      <ol className="relative border-l-2 border-gray-200 ml-2 space-y-4">
        {visible.map((ev) => (
          <li key={ev.id} className="ml-4">
            <span
              className={`absolute -left-[7px] flex items-center justify-center w-3 h-3 rounded-full ring-4 ring-white ${dotColor(ev.event_type)}`}
            />
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-[#0A3D5C]">{getFieldLabel(ev.event_type)}</span>{' '}
                <span className="text-gray-500">cambió</span>{' '}
                {ev.old_value !== null && (
                  <>
                    <span className="line-through text-gray-400">{getValueLabel(ev.old_value)}</span>
                    <span className="text-gray-400 mx-1">→</span>
                  </>
                )}
                <span className="font-medium text-gray-900">{getValueLabel(ev.new_value)}</span>
              </p>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(ev.created_at)}</span>
            </div>
          </li>
        ))}
      </ol>

      {events.length > 10 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 text-xs font-medium text-[#0A3D5C] hover:underline"
        >
          {expanded ? 'Ver menos' : `Ver todo (${events.length})`}
        </button>
      )}
    </div>
  )
}
