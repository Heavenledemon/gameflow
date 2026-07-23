/**
 * draftStorage.js — Safe Publish Draft Persistence
 * Reference: GAMEFLOW_MOBILE_FIRST_UI_DESIGN_GUIDE.md — Section 8.5
 *
 * Persists ONLY safe, serializable metadata to sessionStorage:
 * project type, title, description, tags, software/engine, platform.
 * NEVER persists File/Blob objects, object URLs, or authentication tokens.
 */

const STORAGE_KEY = 'gameflow:publish-draft:v2'

export const DEFAULT_PUBLISH_DRAFT = {
  type: 'game',
  mode: 'landscape',
  title: '',
  category: 'Action',
  description: '',
  tags: [],
  software: ['Blender'],
  visibility: 'public',
}

const allowedTypes = new Set(['game', '3d', '2d'])
const allowedModes = new Set(['portrait', 'landscape'])
const allowedVisibility = new Set(['public', 'private'])

export function loadPublishDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw || 'null')
    if (!parsed || typeof parsed !== 'object') return null

    return {
      ...DEFAULT_PUBLISH_DRAFT,
      type: allowedTypes.has(parsed.type) ? parsed.type : DEFAULT_PUBLISH_DRAFT.type,
      mode: allowedModes.has(parsed.mode) ? parsed.mode : DEFAULT_PUBLISH_DRAFT.mode,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      category: typeof parsed.category === 'string' ? parsed.category : DEFAULT_PUBLISH_DRAFT.category,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((val) => typeof val === 'string').slice(0, 30) : [],
      software: Array.isArray(parsed.software) ? parsed.software.filter((val) => typeof val === 'string').slice(0, 30) : DEFAULT_PUBLISH_DRAFT.software,
      visibility: allowedVisibility.has(parsed.visibility) ? parsed.visibility : DEFAULT_PUBLISH_DRAFT.visibility,
      hadFiles: parsed.hadFiles === true,
      fileCount: Number.isFinite(parsed.fileCount) ? Math.max(0, parsed.fileCount) : 0,
      hadCover: parsed.hadCover === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    }
  } catch {
    return null
  }
}

export function savePublishDraft(draft, fileState = {}) {
  const safeDraft = {
    type: draft.type,
    mode: draft.mode,
    title: draft.title,
    category: draft.category,
    description: draft.description,
    tags: [...(draft.tags || [])],
    software: [...(draft.software || [])],
    visibility: draft.visibility,
    hadFiles: Boolean(fileState.hadFiles),
    fileCount: Math.max(0, Number(fileState.fileCount) || 0),
    hadCover: Boolean(fileState.hadCover),
    updatedAt: new Date().toISOString(),
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeDraft))
  } catch {
    // Best-effort storage fallback
  }
}

export function clearPublishDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function hasMeaningfulPublishDraft(draft, fileState = {}) {
  return Boolean(
    draft.title.trim() ||
    draft.description.trim() ||
    draft.tags.length ||
    draft.type !== DEFAULT_PUBLISH_DRAFT.type ||
    fileState.hadFiles ||
    fileState.hadCover
  )
}
