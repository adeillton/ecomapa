import type { WasteTypeId } from '../../domain/waste-type'

const green = 'https://greeneletron.org.br/perguntas-frequentes/'

export function DisposalGuide({ accepts }: { accepts: WasteTypeId[] }) {
  return <details className="disposal-guide">
    <summary>Antes de levar seu descarte</summary>
    <p>Confira o produto específico, a quantidade e as condições de recebimento na fonte deste ponto. A categoria sozinha não garante aceitação de todos os itens.</p>
    {accepts.includes('batteries') && <section><h3>Pilhas e baterias</h3>
      <p>Baterias automotivas têm um sistema de coleta separado. Para baterias de lítio soltas, confirme a orientação do operador antes de levar.</p>
      <a href={green} target="_blank" rel="noopener noreferrer">Orientações da Green Eletron<span className="sr-only"> (abre em nova aba)</span></a>
    </section>}
    {accepts.includes('lamps') && <section><h3>Lâmpadas</h3>
      <p>Confirme o tipo de lâmpada e o limite de unidades. A Reciclus informa que não é necessário ser cliente da loja para utilizar seu coletor.</p>
      <a href="https://reciclus.org.br/onde-descartar/" target="_blank" rel="noopener noreferrer">Orientações da Reciclus<span className="sr-only"> (abre em nova aba)</span></a>
    </section>}
    {accepts.includes('electronics') && <section><h3>Dados pessoais</h3>
      <p>Antes de entregar celular ou computador, faça uma cópia dos arquivos, apague seus dados e retire o chip e os cartões de memória.</p>
      <a href={green} target="_blank" rel="noopener noreferrer">Preparação indicada pela Green Eletron<span className="sr-only"> (abre em nova aba)</span></a>
    </section>}
    {accepts.includes('appliances') && <section><h3>Equipamentos grandes</h3>
      <p>O cadastro confirma liquidificador. Geladeiras, fogões e outros equipamentos não estão confirmados nesta pesquisa. Consulte a fonte antes de transportá-los.</p>
    </section>}
  </details>
}
