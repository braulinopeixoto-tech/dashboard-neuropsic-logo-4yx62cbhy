import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('real Skip Cloud agent runtime is wired without provider secrets', () => {
  const migration = read('pocketbase/migrations/0044_define_neurostrata_quick_report_agents.js')
  const hook = read('pocketbase/hooks/quick_report_expert_generate.js')
  const service = read('src/services/quick-report-expert.ts')

  assert.match(migration, /\$ai\.agents\.define/)
  assert.match(migration, /neurostrata-quick-report-expert/)
  assert.match(migration, /neurostrata-clinical-critic/)
  assert.match(hook, /\$ai\.agent\('neurostrata-quick-report-expert'\)\.chat/)
  assert.match(hook, /\$ai\.agent\('neurostrata-clinical-critic'\)\.chat/)
  assert.match(service, /expert-generate/)
  assert.doesNotMatch(migration + hook + service, /OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|sk-[A-Za-z0-9]/)
})

test('AI Trust and Clinical Commit remain review-gated and append-only', () => {
  const migration = read('pocketbase/migrations/0043_canonical_clinical_commit.js')
  const hook = read('pocketbase/hooks/canonical_quick_report_commit.js')

  assert.match(migration, /clinical_commit_events/)
  assert.match(migration, /updateRule: null/)
  assert.match(migration, /deleteRule: null/)
  assert.match(hook, /reviewDecision !== 'APPROVED'/)
  assert.match(hook, /previous_event_hash/)
  assert.match(hook, /\$security\.sha256/)
})
