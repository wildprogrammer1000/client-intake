import dotenv from 'dotenv'
import { app } from './app.js'
import { assertRequiredEnv } from './lib/requiredEnv.js'

dotenv.config()
assertRequiredEnv(['AWS_REGION', 'AWS_S3_BUCKET'])

const port = Number(process.env.PORT ?? 4000)

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${port}`)
})
