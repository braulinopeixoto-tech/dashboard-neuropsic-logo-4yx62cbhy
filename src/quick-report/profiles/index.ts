import type { NeurofunctionalContext } from '../types'
import { renderClinicalProfile } from './clinical-profile'
import { renderEvolutionProfile } from './evolution-profile'
import { renderFamilyProfile } from './family-profile'
import { renderLegalProfile } from './legal-profile'
import { renderSchoolProfile } from './school-profile'
import type { ProfileRenderContext, ProfileRenderOptions } from './profile-types'

export * from './profile-types'
export * from './clinical-profile'
export * from './family-profile'
export * from './legal-profile'
export * from './school-profile'
export * from './evolution-profile'

export function renderProfiledReport(context: NeurofunctionalContext, options: ProfileRenderOptions): string {
  const profileContext = context as ProfileRenderContext

  switch (options.profile) {
    case 'family':
      return renderFamilyProfile(profileContext)
    case 'legal':
      return renderLegalProfile(profileContext)
    case 'school':
      return renderSchoolProfile(profileContext)
    case 'evolution':
      return renderEvolutionProfile(profileContext)
    case 'clinical':
    default:
      return renderClinicalProfile(profileContext)
  }
}
