import dotenv from 'dotenv'

dotenv.config()

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/gameflow',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  seedOnStart: String(process.env.SEED_ON_START ?? 'true').toLowerCase() === 'true',
  authTokenSecret: process.env.AUTH_TOKEN_SECRET ?? 'gameflow-dev-auth-secret',
  redisUrl: process.env.REDIS_URL ?? '',
}

export default env
