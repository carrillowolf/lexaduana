'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function GlossaryFAQ({ items }) {
  const [openId, setOpenId] = useState(null)

  return (
    <section className="border border-slate-200 rounded-2xl p-6 mb-12 bg-white shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Preguntas frecuentes</h2>
      <div className="space-y-2">
        {items.map((faq) => {
          const isOpen = openId === faq.id
          return (
            <div key={faq.id} className="border-b border-slate-200 last:border-0 pb-2 last:pb-0">
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between text-left py-3 hover:text-[#0A3D5C]"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-slate-900">{faq.question_es}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="text-slate-700 pb-3 pl-1">{faq.answer_es}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
