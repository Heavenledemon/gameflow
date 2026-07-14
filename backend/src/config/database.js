import mongoose from 'mongoose'
import env from './env.js'
import { recordMongoMetric } from '../middlewares/observabilityMiddleware.js'

let queryTimingInstalled = false

function installQueryTiming() {
  if (queryTimingInstalled) return
  queryTimingInstalled = true
  const originalExec = mongoose.Query.prototype.exec
  mongoose.Query.prototype.exec = async function timedExec(...args) {
    const startedAt = Date.now()
    try {
      return await originalExec.apply(this, args)
    } finally {
      recordMongoMetric(Date.now() - startedAt)
    }
  }
}

export async function connectDatabase() {
  mongoose.set('strictQuery', true)
  installQueryTiming()
  await mongoose.connect(env.mongoUri)
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
