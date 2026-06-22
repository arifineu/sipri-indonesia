import { idbGet, idbSet, IDB_STORE_REFERENCE } from './useIndexedDB'

interface CacheRecord<T> {
  key: string
  data: T
  cachedAt: number
}

export async function useReferenceData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
) {
  const { data, pending, error } = await useAsyncData<T>(`ref-${key}`, fetcher)

  if (import.meta.client) {
    onMounted(async () => {
      const now = Date.now()
      if (data.value) {
        // SSR payload populated data — persist (or refresh) the IDB cache.
        // Do NOT swap: that would mutate data after hydration and trigger
        // a hydration mismatch warning.
        await idbSet(IDB_STORE_REFERENCE, { key, data: data.value, cachedAt: now })
        return
      }
      // SSR fetch failed — fall back to IDB if we have a fresh cache.
      const cached = await idbGet<CacheRecord<T>>(IDB_STORE_REFERENCE, key)
      if (cached && now - cached.cachedAt < ttlMs) {
        data.value = cached.data as typeof data.value
      }
    })

    watch(data, (val) => {
      if (val) {
        idbSet(IDB_STORE_REFERENCE, { key, data: val, cachedAt: Date.now() })
      }
    })
  }

  return { data, pending, error }
}
