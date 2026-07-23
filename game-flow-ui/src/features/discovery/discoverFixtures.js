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
    toProjectCardModel({
      id: 'fix-3',
      title: 'Chromatic Portrait',
      summary: 'Bold editorial portrait study and color exploration.',
      projectType: '2d-art',
      mediaKind: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&q=85',
      aspectRatio: '4 / 5',
      creator: { username: 'pixel_muse', name: 'Pixel Muse', avatarUrl: null },
      tools: ['Procreate', 'Photoshop'],
      tags: ['portrait', 'illustration', '2d'],
      likesCount: 760,
    }),
    toProjectCardModel({
      id: 'fix-4',
      title: 'Forest Shrine Environment',
      summary: 'Atmospheric environment concept for an adventure game.',
      projectType: '2d-art',
      mediaKind: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=85',
      aspectRatio: '3 / 4',
      creator: { username: 'luma_concepts', name: 'Luma Concepts', avatarUrl: null },
      tools: ['Photoshop', 'Blender'],
      tags: ['environment', 'concept-art', '2d'],
      likesCount: 1100,
    }),
    toProjectCardModel({
      id: 'fix-5',
      title: 'Arcade Arena',
      summary: 'Fast multiplayer arena prototype made in Unity.',
      projectType: 'game',
      mediaKind: 'webgl',
      posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&q=85',
      aspectRatio: '1 / 1',
      gameUrl: 'https://example.com/arcade-arena',
      creator: { username: 'playforge', name: 'Playforge', avatarUrl: null },
      tools: ['Unity', 'C#'],
      tags: ['arcade', 'multiplayer', 'game'],
      likesCount: 980,
    }),
    toProjectCardModel({
      id: 'fix-6',
      title: 'Sci-Fi Rover',
      summary: 'Production-ready hard-surface exploration vehicle.',
      projectType: '3d-asset',
      mediaKind: 'gltf',
      posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=85',
      aspectRatio: '4 / 5',
      modelUrl: 'https://example.com/rover.gltf',
      creator: { username: 'mesh_foundry', name: 'Mesh Foundry', avatarUrl: null },
      tools: ['Blender', 'Substance'],
      tags: ['vehicle', 'sci-fi', '3d'],
      likesCount: 640,
    }),
  ]

  return {
    trending: [...normalizedLive, ...trendingFixtures],
    recent: normalizedLive,
    isFixture: true,
  }
}
