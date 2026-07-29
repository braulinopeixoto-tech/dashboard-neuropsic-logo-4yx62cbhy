# DNDA Expert Dashboard — native Skip repository port

Date: 2026-07-29
Repository: `dashboard-neuropsic-logo-4yx62cbhy`
Route: `/quick-report`

## Integration decision

The source candidate from `neurostrata-lisuga2ct` could not be copied
verbatim because this repository has a different canonical architecture. Its
Quick Report uses the existing NQL engine and PocketBase persistence.

The port therefore preserves the current `QuickReport` implementation and
adds:

- a Neuropsychologist Expert Review dashboard wrapper;
- explicit runtime truth;
- AI Trust capability summary;
- a complete local AuditTrace review panel;
- mandatory human approval before PocketBase persistence;
- rejection without discarding the generated preview.

## Runtime truth

| Capability | Actual state |
|---|---|
| Raw/NQL parsing | Implemented |
| Neurofunctional report generation | Deterministic local engine |
| Safety Guard | Implemented |
| Input fingerprint | Implemented |
| AuditTrace | Implemented |
| Human approve/reject | Implemented in this port |
| Real LLM | Not demonstrated |
| Real vector retrieval | Not demonstrated |
| Production deployment | Not performed |

No deterministic or mocked behavior may be reported as evidence of a real LLM
or real retrieval.
