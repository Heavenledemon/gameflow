import User from '../models/User.js'
import asyncHandler from '../middlewares/asyncHandler.js'
import { generateToken } from '../utils/generateToken.js'
import Follow from '../models/Follow.js'
import Project from '../models/Project.js'
import FeedItem from '../models/FeedItem.js'
import PostComment from '../models/PostComment.js'
import { OAuth2Client } from 'google-auth-library'
import env from '../config/env.js'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7
const googleClient = new OAuth2Client()

function createError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    name: user.name,
    headline: user.headline,
    skills: user.skills,
    avatar: user.avatar,
    banner: user.banner,
    isVerified: user.isVerified,
    bio: user.bio || '',
    description: user.description || '',
    location: user.location || '',
    website: user.website || '',
    creatorType: user.creatorType || 'Game Developer',
    github: user.github || '',
    itchio: user.itchio || '',
    behance: user.behance || '',
    artstation: user.artstation || '',
    instagram: user.instagram || '',
    linkedin: user.linkedin || '',
    companionType: user.companionType || 'cosmic',
    companionMotion: user.companionMotion || 'subtle',
    companionEmotion: user.companionEmotion || 'natural',
    companionBubble: user.companionBubble || 'work',
    companionBubbleText: user.companionBubbleText || '',
    companionBubbleBehavior: user.companionBubbleBehavior || 'once',
    profileDisplayType: user.profileDisplayType || 'companion',
    profileDesignType: user.profileDesignType || 'bauhaus',
    profileDesignPalette: user.profileDesignPalette || 'midnight',
    profileDesignDensity: user.profileDesignDensity || 'balanced',
    profileDesignLineStyle: user.profileDesignLineStyle || 'clean',
    profileDesignMotion: user.profileDesignMotion || 'subtle',
    profileDesignInteraction: user.profileDesignInteraction || 'rearrange',
    profileDesignDoodleTheme: user.profileDesignDoodleTheme || 'Developer',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function buildAuthPayload(user) {
  const expiresAt = Date.now() + SESSION_DURATION_MS

  return {
    token: generateToken({
      sub: String(user._id),
      exp: expiresAt,
    }),
    user: sanitizeUser(user),
    expiresAt,
  }
}

export const signupUser = asyncHandler(async (request, response) => {
  const { email, username, name, password } = request.body ?? {}

  if (!String(email).trim()) {
    throw createError(400, 'Email is required.')
  }

  if (!String(username).trim()) {
    throw createError(400, 'Username is required.')
  }

  if (!String(name).trim()) {
    throw createError(400, 'Name is required.')
  }

  if (!String(password)) {
    throw createError(400, 'Password is required.')
  }

  if (String(password).length < 8) {
    throw createError(400, 'Password must be at least 8 characters long.')
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedUsername = String(username).trim().toLowerCase()

  const existingEmailUser = await User.findOne({ email: normalizedEmail }).lean()

  if (existingEmailUser) {
    throw createError(409, 'An account with that email already exists.')
  }

  const existingUsernameUser = await User.findOne({ username: normalizedUsername }).lean()

  if (existingUsernameUser) {
    throw createError(409, 'That username is already taken.')
  }

  const user = await User.create({
    email: normalizedEmail,
    username: normalizedUsername,
    name: String(name).trim(),
    password,
  })

  response.status(201).json(buildAuthPayload(user))
})

export const signinUser = asyncHandler(async (request, response) => {
  const { username, password } = request.body ?? {}

  if (!String(username).trim() || !String(password)) {
    throw createError(400, 'Username and password are required.')
  }

  const user = await User.findOne({ username: String(username).trim().toLowerCase() })

  if (!user) {
    throw createError(401, 'Invalid username or password.')
  }

  const passwordMatches = await user.matchPassword(password)

  if (!passwordMatches) {
    throw createError(401, 'Invalid username or password.')
  }

  response.json(buildAuthPayload(user))
})

async function createAvailableUsername(name, googleId) {
  const base = String(name || 'creator')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20) || 'creator'
  const suffix = String(googleId).slice(-6).toLowerCase()

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const username = attempt === 0 ? `${base}_${suffix}` : `${base}_${suffix}${attempt}`
    if (!(await User.exists({ username }))) return username
  }

  return `creator_${String(googleId).toLowerCase()}`
}

export const signinWithGoogle = asyncHandler(async (request, response) => {
  const { credential } = request.body ?? {}

  if (!env.googleClientId) {
    throw createError(503, 'Google sign-in is not configured on the server.')
  }

  if (!String(credential).trim()) {
    throw createError(400, 'Google credential is required.')
  }

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: String(credential),
      audience: env.googleClientId,
    })
    payload = ticket.getPayload()
  } catch {
    throw createError(401, 'Google could not verify this sign-in.')
  }

  if (!payload?.sub || !payload?.email || !payload.email_verified) {
    throw createError(401, 'Google did not provide a verified email address.')
  }

  const email = String(payload.email).trim().toLowerCase()
  let user = await User.findOne({ googleId: payload.sub })

  if (!user) {
    user = await User.findOne({ email })

    if (user) {
      const googleIsAuthoritative = email.endsWith('@gmail.com') || Boolean(payload.hd)
      if (!googleIsAuthoritative) {
        throw createError(409, 'Sign in with your password first before connecting this Google account.')
      }

      user.googleId = payload.sub
      user.authProviders = [...new Set([...(user.authProviders || ['password']), 'google'])]
      if (!user.avatar && payload.picture) user.avatar = String(payload.picture)
      await user.save()
    } else {
      user = await User.create({
        email,
        username: await createAvailableUsername(payload.name, payload.sub),
        name: String(payload.name || email.split('@')[0]).trim(),
        avatar: String(payload.picture || ''),
        googleId: payload.sub,
        authProviders: ['google'],
      })
    }
  }

  response.json(buildAuthPayload(user))
})

