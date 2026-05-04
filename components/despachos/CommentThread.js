'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { formatRelativeTime } from '@/lib/dispatchActivity'
import { safeLogger } from '@/lib/safe-logger'

export default function CommentThread({ dispatchId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [newContent, setNewContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  useEffect(() => {
    if (!dispatchId) return
    let active = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('dispatch_comments')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        safeLogger.error('Error cargando comentarios:', error)
        setComments([])
      } else {
        setComments(data || [])
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [dispatchId, supabase])

  const addComment = async () => {
    const content = newContent.trim()
    if (!content || !user?.id) return
    setPosting(true)
    const { data, error } = await supabase
      .from('dispatch_comments')
      .insert({ dispatch_id: dispatchId, user_id: user.id, content })
      .select()
      .single()
    setPosting(false)
    if (error) {
      safeLogger.error('Error añadiendo comentario:', error)
      alert('No se pudo añadir el comentario')
      return
    }
    setComments(prev => [data, ...prev])
    setNewContent('')
  }

  const deleteComment = async (id) => {
    if (!confirm('¿Borrar este comentario?')) return
    const { error } = await supabase.from('dispatch_comments').delete().eq('id', id)
    if (error) {
      safeLogger.error('Error borrando:', error)
      return
    }
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const visible = showAll ? comments : comments.slice(0, 5)

  return (
    <div>
      {/* Input nuevo comentario */}
      <div className="mb-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Añadir comentario..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              addComment()
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">Cmd/Ctrl + Enter para enviar</p>
          <button
            onClick={addComment}
            disabled={!newContent.trim() || posting}
            className="px-4 py-1.5 bg-[#0A3D5C] text-white text-xs font-bold rounded-lg hover:bg-[#083049] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {posting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-gray-500">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin comentarios todavía.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((c) => (
            <li key={c.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words flex-1">{c.content}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(c.created_at)}</span>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => deleteComment(c.id)}
                  className="text-xs text-gray-400 hover:text-red-600 mt-1"
                >
                  Borrar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {comments.length > 5 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="mt-3 text-xs font-medium text-[#0A3D5C] hover:underline"
        >
          {showAll ? 'Ver menos' : `Ver anteriores (${comments.length - 5})`}
        </button>
      )}
    </div>
  )
}
