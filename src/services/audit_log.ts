import pb from '@/lib/pocketbase/client'

export const getAuditLogs = async (
  filters: { entity_type?: string; author_id?: string; startDate?: string; endDate?: string } = {},
) => {
  let filterStr = []
  if (filters.entity_type) filterStr.push(`entity_type="${filters.entity_type}"`)
  if (filters.author_id) filterStr.push(`author_id="${filters.author_id}"`)
  if (filters.startDate) filterStr.push(`timestamp >= "${filters.startDate}"`)
  if (filters.endDate) filterStr.push(`timestamp <= "${filters.endDate}"`)

  return await pb.collection('audit_log').getFullList({
    filter: filterStr.join(' && '),
    sort: '-timestamp',
    expand: 'author_id',
  })
}

export const getEntityAuditLogs = async (entity_type: string, entity_id: string) => {
  return await pb.collection('audit_log').getFullList({
    filter: `entity_type="${entity_type}" && entity_id="${entity_id}"`,
    sort: '-timestamp',
    expand: 'author_id',
  })
}

export const sealAuditLog = async (data: {
  user_id: string
  event_type: 'login' | 'vital_score' | 'acesso_prontuario'
  action_description: string
  payload?: any
}) => {
  return await pb.send('/backend/v1/seal_audit_log', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pb.authStore.token}`,
    },
  })
}
