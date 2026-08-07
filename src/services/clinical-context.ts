import pb from '@/lib/pocketbase/client'
import type { QuickReportInput } from '@/quick-report'
import type {
  ClinicalContextSnapshot,
  ClinicalContextSource,
} from '@/features/clinical-records/canonical-contract'

type ContextAssemblyResult = {
  enrichedInput: QuickReportInput
  snapshot: ClinicalContextSnapshot
}

function compact(values: Array<unknown>): string[] {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
}

function source(collection: string, records: Array<{ id: string }>): ClinicalContextSource {
  return {
    collection,
    recordIds: records.map((record) => record.id),
    count: records.length,
  }
}

export async function assemblePatientClinicalContext(
  patientId: string,
  userId: string,
  input: QuickReportInput,
): Promise<ContextAssemblyResult> {
  const patient = await pb.collection('pacientes').getOne(patientId)
  if (patient.usuario_id !== userId) {
    throw new Error('O paciente selecionado não pertence ao contexto autenticado.')
  }

  const patientFilter = pb.filter('paciente_id = {:patientId}', { patientId })
  const [anamneses, dndas, protocolos, sessoes, alertas, summaries] = await Promise.all([
    pb.collection('anamneses').getFullList({ filter: patientFilter, sort: '-created' }),
    pb.collection('dnda_schema').getFullList({ filter: patientFilter, sort: '-created' }),
    pb.collection('protocolos').getFullList({ filter: patientFilter, sort: '-created' }),
    pb.collection('sessoes').getFullList({ filter: patientFilter, sort: '-created' }),
    pb.collection('alertas').getFullList({ filter: patientFilter, sort: '-created' }),
    pb.collection('ai_summaries').getFullList({ filter: patientFilter, sort: '-created' }),
  ])

  const latestAnamnesis = anamneses[0]
  const latestDnda = dndas[0]
  const sources = [
    source('pacientes', [patient]),
    source('anamneses', anamneses),
    source('dnda_schema', dndas),
    source('protocolos', protocolos),
    source('sessoes', sessoes),
    source('alertas', alertas),
    source('ai_summaries', summaries),
  ]
  const limitations: string[] = []

  if (!latestAnamnesis) limitations.push('Nenhuma anamnese longitudinal foi localizada.')
  if (!latestDnda) limitations.push('Nenhum DNDA versionado foi localizado.')
  if (summaries.length === 0)
    limitations.push('Nenhuma memória profissional aprovada foi localizada.')

  const enrichedInput: QuickReportInput = {
    ...input,
    patient: {
      ...input.patient,
      name: patient.nome || input.patient.name,
      birthDate: patient.data_nascimento || input.patient.birthDate,
    },
    complaint: compact([
      ...input.complaint,
      patient.queixa_principal,
      latestAnamnesis?.queixa_estruturada?.resumo,
    ]),
    clinicalHistory: compact([
      ...(input.clinicalHistory || []),
      patient.historico_medico,
      patient.medicacoes_atuais
        ? `Medicações registradas no prontuário: ${patient.medicacoes_atuais}`
        : '',
      latestAnamnesis?.historia_resumo,
      latestDnda?.classification
        ? `DNDA registrado: ${latestDnda.classification}; risco ${latestDnda.risk_level || 'não informado'}`
        : '',
      ...sessoes.slice(0, 5).map((item) => item.observacoes),
    ]),
    recommendationsRaw: compact([
      ...(input.recommendationsRaw || []),
      ...protocolos
        .filter((item) => item.status)
        .map((item) => `Protocolo ${item.tipo || 'clínico'}: ${item.status}`),
      ...alertas.filter((item) => !item.lido).map((item) => `Alerta registrado: ${item.mensagem}`),
    ]),
  }

  return {
    enrichedInput,
    snapshot: {
      patientId,
      assembledAt: new Date().toISOString(),
      sourceIds: sources.flatMap((item) => item.recordIds),
      sources,
      limitations,
    },
  }
}
