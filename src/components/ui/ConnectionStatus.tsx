import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => { window.removeEventListener('online', callback); window.removeEventListener('offline', callback) }
}
export function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return !online ? <p className="connection-status" role="status">Você está sem conexão. Os pontos já carregados continuam na lista; mapa, fontes e rotas precisam de internet.</p> : null
}
