export type GeolocationErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED' | 'UNKNOWN'
export function geolocationErrorCode(error: unknown): GeolocationErrorCode {
  if (error instanceof Error && error.message === 'GEOLOCATION_UNSUPPORTED') return 'UNSUPPORTED'
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === 1) return 'PERMISSION_DENIED'
    if (error.code === 2) return 'POSITION_UNAVAILABLE'
    if (error.code === 3) return 'TIMEOUT'
  }
  return 'UNKNOWN'
}
export const geolocationErrors: Record<GeolocationErrorCode, string> = {
  PERMISSION_DENIED: 'Não foi possível acessar sua localização. Você ainda pode consultar todos os pontos no mapa. Para tentar novamente, permita a localização nas configurações deste site no navegador.',
  POSITION_UNAVAILABLE: 'Seu dispositivo não conseguiu informar a localização agora.',
  TIMEOUT: 'A localização demorou mais que o esperado. Tente novamente ou continue usando o mapa.',
  UNSUPPORTED: 'Este navegador não oferece localização. Você pode consultar todos os pontos no mapa e na lista.',
  UNKNOWN: 'Não foi possível obter sua localização. Tente novamente ou continue usando o mapa.',
}
