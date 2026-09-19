import { useEffect, useState } from 'react'
import { localDate } from '../domain/point-query'

export function useCurrentDate() {
  const [today, setToday] = useState(localDate)
  useEffect(() => {
    let timer = 0
    const refresh = () => {
      window.clearTimeout(timer)
      setToday(localDate())
      const now = new Date()
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = window.setTimeout(refresh, nextDay.getTime() - now.getTime() + 1000)
    }
    const onVisibility = () => { if (!document.hidden) refresh() }
    refresh()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])
  return today
}
