import crypto from 'crypto'
import mongoose from 'mongoose'

const SALT_LENGTH = 16
const KEY_LENGTH = 64

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, { N: 16384 }, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required() {
        return !this.googleId
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProviders: {
      type: [String],
      enum: ['password', 'google'],
      default: ['password'],
    },
    headline: {
      type: String,
      default: '',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    creatorType: {
      type: String,
      enum: ['Web Developer', 'Game Developer', '2D Artist', '3D Artist'],
      default: 'Game Developer',
    },
    github: {
      type: String,
      default: '',
      trim: true,
    },
    itchio: {
      type: String,
      default: '',
      trim: true,
    },
    behance: {
      type: String,
      default: '',
      trim: true,
    },
    artstation: {
      type: String,
      default: '',
      trim: true,
    },
    instagram: {
      type: String,
      default: '',
      trim: true,
    },
    linkedin: {
      type: String,
      default: '',
      trim: true,
    },
    companionType: {
      type: String,
      enum: ['none', 'cosmic', 'mood', 'white-cat', 'pixel-cat', 'aurora'],
      default: 'cosmic',
    },
    companionMotion: {
      type: String,
      enum: ['off', 'subtle', 'playful'],
      default: 'subtle',
    },
    companionEmotion: {
      type: String,
      enum: ['off', 'natural', 'expressive'],
      default: 'natural',
    },
    companionBubble: {
      type: String,
      enum: ['off', 'greeting', 'building', 'work', 'custom'],
      default: 'work',
    },
    companionBubbleText: {
      type: String,
      default: '',
      trim: true,
      maxlength: 35,
    },
    companionBubbleBehavior: {
      type: String,
      enum: ['once', 'tap', 'always'],
      default: 'once',
    },
    profileDisplayType: {
      type: String,
      enum: ['none', 'companion', 'design'],
      default: 'companion',
    },
    profileDesignType: {
      type: String,
      enum: ['bauhaus', 'waves', 'doodles', 'botanicals', 'constellation', 'orbit', 'aurora'],
      default: 'bauhaus',
    },
    profileDesignPalette: {
      type: String,
      enum: ['midnight', 'coral', 'electric', 'sakura', 'botanical', 'monochrome', 'aurora', 'solar'],
      default: 'midnight',
    },
    profileDesignDensity: {
      type: String,
      enum: ['minimal', 'balanced', 'full'],
      default: 'balanced',
    },
    profileDesignLineStyle: {
      type: String,
      enum: ['clean', 'hand-drawn'],
      default: 'clean',
    },
    profileDesignMotion: {
      type: String,
      enum: ['off', 'subtle', 'playful', 'calm', 'dynamic'],
      default: 'subtle',
    },
    profileDesignInteraction: {
      type: String,
      enum: ['none', 'colors', 'rearrange', 'reveal', 'touch'],
      default: 'rearrange',
    },
    profileDesignDoodleTheme: {
      type: String,
      enum: ['Developer', 'Gamer', 'Artist', 'Music', 'General'],
      default: 'Developer',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

userSchema.pre('save', async function hashUserPassword() {
  if (!this.isModified('password') || !this.password) {
    return
  }

  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
  const derivedKey = await scryptAsync(this.password, salt)
  this.password = `${salt}:${derivedKey.toString('hex')}`
})

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  if (!this.password) {
    return false
  }

  const [salt, storedKey] = String(this.password).split(':')

  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = await scryptAsync(enteredPassword, salt)
  const storedBuffer = Buffer.from(storedKey, 'hex')

  if (storedBuffer.length !== derivedKey.length) {
    return false
  }

  return crypto.timingSafeEqual(storedBuffer, derivedKey)
}

const User = mongoose.model('User', userSchema)

export default User
