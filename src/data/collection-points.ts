import { validateDataset, type CollectionPoint } from '../domain/collection-point.ts'
import type { DisposalObjectId } from '../domain/disposal-object.ts'
import { sourceRegistry } from './source-registry.ts'

function fixedDropoff(acceptedItemIds: DisposalObjectId[]): Pick<CollectionPoint, 'attendance' | 'practicalInfo'> {
  return {
    attendance: { type: 'fixed_dropoff' },
    practicalInfo: { acceptedItemIds, verificationMethod: 'documentary_cross_check' },
  }
}

// Coordenadas conferidas visualmente contra a fonte de cada ponto antes da publicação.
const points: CollectionPoint[] = [
  {
    id: 'casas-bahia-garanhuns', slug: 'casas-bahia-garanhuns', name: 'Casas Bahia, Garanhuns',
    address: { street: 'Rua Maurício de Nassau', number: '82', district: 'Santo Antônio', city: 'Garanhuns', state: 'PE', formatted: 'Rua Maurício de Nassau, 82, Santo Antônio, Garanhuns, PE' },
    coordinates: { latitude: -8.8919548, longitude: -36.495584 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: { status: 'verified', verifiedAt: '2026-09-14', sources: ['recicla-pilhas'] },
  },
  {
    id: 'drogasil-heliopolis', slug: 'drogasil-heliopolis', name: 'Drogasil Heliópolis',
    address: { street: 'Avenida Presidente Getúlio Vargas', number: '676', district: 'Heliópolis', city: 'Garanhuns', state: 'PE', formatted: 'Avenida Presidente Getúlio Vargas, 676, Heliópolis, Garanhuns, PE' },
    coordinates: { latitude: -8.8865202, longitude: -36.4865311 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: { status: 'verified', verifiedAt: '2026-09-14', sources: ['recicla-pilhas'] },
  },
  {
    id: 'ferreira-costa-garanhuns', slug: 'ferreira-costa-garanhuns', name: 'Ferreira Costa, Garanhuns',
    address: { street: 'Avenida Santo Antônio', number: '515', district: 'Santo Antônio', city: 'Garanhuns', state: 'PE', formatted: 'Avenida Santo Antônio, 515, Santo Antônio, Garanhuns, PE' },
    coordinates: { latitude: -8.891589297405615, longitude: -36.49596363769614 }, ...fixedDropoff(['portable-battery', 'lamp', 'notebook', 'blender']), accepts: ['batteries', 'lamps', 'electronics', 'appliances'],
    verification: { status: 'verified', verifiedAt: '2026-09-15', sources: ['recicla-pilhas', 'reciclus', 'abree'], notes: 'A consulta à ABREE confirma notebook e liquidificador. Para outros equipamentos e itens grandes, confirme previamente com o ponto ou o operador.' },
  },
  {
    id: 'bravil-garanhuns', slug: 'bravil-garanhuns', name: 'Bravil Sistemas, Garanhuns',
    address: { street: 'Rua Severiano Peixoto', number: '142', district: 'Santo Antônio', city: 'Garanhuns', state: 'PE', formatted: 'Rua Severiano Peixoto, 142, Santo Antônio, Garanhuns, PE' },
    coordinates: { latitude: -8.8920876, longitude: -36.4933477 }, ...fixedDropoff(['notebook', 'blender']), accepts: ['electronics', 'appliances'],
    verification: { status: 'verified', verifiedAt: '2026-09-15', sources: ['abree'], notes: 'A consulta à ABREE confirma notebook e liquidificador. Para outros equipamentos e itens grandes, confirme previamente com o ponto ou o operador.' },
  },
  {
    id: 'ferreira-caruaru', slug: 'ferreira-caruaru', name: 'Ferreira Costa, Caruaru',
    address: { street: 'Avenida dos Estados', number: '129', district: 'Nova Caruaru', city: 'Caruaru', state: 'PE', formatted: 'Avenida dos Estados, 129, Nova Caruaru, Caruaru, PE' },
    coordinates: { latitude: -8.2656172, longitude: -35.9790676 }, ...fixedDropoff(['portable-battery', 'lamp', 'notebook', 'blender']), accepts: ['batteries', 'lamps', 'electronics', 'appliances'],
    verification: { status: 'verified', verifiedAt: '2026-09-15', sources: ['recicla-Caruaru', 'reciclus', 'abree'], notes: 'A consulta à ABREE confirma notebook e liquidificador. Para outros equipamentos e itens grandes, confirme previamente com o ponto ou o operador.' },
  },
  {
    id: 'magalu-bezerros', slug: 'magalu-bezerros', name: 'Magazine Luiza, Bezerros',
    address: { street: 'Rua Sigismundo Gonçalves', number: '15', district: 'Centro', city: 'Bezerros', state: 'PE', formatted: 'Rua Sigismundo Gonçalves, 15, Centro, Bezerros, PE' },
    coordinates: { latitude: -8.233407, longitude: -35.7514648 }, ...fixedDropoff(['notebook', 'blender']), accepts: ['electronics', 'appliances'],
    verification: { status: 'verified', verifiedAt: '2026-09-15', sources: ['abree'], notes: 'A consulta à ABREE confirma notebook e liquidificador. Produtos maiores que o coletor dependem de orientação do estabelecimento; confirme antes de levar.' },
  },
  {
    id: 'drogasil-belo-jardim', slug: 'drogasil-belo-jardim', name: 'Drogasil, Belo Jardim',
    address: { street: 'Rua Amélia Soares Paes', number: '23', city: 'Belo Jardim', state: 'PE', formatted: 'Rua Amélia Soares Paes, 23, Belo Jardim, PE' },
    coordinates: { latitude: -8.3327505, longitude: -36.418432 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: { status: 'verified', verifiedAt: '2026-09-15', sources: ['recicla-Belo Jardim'], notes: 'O operador identifica a unidade como São Pedro; a referência cartográfica usa Boa Vista. Rua e número coincidem.' },
  },
  {
    id: 'drogasil-gravata', slug: 'drogasil-gravata', name: 'Drogasil, Gravatá',
    address: { street: 'Avenida Governador Agamenon Magalhães', number: '679', district: 'Prado', city: 'Gravatá', state: 'PE', formatted: 'Avenida Governador Agamenon Magalhães, 679, Prado, Gravatá, PE' },
    coordinates: { latitude: -8.1978403, longitude: -35.5610879 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: { status: 'verified', verifiedAt: '2026-09-15', sources: ['recicla-Gravatá'] },
  },
  {
    id: 'assai-garanhuns', slug: 'assai-garanhuns', name: 'Assaí Atacadista, Garanhuns',
    address: { street: 'Avenida Prefeito Luiz Souto Dourado', number: '1102', district: 'Severiano Moraes Filho', city: 'Garanhuns', state: 'PE', postalCode: '55297-320', formatted: 'Avenida Prefeito Luiz Souto Dourado, 1102, Severiano Moraes Filho, Garanhuns, PE' },
    coordinates: { latitude: -8.875262, longitude: -36.462125 }, ...fixedDropoff(['portable-battery', 'lamp']), accepts: ['batteries', 'lamps'],
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['assai', 'recicla-pilhas'],
      notes: 'A página oficial da loja cita coletor de pilhas e baterias e coletor de lâmpadas. O operador de logística reversa informa a coordenada. As fontes divergem no bairro: Severiano Moraes Filho na loja e Novo Heliópolis no operador; rua, número e CEP coincidem.',
    },
  },
  {
    id: 'sesc-garanhuns', slug: 'sesc-garanhuns', name: 'Sesc Garanhuns',
    address: { street: 'Rua Manoel Clemente', number: '136', district: 'Centro', city: 'Garanhuns', state: 'PE', formatted: 'Rua Manoel Clemente, 136, Centro, Garanhuns, PE' },
    coordinates: { latitude: -8.893244, longitude: -36.491563 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    contact: { phone: '(87) 3761-2658' },
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['recicla-pilhas', 'sesc-pe'],
      notes: 'O operador lista o ponto como Centro de Turismo e Lazer, CTL Garanhuns; o Sesc registra a unidade de Garanhuns na mesma rua e número. Confirme o coletor na recepção antes de levar o descarte.',
    },
  },
  {
    id: 'assai-caruaru', slug: 'assai-caruaru', name: 'Assaí Atacadista, Caruaru',
    address: { street: 'Avenida Cleto Campelo', number: '9', district: 'Centro', city: 'Caruaru', state: 'PE', postalCode: '55002-410', formatted: 'Avenida Cleto Campelo, 9, Centro, Caruaru, PE' },
    coordinates: { latitude: -8.283215, longitude: -35.967374 }, ...fixedDropoff(['portable-battery', 'lamp']), accepts: ['batteries', 'lamps'],
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['assai', 'recicla-Caruaru'],
      notes: 'A página oficial da loja cita coletor de pilhas e baterias e coletor de lâmpadas. O operador de logística reversa informa a coordenada e registra o bairro como Nossa Senhora das Dores.',
    },
  },
  {
    id: 'atacadao-caruaru-polo', slug: 'atacadao-caruaru-polo', name: 'Atacadão Caruaru Polo',
    address: { street: 'Rodovia BR-104, km 62', district: 'Nova Caruaru', city: 'Caruaru', state: 'PE', formatted: 'Rodovia BR-104, km 62, Nova Caruaru, Caruaru, PE' },
    coordinates: { latitude: -8.241749, longitude: -35.981512 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['recicla-Caruaru'],
      notes: 'O operador lista a unidade da BR-104. A outra loja da rede em Caruaru não entrou no cadastro por divergência de coordenada na fonte.',
    },
  },
  {
    id: 'kalunga-caruaru', slug: 'kalunga-caruaru', name: 'Kalunga, Caruaru Shopping',
    address: { street: 'Avenida Adjar da Silva Casé', number: '800', district: 'Indianópolis', city: 'Caruaru', state: 'PE', formatted: 'Avenida Adjar da Silva Casé, 800, Indianópolis, Caruaru, PE' },
    coordinates: { latitude: -8.29212, longitude: -35.944745 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['recicla-Caruaru'],
      notes: 'Loja dentro do shopping. Procure o coletor na loja, não na administração do centro comercial.',
    },
  },
  {
    id: 'sesc-arcoverde', slug: 'sesc-arcoverde', name: 'Sesc Arcoverde',
    address: { street: 'Rua Capitão Arlindo Pacheco', number: '364', district: 'Centro', city: 'Arcoverde', state: 'PE', formatted: 'Rua Capitão Arlindo Pacheco, 364, Centro, Arcoverde, PE' },
    coordinates: { latitude: -8.421691, longitude: -37.055984 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['recicla-Arcoverde', 'sesc-pe'],
      notes: 'Rua e número coincidem entre o operador de logística reversa e o registro de unidades do Sesc. Arcoverde fica no limite oeste da cobertura, fora do Agreste Meridional.',
    },
  },
  {
    id: 'sindicato-rural-panelas', slug: 'sindicato-rural-panelas', name: 'Sindicato dos Trabalhadores Rurais, Panelas',
    address: { street: 'Avenida Dom Moura', number: '16', district: 'Centro', city: 'Panelas', state: 'PE', formatted: 'Avenida Dom Moura, 16, Centro, Panelas, PE' },
    coordinates: { latitude: -8.664276, longitude: -36.004233 }, ...fixedDropoff(['portable-battery']), accepts: ['batteries'],
    verification: {
      status: 'verified', verifiedAt: '2026-09-18', sources: ['recicla-Panelas'],
      notes: 'Entidade sindical, não comércio. O horário de atendimento ao público não foi confirmado.',
    },
  },
  {
    id: 'coleta-seletiva-caruaru', slug: 'coleta-seletiva-caruaru', name: 'Coleta Seletiva, Caruaru',
    attendance: {
      type: 'pickup_service',
      serviceArea: { city: 'Caruaru', state: 'PE', description: 'Retirada em endereço informado no município de Caruaru; a cobertura do endereço deve ser confirmada no portal.' },
      actionUrl: 'https://servicos.caruaru.pe.gov.br/portal/',
      channelInstructions: 'No Portal do Cidadão, escolha “Coleta Seletiva”. A prefeitura exige identificação, telefone, endereço e foto; o canal oficial pode solicitar login ou cadastro.',
    },
    accepts: ['electronics', 'appliances', 'bulky_items'],
    practicalInfo: {
      acceptedItemIds: ['generic-equipment', 'generic-appliance', 'generic-furniture'],
      accessInstructions: 'Separe os materiais antes da retirada e informe o endereço completo do domicílio.',
      appointment: 'required',
      officialContact: { url: 'https://servicos.caruaru.pe.gov.br/portal/' },
      verificationMethod: 'official_service_portal',
    },
    verification: {
      status: 'verified', verifiedAt: '2026-09-17', sources: ['caruaru-services'],
      notes: 'A fonte confirma equipamentos, eletrodomésticos, móveis e itens similares em termos amplos. Ela não confirma cada objeto específico, gratuidade, prazo ou todos os bairros.',
    },
  },
  {
    id: 'cata-treco-caruaru', slug: 'cata-treco-caruaru', name: 'Cata-Treco, Caruaru',
    attendance: {
      type: 'pickup_service',
      serviceArea: { city: 'Caruaru', state: 'PE', description: 'Retirada em endereço informado no município de Caruaru; a cobertura do endereço deve ser confirmada no portal.' },
      actionUrl: 'https://servicos.caruaru.pe.gov.br/portal/',
      channelInstructions: 'No Portal do Cidadão, escolha “Cata-Treco”. A prefeitura exige identificação, telefone, endereço e foto; o canal oficial pode solicitar login ou cadastro.',
    },
    accepts: ['electronics', 'appliances', 'bulky_items'],
    practicalInfo: {
      acceptedItemIds: ['generic-equipment', 'generic-appliance', 'generic-furniture'],
      accessInstructions: 'Separe previamente os itens e informe o endereço completo para a retirada.',
      officialContact: { url: 'https://servicos.caruaru.pe.gov.br/portal/' },
      verificationMethod: 'official_service_portal',
    },
    verification: {
      status: 'verified', verifiedAt: '2026-09-17', sources: ['caruaru-services'],
      notes: 'A fonte confirma equipamentos, eletrodomésticos, móveis e similares em termos amplos. Ela não informa agendamento, gratuidade, prazo, limites nem todos os bairros.',
    },
  },
]

export const collectionPoints = validateDataset(points, sourceRegistry)
