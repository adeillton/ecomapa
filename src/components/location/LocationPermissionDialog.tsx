import { useEffect, useRef } from 'react'
import { LocateFixed } from 'lucide-react'

interface Props { open: boolean; loading: boolean; onRequest: () => void; onClose: () => void }
export function LocationPermissionDialog({ open, loading, onRequest, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className="location-dialog" aria-labelledby="location-title" aria-describedby="location-description" onCancel={onClose}>
    <span className="dialog-icon"><LocateFixed size={28} aria-hidden="true" /></span>
    <h2 id="location-title">Encontre pontos próximos a você</h2>
    <p id="location-description">O EcoMapa pode usar sua localização apenas para calcular quais pontos de descarte estão mais próximos. Sua localização não é salva pelo aplicativo.</p>
    <button className="primary" onClick={onRequest} disabled={loading}>{loading ? 'Obtendo localização…' : 'Usar minha localização'}</button>
    <button onClick={onClose}>Continuar sem localização</button>
  </dialog>
}
