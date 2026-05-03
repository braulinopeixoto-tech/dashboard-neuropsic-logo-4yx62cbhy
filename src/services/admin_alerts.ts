import pb from '@/lib/pocketbase/client'

export const getAdminAlerts = async (userId: string) => {
  return pb.collection('admin_alerts').getFullList({
    filter: `usuario_id = "${userId}"`,
    sort: '-created',
    expand: 'log_id.usuario_id',
  })
}

export const markAdminAlertAsRead = async (id: string) => {
  return pb.collection('admin_alerts').update(id, { lido: true })
}

export const markAllAdminAlertsAsRead = async (userId: string) => {
  const unread = await pb.collection('admin_alerts').getFullList({
    filter: `usuario_id = "${userId}" && lido = false`,
  })

  await Promise.all(unread.map((alert) => markAdminAlertAsRead(alert.id)))
}
