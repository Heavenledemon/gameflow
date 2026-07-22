/**
 * Reviewable mapper contract. These are documentation records, not runtime
 * fixtures, and this module is not imported by production UI.
 *
 * Alias precedence:
 * - Identity: feedId -> id -> _id -> resolved contentId.
 * - Feed contentId: explicit contentId -> everything after the first `:` in
 *   feedId -> id/_id. Additional colons in an identifier remain intact.
 * - Project ID: explicit projectId -> project id/_id -> feed contentId only
 *   when the server content type is project.
 * - Poster: media.posterUrl -> posterUrl -> previewUrl -> loadingScreenUrl -> thumbnail.
 * - Image: media.imageUrl -> imageUrl -> previewUrl -> fixture image -> thumbnail.
 * - Playable build: media.manifestUrl -> media.gameUrl -> gameUrl -> manifestUrl.
 * - Model: media.modelUrl -> modelUrl.
 * - Engagement: nested engagement fields -> root aliases; viewerHasLiked and
 *   viewerHasSaved precede isLiked and isSaved.
 * - Collaboration uses only explicit collaborationOpen/open and viewerRole.
 *
 * Media rules:
 * - 2d/image -> image; game/webgl -> webgl; asset/3d/gltf/glb -> gltf.
 * - Missing declared heavy sources are recorded in diagnostics. A real poster
 *   may remain a safe image preview, but is never presented as interactive.
 * - Conflicting playable sources and unsupported/missing media return unknown.
 */
export const PROJECT_CARD_MODEL_CASES = Object.freeze([
  'Feed IDs containing additional colons retain the complete mutation identifier.',
  'Project detail preserves owner, viewer-role, and collaboration-open fields.',
  'Profile game/asset items retain raw content IDs and poster-first media.',
  'Discover fixture fields map to image-only cards without becoming live data.',
  'Creator fixture numeric IDs and shorthand counts normalize deterministically.',
  'Malformed heavy media returns a safe poster or unknown state with diagnostics.',
  'Unknown and missing media always remain observable through diagnostics.',
])
