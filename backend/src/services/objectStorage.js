import crypto from 'node:crypto'
import env from '../config/env.js'

const encodeKey = (key) => key.split('/').map(encodeURIComponent).join('/')
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest()
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

export function objectStorageReady() {
  return env.objectStorageEnabled && Boolean(env.s3Endpoint && env.s3Bucket && env.s3AccessKeyId && env.s3SecretAccessKey)
}

export function immutableObjectKey(projectSlug, checksum, relativePath) {
  return `projects/${projectSlug}/${checksum}/${relativePath.replace(/\\/g, '/')}`
}

export function publicObjectUrl(storageKey) {
  if (!env.s3PublicBaseUrl) return ''
  return `${env.s3PublicBaseUrl.replace(/\/$/, '')}/${encodeKey(storageKey)}`
}

export function createPresignedPutUrl(storageKey, expiresInSeconds = 900) {
  if (!objectStorageReady()) throw new Error('Object storage is not configured.')
  const endpoint = new URL(env.s3Endpoint)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const scope = `${dateStamp}/${env.s3Region}/s3/aws4_request`
  // Some S3-compatible providers, including Supabase Storage, expose their S3
  // API below a path such as /storage/v1/s3. Preserve that path when signing.
  const endpointPath = endpoint.pathname.replace(/\/$/, '')
  const pathname = `${endpointPath}/${encodeURIComponent(env.s3Bucket)}/${encodeKey(storageKey)}`
  const query = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${env.s3AccessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  })
  const canonicalQuery = [...query.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
  const canonicalRequest = `PUT\n${pathname}\n${canonicalQuery}\nhost:${endpoint.host}\n\nhost\nUNSIGNED-PAYLOAD`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${env.s3SecretAccessKey}`, dateStamp), env.s3Region), 's3'), 'aws4_request')
  query.set('X-Amz-Signature', crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex'))
  return `${endpoint.origin}${pathname}?${query.toString()}`
}

export function createPresignedGetUrl(storageKey, expiresInSeconds = env.privateUrlExpiresSeconds) {
  if (!objectStorageReady()) throw new Error('Object storage is not configured.')
  const endpoint = new URL(env.s3Endpoint)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const scope = `${dateStamp}/${env.s3Region}/s3/aws4_request`
  const endpointPath = endpoint.pathname.replace(/\/$/, '')
  const pathname = `${endpointPath}/${encodeURIComponent(env.s3Bucket)}/${encodeKey(storageKey)}`
  const query = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${env.s3AccessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  })
  const canonicalQuery = [...query.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
  const canonicalRequest = `GET\n${pathname}\n${canonicalQuery}\nhost:${endpoint.host}\n\nhost\nUNSIGNED-PAYLOAD`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${env.s3SecretAccessKey}`, dateStamp), env.s3Region), 's3'), 'aws4_request')
  query.set('X-Amz-Signature', crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex'))
  return `${endpoint.origin}${pathname}?${query.toString()}`
}

export function createPresignedDeleteUrl(storageKey, expiresInSeconds = 300) {
  if (!objectStorageReady()) throw new Error('Object storage is not configured.')
  const endpoint = new URL(env.s3Endpoint)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const scope = `${dateStamp}/${env.s3Region}/s3/aws4_request`
  const endpointPath = endpoint.pathname.replace(/\/$/, '')
  const pathname = `${endpointPath}/${encodeURIComponent(env.s3Bucket)}/${encodeKey(storageKey)}`
  const query = new URLSearchParams({ 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256', 'X-Amz-Credential': `${env.s3AccessKeyId}/${scope}`, 'X-Amz-Date': amzDate, 'X-Amz-Expires': String(expiresInSeconds), 'X-Amz-SignedHeaders': 'host' })
  const canonicalQuery = [...query.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
  const canonicalRequest = `DELETE\n${pathname}\n${canonicalQuery}\nhost:${endpoint.host}\n\nhost\nUNSIGNED-PAYLOAD`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${env.s3SecretAccessKey}`, dateStamp), env.s3Region), 's3'), 'aws4_request')
  query.set('X-Amz-Signature', crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex'))
  return `${endpoint.origin}${pathname}?${query.toString()}`
}
