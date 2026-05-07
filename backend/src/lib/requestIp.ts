import type { Request } from 'express'

/** 클라이언트 IP (프록시 환경에서는 X-Forwarded-For 우선) */
export function getRequestClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    const first = forwarded.split(',')[0]?.trim()
    return first && first.length > 0 ? first : null
  }
  const socketIp = req.socket.remoteAddress
  return socketIp ?? null
}
