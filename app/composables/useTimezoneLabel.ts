export function useTimezoneLabel() {
  return computed(() => {
    if (!import.meta.client) return 'WIB'

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const wib = ['Asia/Jakarta', 'Asia/Pontianak', 'Asia/Pontianak']
    const wita = ['Asia/Makassar', 'Asia/Bali', 'Asia/Banjarmasin', 'Asia/Ujung_Pandang', 'Asia/Makassar']
    const wit = ['Asia/Jayapura', 'Asia/Dili', 'Asia/Port_Moresby']

    if (wib.includes(tz)) return 'WIB'
    if (wita.includes(tz)) return 'WITA'
    if (wit.includes(tz)) return 'WIT'

    const offset = -new Date().getTimezoneOffset()
    const hours = Math.floor(Math.abs(offset) / 60)
    const mins = Math.abs(offset) % 60
    const sign = offset >= 0 ? '+' : '-'
    return mins ? `UTC${sign}${hours}:${String(mins).padStart(2, '0')}` : `UTC${sign}${hours}`
  })
}
