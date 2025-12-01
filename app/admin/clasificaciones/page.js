'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// IMPORTANTE: Cambia este email por el tuyo
const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

export default function AdminClasificacionesPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [examples, setExamples] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    keywords: '',
    correct_code: '',
    correct_description: '',
    incorrect_codes: '',
    explanation: ''
  })

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Verificar si es admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      router.push('/dashboard')
      return
    }

    setUser(user)
    await loadExamples()
    setLoading(false)
  }

  const loadExamples = async () => {
    const { data, error } = await supabase
      .from('classification_examples')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setExamples(data)
    }
  }

  const resetForm = () => {
    setFormData({
      keywords: '',
      correct_code: '',
      correct_description: '',
      incorrect_codes: '',
      explanation: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (example) => {
    setFormData({
      keywords: example.keywords || '',
      correct_code: example.correct_code || '',
      correct_description: example.correct_description || '',
      incorrect_codes: example.incorrect_codes ? example.incorrect_codes.join(', ') : '',
      explanation: example.explanation || ''
    })
    setEditingId(example.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    // Convertir incorrect_codes de string a array
    const incorrectCodesArray = formData.incorrect_codes
      ? formData.incorrect_codes.split(',').map(c => c.trim()).filter(c => c)
      : []

    const dataToSave = {
      keywords: formData.keywords,
      correct_code: formData.correct_code,
      correct_description: formData.correct_description || null,
      incorrect_codes: incorrectCodesArray,
      explanation: formData.explanation || null,
      active: true
    }

    try {
      if (editingId) {
        // Actualizar
        const { error } = await supabase
          .from('classification_examples')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error
        setMessage({ type: 'success', text: 'Ejemplo actualizado correctamente' })
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('classification_examples')
          .insert([dataToSave])

        if (error) throw error
        setMessage({ type: 'success', text: 'Ejemplo añadido correctamente' })
      }

      resetForm()
      await loadExamples()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id, currentActive) => {
    const { error } = await supabase
      .from('classification_examples')
      .update({ active: !currentActive })
      .eq('id', id)

    if (!error) {
      await loadExamples()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este ejemplo?')) return

    const { error } = await supabase
      .from('classification_examples')
      .delete()
      .eq('id', id)

    if (!error) {
      setMessage({ type: 'success', text: 'Ejemplo eliminado' })
      await loadExamples()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A3D5C] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0A3D5C] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-[#F4C542] font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold">LexAduana</span>
              </Link>
              <span className="text-white/60">|</span>
              <span className="text-white/80">Panel Admin</span>
            </div>
            <Link 
              href="/dashboard" 
              className="text-white/80 hover:text-white transition-colors"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📚 Ejemplos de Clasificación IA
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona los ejemplos que ayudan a la IA a clasificar mejor
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-4 py-2 bg-[#0A3D5C] text-white rounded-lg hover:bg-[#0A3D5C]/90 transition-colors flex items-center gap-2"
          >
            <span>+</span> Añadir ejemplo
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? '✏️ Editar ejemplo' : '➕ Nuevo ejemplo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (separadas por coma) *
                </label>
                <textarea
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  required
                  rows={2}
                  placeholder="baliza V16, luz emergencia vehículo, señalización luminosa coche"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Incluye variantes: singular/plural, sinónimos, nombres comerciales
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código correcto (10 dígitos) *
                  </label>
                  <input
                    type="text"
                    value={formData.correct_code}
                    onChange={(e) => setFormData({ ...formData, correct_code: e.target.value })}
                    required
                    maxLength={10}
                    placeholder="8512200090"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Códigos incorrectos a evitar
                  </label>
                  <input
                    type="text"
                    value={formData.incorrect_codes}
                    onChange={(e) => setFormData({ ...formData, incorrect_codes: e.target.value })}
                    placeholder="8531100095, 8531100099"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separados por coma (opcional)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del código correcto
                </label>
                <input
                  type="text"
                  value={formData.correct_description}
                  onChange={(e) => setFormData({ ...formData, correct_description: e.target.value })}
                  placeholder="Los demás aparatos de alumbrado o señalización visual para vehículos automóviles"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explicación / Razonamiento
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  placeholder="La partida 8512 es específica para aparatos de señalización de vehículos automóviles. La 8531 es genérica. Aplicar Regla 3a: lo más específico prevalece."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Menciona RGI si aplica - ayuda a la IA a entender el razonamiento
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#0A3D5C] text-white rounded-lg hover:bg-[#0A3D5C]/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Examples List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Ejemplos registrados ({examples.length})
            </h2>
          </div>

          {examples.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No hay ejemplos registrados todavía.</p>
              <p className="text-sm mt-1">Añade el primero para empezar a educar la IA.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {examples.map((example) => (
                <div 
                  key={example.id} 
                  className={`p-6 ${!example.active ? 'bg-gray-50 opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {example.keywords.split(',').slice(0, 5).map((kw, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {kw.trim()}
                          </span>
                        ))}
                        {example.keywords.split(',').length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{example.keywords.split(',').length - 5} más
                          </span>
                        )}
                      </div>

                      {/* Código correcto */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-600 font-mono font-bold">
                          ✅ {example.correct_code}
                        </span>
                        {example.correct_description && (
                          <span className="text-gray-600 text-sm">
                            - {example.correct_description}
                          </span>
                        )}
                      </div>

                      {/* Códigos incorrectos */}
                      {example.incorrect_codes && example.incorrect_codes.length > 0 && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-red-500 text-sm">
                            ❌ Evitar: {example.incorrect_codes.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Explicación */}
                      {example.explanation && (
                        <p className="text-gray-500 text-sm mt-2 italic">
                          💡 {example.explanation}
                        </p>
                      )}

                      {/* Meta */}
                      <p className="text-gray-400 text-xs mt-2">
                        Creado: {new Date(example.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(example.id, example.active)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          example.active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {example.active ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        onClick={() => handleEdit(example)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(example.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">💡 Consejos para buenos ejemplos</h3>
          <ul className="text-amber-700 text-sm space-y-1">
            <li>• <strong>Keywords:</strong> Incluye muchas variantes (singular/plural, sinónimos, marcas)</li>
            <li>• <strong>Códigos incorrectos:</strong> Añade los que la IA suele sugerir mal</li>
            <li>• <strong>Explicación:</strong> Menciona qué RGI aplica y por qué - ayuda a la IA a razonar</li>
            <li>• Si detectas un error recurrente de la IA, añade un ejemplo aquí para corregirlo</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
