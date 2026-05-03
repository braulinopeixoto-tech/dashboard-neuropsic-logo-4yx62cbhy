import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

export function GlobalAlerts() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useRealtime(
    'admin_alerts',
    (e) => {
      // Only show toast for new alerts destined for the currently logged-in user
      if (e.action === 'create' && e.record.usuario_id === user?.id) {
        if (e.record.tipo_alerta === 'corrupted') {
          toast.error('Alerta Crítico de Segurança', {
            description: e.record.mensagem,
            duration: 10000,
            action: {
              label: 'Revisar',
              onClick: () => navigate('/auditoria'),
            },
          })
        } else {
          toast.info('Novo Alerta', {
            description: e.record.mensagem,
          })
        }
      }
    },
    // Only subscribe and trigger if the user is a neuropsicólogo (admin)
    !!user && user.tipo === 'neuropsicólogo',
  )

  return null
}
