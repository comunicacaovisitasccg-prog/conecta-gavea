import { useState } from 'react'

export default function PasswordInput({ label, value, onChange, placeholder, id, erro }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs text-navy/50 mb-1.5">
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
          className={`w-full bg-transparent border-0 border-b pr-6 py-2 text-[14.5px] text-navy placeholder:text-navy/35 outline-none transition ${
            erro ? 'border-red-400' : 'border-navy/15 focus:border-navy/40'
          }`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-0 top-1.5 text-navy/35 hover:text-navy/60 transition"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {visivel ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5.5 0-9.7-4-11-8 .6-1.9 1.8-3.7 3.3-5.1M9.9 4.24A10.6 10.6 0 0 1 12 4c5.5 0 9.7 4 11 8-.5 1.6-1.4 3.1-2.6 4.4M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  )
}
