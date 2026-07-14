function readBoolean(name, defaultValue = false) {
  const value = process.env[name]
  if (value === undefined) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase())
}

export const flags = Object.freeze({
  reelFeedV2: readBoolean('REEL_FEED_V2_ENABLED'),
  reelVirtualization: readBoolean('REEL_VIRTUALIZATION_ENABLED'),
  realtimeOutboxWorker: readBoolean('REALTIME_OUTBOX_WORKER_ENABLED'),
  objectStorage: readBoolean('OBJECT_STORAGE_ENABLED'),
})

