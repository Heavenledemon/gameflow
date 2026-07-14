function enabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
}

export const flags = Object.freeze({
  reelFeedV2: enabled(import.meta.env.VITE_REEL_FEED_V2_ENABLED),
  reelVirtualization: enabled(import.meta.env.VITE_REEL_VIRTUALIZATION_ENABLED),
  realtimeOutboxWorker: enabled(import.meta.env.VITE_REALTIME_OUTBOX_WORKER_ENABLED),
  objectStorage: enabled(import.meta.env.VITE_OBJECT_STORAGE_ENABLED),
})

