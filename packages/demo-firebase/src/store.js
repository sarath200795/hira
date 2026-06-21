// Shared in-memory store + listener registry for the demo Firestore mock.
export const store = new Map() // fullPath -> data object
const docListeners = new Map() // docPath -> Set<fn>
const colListeners = new Map() // collectionPath -> Set<fn>

export function genId() {
  return 'id_' + Math.random().toString(36).slice(2, 11)
}

export function parentCollection(docPath) {
  const i = docPath.lastIndexOf('/')
  return i === -1 ? '' : docPath.slice(0, i)
}

export function addDocListener(path, fn) {
  if (!docListeners.has(path)) docListeners.set(path, new Set())
  docListeners.get(path).add(fn)
  return () => docListeners.get(path)?.delete(fn)
}
export function addColListener(path, fn) {
  if (!colListeners.has(path)) colListeners.set(path, new Set())
  colListeners.get(path).add(fn)
  return () => colListeners.get(path)?.delete(fn)
}

export function notify(docPath) {
  docListeners.get(docPath)?.forEach((fn) => fn())
  colListeners.get(parentCollection(docPath))?.forEach((fn) => fn())
}

// Timestamp-like value for serverTimestamp(): orders by millis, supports .toDate().
export function nowTimestamp() {
  const d = new Date()
  const ms = d.getTime()
  return {
    __ts: true,
    seconds: Math.floor(ms / 1000),
    nanoseconds: 0,
    toDate: () => new Date(ms),
    toMillis: () => ms,
    valueOf: () => ms,
  }
}

export function resolveSentinels(data) {
  if (Array.isArray(data)) return data.map(resolveSentinels)
  if (data && typeof data === 'object') {
    if (data.__serverTimestamp) return nowTimestamp()
    if (data.__ts || data instanceof Date) return data
    const out = {}
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue
      out[k] = resolveSentinels(v)
    }
    return out
  }
  return data
}

export function getField(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

// Apply a (possibly dotted) update map onto a target object, in place.
export function applyUpdate(target, data) {
  for (const [key, raw] of Object.entries(data)) {
    const value = raw && raw.__serverTimestamp ? nowTimestamp() : resolveSentinels(raw)
    if (key.includes('.')) {
      const parts = key.split('.')
      let o = target
      for (let i = 0; i < parts.length - 1; i++) {
        if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {}
        o = o[parts[i]]
      }
      o[parts[parts.length - 1]] = value
    } else {
      target[key] = value
    }
  }
}

export function childDocPaths(colPath) {
  const prefix = colPath + '/'
  const out = []
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      const rest = key.slice(prefix.length)
      if (!rest.includes('/')) out.push(key)
    }
  }
  return out
}
