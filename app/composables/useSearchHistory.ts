import type { Ref } from 'vue'
import { idbAdd, idbClear, idbDelete, idbGetAll, IDB_STORE_SEARCH } from './useIndexedDB'

export interface SearchHistoryEntry {
  id?: number
  query: string
  field: string
  timestamp: number
}

const MAX_HISTORY = 10

export function useSearchHistory(): {
  history: Ref<SearchHistoryEntry[]>
  addSearch: (query: string, field: string) => Promise<void>
  removeSearch: (id: number) => Promise<void>
  clearHistory: () => Promise<void>
} {
  const history = ref<SearchHistoryEntry[]>([])

  if (import.meta.client) {
    onMounted(async () => {
      const all = await idbGetAll<SearchHistoryEntry>(IDB_STORE_SEARCH)
      history.value = all.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY)
    })
  }

  async function persistAll(entries: SearchHistoryEntry[]) {
    await idbClear(IDB_STORE_SEARCH)
    for (const e of entries) {
      // Strip id so autoIncrement assigns fresh keys.
      const { id: _id, ...rest } = e
      await idbAdd(IDB_STORE_SEARCH, rest)
    }
  }

  async function addSearch(query: string, field: string) {
    const q = query.trim()
    if (!q) return
    const key = `${q.toLowerCase()}|${field}`
    const next = history.value.filter(
      h => `${h.query.toLowerCase()}|${h.field}` !== key
    )
    next.unshift({ query: q, field, timestamp: Date.now() })
    const capped = next.slice(0, MAX_HISTORY)
    history.value = capped
    await persistAll(capped)
  }

  async function removeSearch(id: number) {
    history.value = history.value.filter(h => h.id !== id)
    if (id !== undefined) await idbDelete(IDB_STORE_SEARCH, id)
  }

  async function clearHistory() {
    history.value = []
    await idbClear(IDB_STORE_SEARCH)
  }

  return { history, addSearch, removeSearch, clearHistory }
}