export const getCurrentUser = asyncHandler(async (request, response) => {
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ followingId: request.user._id }),
    Follow.countDocuments({ followerId: request.user._id }),
  ])
  response.json({
    user: { ...sanitizeUser(request.user), followersCount, followingCount },
  })
})

export const updateCurrentUserProfile = asyncHandler(async (request, response) => {
  const {
    email, username, name, headline, skills, avatar, banner, bio, description, location, website,
    creatorType, github, itchio, behance, artstation, instagram, linkedin, companionType, companionMotion, companionEmotion, companionBubble, companionBubbleText, companionBubbleBehavior, profileDisplayType, profileDesignType, profileDesignPalette, profileDesignDensity, profileDesignLineStyle, profileDesignMotion, profileDesignInteraction, profileDesignDoodleTheme
  } = request.body ?? {}

  if (name !== undefined && !String(name).trim()) {
    throw createError(400, 'Name cannot be empty.')
  }

  if (email !== undefined && !String(email).trim()) {
    throw createError(400, 'Email cannot be empty.')
  }

  if (username !== undefined && !String(username).trim()) {
    throw createError(400, 'Username cannot be empty.')
  }

  const user = await User.findById(request.user._id)

  if (!user) {
    throw createError(404, 'User not found.')
  }

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase()

    if (normalizedEmail !== user.email) {
      const existingEmailUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).lean()

      if (existingEmailUser) {
        throw createError(409, 'An account with that email already exists.')
      }
    }

    user.email = normalizedEmail
  }

  if (username !== undefined) {
    const normalizedUsername = String(username).trim().toLowerCase()

    if (normalizedUsername !== user.username) {
      const existingUsernameUser = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      }).lean()

      if (existingUsernameUser) {
        throw createError(409, 'That username is already taken.')
      }
    }

    user.username = normalizedUsername
  }

  if (name !== undefined) user.name = String(name).trim()
  if (headline !== undefined) user.headline = String(headline).trim()
  if (skills !== undefined) {
    user.skills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim()).filter(Boolean)
      : []
  }
  if (avatar !== undefined) user.avatar = String(avatar)
  if (banner !== undefined) user.banner = String(banner)
  if (bio !== undefined) user.bio = String(bio).trim()
  if (description !== undefined) user.description = String(description).trim()
  if (location !== undefined) user.location = String(location).trim()
  if (website !== undefined) user.website = String(website).trim()
  if (creatorType !== undefined) user.creatorType = String(creatorType).trim()
  if (github !== undefined) user.github = String(github).trim()
  if (itchio !== undefined) user.itchio = String(itchio).trim()
  if (behance !== undefined) user.behance = String(behance).trim()
  if (artstation !== undefined) user.artstation = String(artstation).trim()
  if (instagram !== undefined) user.instagram = String(instagram).trim()
  if (linkedin !== undefined) user.linkedin = String(linkedin).trim()
  if (companionType !== undefined) user.companionType = String(companionType).trim()
  if (companionMotion !== undefined) user.companionMotion = String(companionMotion).trim()
  if (companionEmotion !== undefined) user.companionEmotion = String(companionEmotion).trim()
  if (companionBubble !== undefined) user.companionBubble = String(companionBubble).trim()
  if (companionBubbleText !== undefined) user.companionBubbleText = String(companionBubbleText).trim().slice(0, 35)
  if (companionBubbleBehavior !== undefined) user.companionBubbleBehavior = String(companionBubbleBehavior).trim()
  if (profileDisplayType !== undefined) user.profileDisplayType = String(profileDisplayType).trim()
  if (profileDesignType !== undefined) user.profileDesignType = String(profileDesignType).trim()
  if (profileDesignPalette !== undefined) user.profileDesignPalette = String(profileDesignPalette).trim()
  if (profileDesignDensity !== undefined) user.profileDesignDensity = String(profileDesignDensity).trim()
  if (profileDesignLineStyle !== undefined) user.profileDesignLineStyle = String(profileDesignLineStyle).trim()
  if (profileDesignMotion !== undefined) user.profileDesignMotion = String(profileDesignMotion).trim()
  if (profileDesignInteraction !== undefined) user.profileDesignInteraction = String(profileDesignInteraction).trim()
  if (profileDesignDoodleTheme !== undefined) user.profileDesignDoodleTheme = String(profileDesignDoodleTheme).trim()

  await user.save()

  // Keep legacy denormalized author snapshots consistent while all read APIs
  // also hydrate from User as the authoritative profile source.
  await Promise.all([
    Project.updateMany({ ownerId: user._id }, { $set: { ownerUsername: user.username, ownerName: user.name, ownerAvatar: user.avatar || '' } }),
    FeedItem.updateMany({ 'creator.id': String(user._id) }, { $set: { 'creator.username': user.username, 'creator.name': user.name, 'creator.avatarUrl': user.avatar || '' } }),
    PostComment.updateMany({ userId: user._id }, { $set: { username: user.username, name: user.name, avatar: user.avatar || '' } }),
  ])

  response.json({
    message: 'Profile updated successfully',
    user: sanitizeUser(user),
  })
})
