/**
 * discoverFixtures.js — Discovery Fixtures Source
 * Reference: GAMEFLOW_MOBILE_FIRST_UI_DESIGN_GUIDE.md — Section 8.2
 *
 * Explicit adapter source for discovery section fallbacks when API lists are unpopulated.
 * All items pass through toProjectCardModel.
 */
import { toProjectCardModel } from '../project/model/projectCardModel'

export const DISCOVER_FIXTURE_LABEL = 'Featured Collection'

export function getDiscoverSections(liveItems = []) {
  const normalizedLive = (liveItems || []).map((item) => toProjectCardModel(item))

  if (normalizedLive.length >= 4) {
    return {
      trending: normalizedLive.slice(0, 4),
      recent: normalizedLive.slice(4),
      isFixture: false,
    }
  }

  // Curated fallback items marked explicitly as fixture data
  const trendingFixtures = [
    toProjectCardModel({
      id: 'fix-1',
      title: 'Neon Odyssey',
      summary: 'Cyberpunk WebGL action racer built with Unity.',
      projectType: 'game',
      mediaKind: 'webgl',
      posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      gameUrl: 'https://example.com/neon',
      creator: { username: 'neon_studio', name: 'Neon Studio', avatarUrl: null },
      tools: ['Unity', 'C#'],
      tags: ['cyberpunk', 'racing', 'webgl'],
      likesCount: 1420,
    }),
    toProjectCardModel({
      id: 'fix-2',
      title: 'Mecha Sentinel 3D',
      summary: 'High-poly rigged 3D robot asset.',
      projectType: '3d-asset',
      mediaKind: 'gltf',
      posterUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      modelUrl: 'https://example.com/mecha.gltf',
      creator: { username: 'vortex_3d', name: 'Vortex 3D', avatarUrl: null },
      tools: ['Blender', 'Substance'],
      tags: ['robot', 'mecha', '3d-model'],
      likesCount: 890,
    }),
  ]

  return {
    trending: [...normalizedLive, ...trendingFixtures],
    recent: normalizedLive,
    isFixture: true,
  }
}
