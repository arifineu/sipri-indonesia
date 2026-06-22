export const IDB_DB_NAME = 'sipri-indonesia'
export const IDB_DB_VERSION = 1
export const IDB_STORE_REFERENCE = 'reference'
export const IDB_STORE_SEARCH = 'searchHistory'

let dbPromise: Promise<IDBDatabase> | null = null
let idbAvailable = true

function isServer() {
  return typeof window === 'undefined'
}

function openDB(): Promise<IDBDatabase> {
  if (isServer() || !idbAvailable) return Promise.reject(new Error('IndexedDB unavailable'))
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = window.indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION)
    req.onupgradeneeded = (event) => {
      const db = req.result
      if (event.oldVersion < 1) {
        if (!db.objectStoreNames.contains(IDB_STORE_REFERENCE)) {
          db.createObjectStore(IDB_STORE_REFERENCE, { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains(IDB_STORE_SEARCH)) {
          db.createObjectStore(IDB_STORE_SEARCH, { keyPath: 'id', autoIncrement: true })
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      idbAvailable = false
      dbPromise = null
      reject(req.error ?? new Error('IndexedDB open failed'))
    }
    req.onblocked = () => {
      reject(new Error('IndexedDB blocked'))
    }
  })

  // If open fails, mark unavailable so subsequent callers skip quickly.
  dbPromise.catch(() => {
    idbAvailable = false
    dbPromise = null
  })

  return dbPromise
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

export async function idbGet<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  if (isServer() || !idbAvailable) return undefined
  try {
    return await run<T | undefined>(store, 'readonly', s => s.get(key) as IDBRequest<T | undefined>)
  } catch {
    return undefined
  }
}

export async function idbSet(store: string, value: object): Promise<void> {
  if (isServer() || !idbAvailable) return
  try {
    await run(store, 'readwrite', s => s.put(value))
  } catch {
    // ignore
  }
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  if (isServer() || !idbAvailable) return []
  try {
    return await run<T[]>(store, 'readonly', s => s.getAll() as IDBRequest<T[]>)
  } catch {
    return []
  }
}

export async function idbAdd(store: string, value: object): Promise<IDBValidKey | undefined> {
  if (isServer() || !idbAvailable) return undefined
  try {
    return await run<IDBValidKey>(store, 'readwrite', s => s.add(value))
  } catch {
    return undefined
  }
}

export async function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  if (isServer() || !idbAvailable) return
  try {
    await run(store, 'readwrite', s => s.delete(key))
  } catch {
    // ignore
  }
}

export async function idbClear(store: string): Promise<void> {
  if (isServer() || !idbAvailable) return
  try {
    await run(store, 'readwrite', s => s.clear())
  } catch {
    // ignore
  }
}
