import { Component, type ReactNode } from 'react'

/** Mantém a consulta local disponível se o módulo WebGL falhar ao carregar. */
export class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <section className="map-area" aria-label="Mapa indisponível">
      <div className="map-status"><p role="status">Não foi possível iniciar o mapa. Consulte os pontos pela lista.</p>
        <button onClick={() => window.location.reload()}>Recarregar página</button>
      </div>
    </section>
    return this.props.children
  }
}
