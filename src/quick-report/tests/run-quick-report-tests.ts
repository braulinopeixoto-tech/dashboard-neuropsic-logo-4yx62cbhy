import { runQuickReportProfileTests } from './quick-report-profiles.test'
import { runQuickReportProductionReadinessTest } from './quick-report-production-readiness.test'
import { runQuickReportSmokeTests } from './quick-report.test'

runQuickReportSmokeTests()
runQuickReportProfileTests()
runQuickReportProductionReadinessTest()

console.log('Quick Report checks passed.')
