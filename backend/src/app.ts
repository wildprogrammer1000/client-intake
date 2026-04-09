import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { healthRouter } from './routes/health.js'
import { inquiryRouter } from './routes/inquiries.js'
import { uploadRouter } from './routes/uploads.js'

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? [
      'http://localhost:5173',
    ],
  }),
)
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    service: 'client-intake-backend',
    message: 'Backend API is running',
  })
})

app.use('/health', healthRouter)
app.use('/api/inquiries', inquiryRouter)
app.use('/api/uploads', uploadRouter)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)
  return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' })
})
