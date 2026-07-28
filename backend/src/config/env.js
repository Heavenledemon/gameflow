import dotenv from 'dotenv'

dotenv.config()

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/gameflow',
  clientOrigin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').replace(/\/+$/, ''),
  seedOnStart: String(process.env.SEED_ON_START ?? 'true').toLowerCase() === 'true',
  authTokenSecret: process.env.AUTH_TOKEN_SECRET ?? 'gameflow-dev-auth-secret',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 15000),
  objectStorageEnabled: String(process.env.OBJECT_STORAGE_ENABLED ?? 'false').toLowerCase() === 'true',
  s3Endpoint: process.env.S3_ENDPOINT ?? '',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3Bucket: process.env.S3_BUCKET ?? '',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
  workspaceMaxFileBytes: Number(process.env.WORKSPACE_MAX_FILE_BYTES ?? 50 * 1024 * 1024),
  workspaceMaxProjectBytes: Number(process.env.WORKSPACE_MAX_PROJECT_BYTES ?? 150 * 1024 * 1024),
  workspaceMaxUserBytes: Number(process.env.WORKSPACE_MAX_USER_BYTES ?? 500 * 1024 * 1024),
  workspaceMaxProjectFiles: Number(process.env.WORKSPACE_MAX_PROJECT_FILES ?? 100),
  privateUrlExpiresSeconds: Number(process.env.PRIVATE_URL_EXPIRES_SECONDS ?? 300),
}

export default env
