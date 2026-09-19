import { useState } from 'react'
import { Copy } from 'lucide-react'

export function CopyButton({ label, text }: { label: string; text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch { setStatus('manual') }
  }
  return <div className="copy-action">
    <button onClick={() => void copy()}><Copy size={16} aria-hidden="true" />{label}</button>
    <span role="status" className="copy-status">{status === 'copied' ? 'Copiado.' : status === 'manual' ? 'Selecione e copie o texto abaixo.' : ''}</span>
    {status === 'manual' && <input aria-label={`Texto para ${label.toLocaleLowerCase('pt-BR')}`} readOnly value={text} onFocus={event => event.currentTarget.select()} />}
  </div>
}
