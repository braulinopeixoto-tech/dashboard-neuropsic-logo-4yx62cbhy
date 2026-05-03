import pb from '@/lib/pocketbase/client'

export const getAuditLogsSystemList = async (
  page: number,
  perPage: number,
  filters: { event_type?: string; userName?: string; startDate?: string; endDate?: string } = {},
) => {
  const filterStr: string[] = []

  if (filters.event_type && filters.event_type !== 'Todos') {
    filterStr.push(`event_type="${filters.event_type}"`)
  }
  if (filters.userName && filters.userName !== 'Todos') {
    filterStr.push(`usuario_id.name="${filters.userName}"`)
  }
  if (filters.startDate) {
    filterStr.push(`timestamp >= "${filters.startDate} 00:00:00.000Z"`)
  }
  if (filters.endDate) {
    filterStr.push(`timestamp <= "${filters.endDate} 23:59:59.999Z"`)
  }

  return await pb.collection('audit_logs').getList(page, perPage, {
    filter: filterStr.join(' && '),
    sort: '-timestamp',
    expand: 'usuario_id',
  })
}
