import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { purgeExpiredWorkspaceData } from '../services/workspaceCleanup.js'

await connectDatabase()
try { console.log(JSON.stringify(await purgeExpiredWorkspaceData(), null, 2)) }
finally { await disconnectDatabase() }
