// src/composables/useFormat.js

// Master data: daftar library yang digunakan di design system
export const LIBRARIES = ['gwind', 'kitvue', '@pegadaian/kitvue']

export function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
    + ', ' + dt.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })
}

export function atomicColor(l) {
  return { atom:'#2563EB', molecule:'#7C3AED', organism:'#C2410C', template:'#0F766E', page:'#DC2626' }[l] || '#666'
}

export function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
