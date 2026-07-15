import ProjectMember from '../models/ProjectMember.js'

export const PROJECT_ROLES = ['owner', 'editor', 'contributor', 'viewer']

function sameId(left, right) {
  return left && right && String(left) === String(right)
}

export async function getProjectRole(project, userId) {
  if (!project || !userId) return null
  // ownerId remains the migration-safe authority until all legacy projects
  // have an owner ProjectMember record.
  if (sameId(project.ownerId, userId)) return 'owner'
  const member = await ProjectMember.findOne({ projectId: project._id, userId, status: 'active' }).select('role').lean()
  return member?.role ?? null
}

export async function hasProjectRole(project, userId, roles = PROJECT_ROLES) {
  const role = await getProjectRole(project, userId)
  return Boolean(role && roles.includes(role))
}

export async function canManageProject(project, userId) {
  return hasProjectRole(project, userId, ['owner', 'editor'])
}

export async function canViewProject(project, userId) {
  if (!project) return false
  if (project.visibility === 'public' && project.isPublished) return true
  return Boolean(await getProjectRole(project, userId))
}
