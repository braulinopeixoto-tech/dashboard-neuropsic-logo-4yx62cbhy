export type Protocol = 'REAC' | 'tDCS' | 'tACS'
export type PatientStatus = 'Em dia' | 'Atrasado' | 'Falta registrada' | 'Risco de Desistência'

export interface Patient {
  id: string
  name: string
  protocol: Protocol
  progress: number
  totalSessions: number
  status: PatientStatus
  lastSession: string
  nextSession: string
}

export const statsData = {
  totalActive: 142,
  completionRate: 84,
  missedSessions: 18,
  avoidedDropouts: 12,
}

export const alertsData = [
  {
    id: '1',
    patient: 'João Silva',
    message: 'Falta em 2 sessões consecutivas',
    type: 'danger',
  },
  {
    id: '2',
    patient: 'Maria Santos',
    message: 'Pausa no tratamento > 15 dias',
    type: 'warning',
  },
]

export const patientsData: Patient[] = [
  {
    id: '1',
    name: 'Ricardo Oliveira',
    protocol: 'REAC',
    progress: 12,
    totalSessions: 18,
    status: 'Em dia',
    lastSession: 'Há 2 dias',
    nextSession: 'Amanhã, 14:00',
  },
  {
    id: '2',
    name: 'Ana Souza',
    protocol: 'tDCS',
    progress: 5,
    totalSessions: 10,
    status: 'Atrasado',
    lastSession: 'Há 8 dias',
    nextSession: 'Não agendada',
  },
  {
    id: '3',
    name: 'Bruno Pereira',
    protocol: 'tACS',
    progress: 1,
    totalSessions: 20,
    status: 'Falta registrada',
    lastSession: 'Há 5 dias',
    nextSession: 'Hoje, 16:00',
  },
  {
    id: '4',
    name: 'Carla Mendes',
    protocol: 'REAC',
    progress: 15,
    totalSessions: 18,
    status: 'Em dia',
    lastSession: 'Ontem',
    nextSession: 'Quinta, 10:00',
  },
  {
    id: '5',
    name: 'Diego Costa',
    protocol: 'tDCS',
    progress: 8,
    totalSessions: 20,
    status: 'Risco de Desistência',
    lastSession: 'Há 12 dias',
    nextSession: 'Não agendada',
  },
  {
    id: '6',
    name: 'Fernanda Lima',
    protocol: 'REAC',
    progress: 18,
    totalSessions: 18,
    status: 'Em dia',
    lastSession: 'Hoje',
    nextSession: 'Finalizado',
  },
  {
    id: '7',
    name: 'Gustavo Rocha',
    protocol: 'tACS',
    progress: 3,
    totalSessions: 15,
    status: 'Atrasado',
    lastSession: 'Há 7 dias',
    nextSession: 'Amanhã, 09:00',
  },
  {
    id: '8',
    name: 'Helena Nogueira',
    protocol: 'tDCS',
    progress: 2,
    totalSessions: 10,
    status: 'Em dia',
    lastSession: 'Há 3 dias',
    nextSession: 'Sexta, 11:00',
  },
]
