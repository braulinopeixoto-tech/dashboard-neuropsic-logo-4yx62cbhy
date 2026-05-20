import type { ProfileRenderContext } from './profile-types'

export function renderClinicalProfile(context: ProfileRenderContext): string {
  if (!context.clinicalMarkdown)
    throw new Error('Clinical profile requires the base clinical markdown.')
  return context.clinicalMarkdown
}
