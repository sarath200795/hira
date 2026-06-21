// Mock for `firebase/app`.
const APP = { name: '[DEFAULT]', options: {}, __demo: true }
export function initializeApp() { return APP }
export function getApps() { return [APP] }
export function getApp() { return APP }
export function deleteApp() { return Promise.resolve() }
export default { initializeApp, getApps, getApp }
