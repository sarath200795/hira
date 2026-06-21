// Drop-in mock for the subset of `firebase/firestore` the ported apps use.
// Backed by the in-memory store; supports live onSnapshot, queries, batches and
// transactions. Aliased in for VITE_DEMO_MODE so app data code is unchanged.
import {
  store,
  genId,
  notify,
  addDocListener,
  addColListener,
  resolveSentinels,
  applyUpdate,
  getField,
  childDocPaths,
  nowTimestamp,
} from './store.js'

const DB = { __isMockDb: true }

export function getFirestore() { return DB }
export function initializeFirestore() { return DB }
export function connectFirestoreEmulator() {}
export function enableIndexedDbPersistence() { return Promise.resolve() }

const isDb = (x) => x && x.__isMockDb
const isDoc = (x) => x && x.__type === 'doc'
const isCol = (x) => x && x.__type === 'col'

function makeCol(path) { return { __type: 'col', path, id: path.split('/').pop() } }
function makeDoc(path) { return { __type: 'doc', path, id: path.split('/').pop() } }

export function collection(parent, ...segs) {
  const base = isDb(parent) ? '' : parent.path
  const path = [base, ...segs].filter(Boolean).join('/')
  return makeCol(path)
}

export function doc(parent, ...segs) {
  if (isCol(parent)) {
    const id = segs[0] || genId()
    return makeDoc(`${parent.path}/${id}`)
  }
  // doc(db, 'a','b',...)
  const path = segs.join('/')
  return makeDoc(path)
}

// ── Query building ───────────────────────────────────────────────────────────
export function query(ref, ...constraints) {
  const col = isCol(ref) ? ref : ref.ref
  const prev = ref.__isQuery ? ref.constraints : []
  return { __isQuery: true, ref: col, constraints: [...prev, ...constraints] }
}
export function where(field, op, value) { return { kind: 'where', field, op, value } }
export function orderBy(field, dir = 'asc') { return { kind: 'orderBy', field, dir } }
export function limit(n) { return { kind: 'limit', n } }
export function startAfter() { return { kind: 'noop' } }

const cmp = (a, b) => {
  const av = a == null ? '' : a.valueOf()
  const bv = b == null ? '' : b.valueOf()
  if (av < bv) return -1
  if (av > bv) return 1
  return 0
}

function matchWhere(data, c) {
  const v = getField(data, c.field)
  switch (c.op) {
    case '==': return v === c.value
    case '!=': return v !== c.value
    case '<': return cmp(v, c.value) < 0
    case '<=': return cmp(v, c.value) <= 0
    case '>': return cmp(v, c.value) > 0
    case '>=': return cmp(v, c.value) >= 0
    case 'in': return Array.isArray(c.value) && c.value.includes(v)
    case 'array-contains': return Array.isArray(v) && v.includes(c.value)
    default: return true
  }
}

function runQuery(col, constraints) {
  let docs = childDocPaths(col.path).map((p) => ({ id: p.split('/').pop(), path: p, data: store.get(p) }))
  for (const c of constraints) if (c.kind === 'where') docs = docs.filter((d) => matchWhere(d.data, c))
  for (const c of constraints) {
    if (c.kind === 'orderBy') {
      docs.sort((a, b) => cmp(getField(a.data, c.field), getField(b.data, c.field)))
      if (c.dir === 'desc') docs.reverse()
    }
  }
  const lim = constraints.find((c) => c.kind === 'limit')
  if (lim) docs = docs.slice(0, lim.n)
  return docs
}

// ── Snapshots ────────────────────────────────────────────────────────────────
function docSnap(path) {
  const exists = store.has(path)
  const data = store.get(path)
  return {
    id: path.split('/').pop(),
    exists: () => exists,
    data: () => (exists ? data : undefined),
    get: (f) => (exists ? getField(data, f) : undefined),
    ref: makeDoc(path),
  }
}
function querySnap(docs) {
  const snaps = docs.map((d) => ({
    id: d.id,
    exists: () => true,
    data: () => d.data,
    get: (f) => getField(d.data, f),
    ref: makeDoc(d.path),
  }))
  return { docs: snaps, size: snaps.length, empty: snaps.length === 0, forEach: (fn) => snaps.forEach(fn) }
}

