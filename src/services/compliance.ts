import pb from '@/lib/pocketbase/client'

export const buildComplianceFilter = (filters: any) => {
  const f: string[] = []
  if (filters.event_type && filters.event_type !== 'all') {
    f.push(`event_type="${filters.event_type}"`)
  }
  if (filters.integrity_status && filters.integrity_status !== 'all') {
    f.push(`integrity_status="${filters.integrity_status}"`)
  }
  if (filters.startDate) {
    const d = new Date(filters.startDate)
    d.setHours(0, 0, 0, 0)
    f.push(`timestamp >= "${d.toISOString().replace('T', ' ')}"`)
  }
  if (filters.endDate) {
    const d = new Date(filters.endDate)
    d.setHours(23, 59, 59, 999)
    f.push(`timestamp <= "${d.toISOString().replace('T', ' ')}"`)
  }
  return f.join(' && ')
}

export const getComplianceData = async (filters: any) => {
  const baseFilter = buildComplianceFilter(filters)

  const list = await pb.collection('audit_logs').getList(1, 500, {
    filter: baseFilter,
    sort: '-timestamp',
    expand: 'usuario_id',
  })

  const [corruptedGlobal, pendingGlobal] = await Promise.all([
    pb.collection('audit_logs').getList(1, 1, { filter: 'integrity_status="corrupted"' }),
    pb.collection('audit_logs').getList(1, 1, { filter: 'integrity_status="pending"' }),
  ])

  return {
    logs: list.items,
    globalCorrupted: corruptedGlobal.totalItems,
    globalPending: pendingGlobal.totalItems,
  }
}

export const getComplianceKpis = async (filters: any) => {
  const baseFilter = buildComplianceFilter(filters)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStr = todayStart.toISOString().replace('T', ' ')

  const todayFilter = baseFilter
    ? `${baseFilter} && timestamp >= "${todayStr}"`
    : `timestamp >= "${todayStr}"`
  const validFilter = baseFilter
    ? `${baseFilter} && integrity_status="valid"`
    : `integrity_status="valid"`
  const fraudFilter = baseFilter
    ? `${baseFilter} && integrity_status="corrupted"`
    : `integrity_status="corrupted"`

  const [total, today, valid, fraud] = await Promise.all([
    pb.collection('audit_logs').getList(1, 1, { filter: baseFilter }),
    pb.collection('audit_logs').getList(1, 1, { filter: todayFilter }),
    pb.collection('audit_logs').getList(1, 1, { filter: validFilter }),
    pb.collection('audit_logs').getList(1, 1, { filter: fraudFilter }),
  ])

  return {
    total: total.totalItems,
    today: today.totalItems,
    valid: valid.totalItems,
    fraud: fraud.totalItems,
  }
}
