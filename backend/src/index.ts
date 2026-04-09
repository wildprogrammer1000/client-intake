import dotenv from 'dotenv'
import { app } from './app.js'

dotenv.config()

const port = Number(process.env.PORT ?? 4000)

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${port}`)
})
