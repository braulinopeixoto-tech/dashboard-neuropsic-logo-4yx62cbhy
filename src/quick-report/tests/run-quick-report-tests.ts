import { runQuickReportSmokeTests } from './quick-report.test'
import { runQuickReportUiAdapterTests } from './quick-report-ui-adapter.test'

runQuickReportSmokeTests()
runQuickReportUiAdapterTests()

console.log('Quick Report checks passed.')