// ── Reads ────────────────────────────────────────────────────────────────────
export function getDoc(ref) { return Promise.resolve(docSnap(ref.path)) }
export function getDocs(refOrQuery) {
  const col = refOrQuery.__isQuery ? refOrQuery.ref : refOrQuery
  const constraints = refOrQuery.__isQuery ? refOrQuery.constraints : []
  return Promise.resolve(querySnap(runQuery(col, constraints)))
}

export function onSnapshot(target, next, _error) {
  const cb = typeof next === 'function' ? next : next?.next
  if (isDoc(target)) {
    const emit = () => cb(docSnap(target.path))
    emit()
    return addDocListener(target.path, emit)
  }
  const col = target.__isQuery ? target.ref : target
  const constraints = target.__isQuery ? target.constraints : []
  const emit = () => cb(querySnap(runQuery(col, constraints)))
  emit()
  return addColListener(col.path, emit)
}

// ── Writes ───────────────────────────────────────────────────────────────────
export function setDoc(ref, data, options) {
  if (options?.merge && store.has(ref.path)) applyUpdate(store.get(ref.path), data)
  else store.set(ref.path, resolveSentinels(data))
  notify(ref.path)
  return Promise.resolve()
}
export function addDoc(col, data) {
  const ref = makeDoc(`${col.path}/${genId()}`)
  store.set(ref.path, resolveSentinels(data))
  notify(ref.path)
  return Promise.resolve(ref)
}
export function updateDoc(ref, data) {
  if (!store.has(ref.path)) store.set(ref.path, {})
  applyUpdate(store.get(ref.path), data)
  notify(ref.path)
  return Promise.resolve()
}
export function deleteDoc(ref) {
  store.delete(ref.path)
  notify(ref.path)
  return Promise.resolve()
}

export function serverTimestamp() { return { __serverTimestamp: true } }
export function Timestamp() {}
Timestamp.now = () => nowTimestamp()
Timestamp.fromDate = (d) => ({ __ts: true, toDate: () => d, toMillis: () => d.getTime(), valueOf: () => d.getTime(), seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 })
export function increment(n) { return { __increment: n } }
export function arrayUnion(...vals) { return { __arrayUnion: vals } }
export function arrayRemove(...vals) { return { __arrayRemove: vals } }
export function deleteField() { return { __deleteField: true } }

export function writeBatch() {
  const ops = []
  return {
    set: (ref, data, options) => ops.push(['set', ref, data, options]),
    update: (ref, data) => ops.push(['update', ref, data]),
    delete: (ref) => ops.push(['delete', ref]),
    commit: () => {
      for (const [op, ref, data, options] of ops) {
        if (op === 'set') {
          if (options?.merge && store.has(ref.path)) applyUpdate(store.get(ref.path), data)
          else store.set(ref.path, resolveSentinels(data))
        } else if (op === 'update') {
          if (!store.has(ref.path)) store.set(ref.path, {})
          applyUpdate(store.get(ref.path), data)
        } else if (op === 'delete') store.delete(ref.path)
      }
      ops.forEach(([, ref]) => notify(ref.path))
      return Promise.resolve()
    },
  }
}

export function runTransaction(_db, fn) {
  const txn = {
    get: (ref) => Promise.resolve(docSnap(ref.path)),
    set: (ref, data, options) => {
      if (options?.merge && store.has(ref.path)) applyUpdate(store.get(ref.path), data)
      else store.set(ref.path, resolveSentinels(data))
      notify(ref.path)
    },
    update: (ref, data) => { if (!store.has(ref.path)) store.set(ref.path, {}); applyUpdate(store.get(ref.path), data); notify(ref.path) },
    delete: (ref) => { store.delete(ref.path); notify(ref.path) },
  }
  return Promise.resolve(fn(txn))
}

export default { getFirestore }
