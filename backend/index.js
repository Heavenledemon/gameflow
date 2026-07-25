import app from './src/app.js'
import { connectDatabase } from './src/config/database.js'

// Vercel keeps warm function instances alive between requests. The database
// helper reuses that connection and also de-duplicates concurrent cold starts.
export default async function handler(request, response) {
  await connectDatabase()
  return app(request, response)
}
