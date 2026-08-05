import { useState } from 'react'

export default function PasswordInput({ label, value, onChange, placeholder, id }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-navy-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-navy-900 placeholder:text-navy-300 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 transition"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-navy-400 hover:text-navy-600 transition"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {visivel ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5.5 0-9.7-4-11-8 .6-1.9 1.8-3.7 3.3-5.1M9.9 4.24A10.6 10.6 0 0 1 12 4c5.5 0 9.7 4 11 8-.5 1.6-1.4 3.1-2.6 4.4M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
