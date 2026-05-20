import { runQuickReportProfileTests } from './quick-report-profiles.test'
import { runQuickReportProductionReadinessTest } from './quick-report-production-readiness.test'
import { runQuickReportRawParserTests } from './quick-report-raw-parser.test'
import { runQuickReportSmokeTests } from './quick-report.test'
import { runQuickReportUiAdapterTests } from './quick-report-ui-adapter.test'

runQuickReportSmokeTests()
runQuickReportProfileTests()
runQuickReportProductionReadinessTest()
runQuickReportRawParserTests()
runQuickReportUiAdapterTests()

console.log('Quick Report checks passed.')
