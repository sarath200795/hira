// Mock for `firebase/storage` — enough to satisfy imports; uploads resolve to a
// placeholder URL (demo has no real storage backend).
export function getStorage() { return { __demoStorage: true } }
export function ref(_s, path) { return { fullPath: path || '', name: (path || '').split('/').pop() } }
export function uploadBytes(r) { return Promise.resolve({ ref: r, metadata: {} }) }
export function uploadString(r) { return Promise.resolve({ ref: r, metadata: {} }) }
export function getDownloadURL() { return Promise.resolve('data:image/svg+xml;base64,') }
export function deleteObject() { return Promise.resolve() }
export default { getStorage }
