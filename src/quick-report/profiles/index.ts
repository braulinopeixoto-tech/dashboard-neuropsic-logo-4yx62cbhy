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

export function renderProfiledReport(context: ProfileRenderContext, options: ProfileRenderOptions): string {
  switch (options.profile) {
    case 'family':
      return renderFamilyProfile(context)
    case 'legal':
      return renderLegalProfile(context)
    case 'school':
      return renderSchoolProfile(context)
    case 'evolution':
      return renderEvolutionProfile(context)
    case 'clinical':
    default:
      return renderClinicalProfile(context)
  }
}
