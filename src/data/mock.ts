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

export type AuditEvent = 'Login' | 'Vital Score' | 'Acesso Prontuário'
export type AuditStatus = 'Íntegro' | 'Pendente' | 'Corrompido'

export interface AuditRecord {
  id: string
  timestamp: string
  user: string
  userId: string
  event: AuditEvent
  action: string
  hash: string
  prevHash: string
  status: AuditStatus
  payload: any
}

export const auditLogsData: AuditRecord[] = [
  {
    id: '1',
    timestamp: '2023-10-25T08:00:00Z',
    user: 'Ana Silva',
    userId: 'u1',
    event: 'Login',
    action: 'Autenticação bem-sucedida',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    status: 'Íntegro',
    payload: { ip: '192.168.1.1', browser: 'Chrome' },
  },
  {
    id: '2',
    timestamp: '2023-10-25T08:15:00Z',
    user: 'Carlos Oliveira',
    userId: 'u2',
    event: 'Login',
    action: 'Autenticação bem-sucedida',
    hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'Íntegro',
    payload: { ip: '192.168.1.2', browser: 'Firefox' },
  },
  {
    id: '3',
    timestamp: '2023-10-25T09:00:00Z',
    user: 'Mariana Santos',
    userId: 'u3',
    event: 'Login',
    action: 'Autenticação bem-sucedida',
    hash: 'b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    prevHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    status: 'Íntegro',
    payload: { ip: '192.168.1.3', browser: 'Safari' },
  },
  {
    id: '4',
    timestamp: '2023-10-26T08:05:00Z',
    user: 'Ana Silva',
    userId: 'u1',
    event: 'Login',
    action: 'Autenticação bem-sucedida',
    hash: 'c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2',
    prevHash: 'b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    status: 'Íntegro',
    payload: { ip: '192.168.1.1', browser: 'Chrome' },
  },
  {
    id: '5',
    timestamp: '2023-10-26T08:20:00Z',
    user: 'Carlos Oliveira',
    userId: 'u2',
    event: 'Login',
    action: 'Falha de autenticação',
    hash: 'd1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2',
    prevHash: 'c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2',
    status: 'Íntegro',
    payload: { ip: '192.168.1.2', reason: 'Senha inválida' },
  },
  {
    id: '6',
    timestamp: '2023-10-25T09:30:00Z',
    user: 'Ana Silva',
    userId: 'u1',
    event: 'Vital Score',
    action: 'Registro de DNDA',
    hash: 'e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2',
    prevHash: 'd1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2',
    status: 'Íntegro',
    payload: { pacienteId: 'p1', score: 85 },
  },
  {
    id: '7',
    timestamp: '2023-10-25T10:15:00Z',
    user: 'Carlos Oliveira',
    userId: 'u2',
    event: 'Vital Score',
    action: 'Atualização de métricas',
    hash: 'f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2',
    prevHash: 'e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2',
    status: 'Íntegro',
    payload: { pacienteId: 'p2', score: 92 },
  },
  {
    id: '8',
    timestamp: '2023-10-25T11:00:00Z',
    user: 'Mariana Santos',
    userId: 'u3',
    event: 'Vital Score',
    action: 'Registro de DNDA',
    hash: 'g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2',
    prevHash: 'f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2',
    status: 'Íntegro',
    payload: { pacienteId: 'p3', score: 78 },
  },
  {
    id: '9',
    timestamp: '2023-10-25T14:30:00Z',
    user: 'Ana Silva',
    userId: 'u1',
    event: 'Vital Score',
    action: 'Atualização de métricas',
    hash: 'h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2',
    prevHash: 'g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2',
    status: 'Íntegro',
    payload: { pacienteId: 'p1', score: 88 },
  },
  {
    id: '10',
    timestamp: '2023-10-26T09:45:00Z',
    user: 'Carlos Oliveira',
    userId: 'u2',
    event: 'Vital Score',
    action: 'Registro de DNDA (Offline)',
    hash: 'i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2',
    prevHash: 'h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2',
    status: 'Pendente',
    payload: { pacienteId: 'p4', score: 65, syncStatus: 'pending' },
  },
  {
    id: '11',
    timestamp: '2023-10-26T11:20:00Z',
    user: 'Mariana Santos',
    userId: 'u3',
    event: 'Vital Score',
    action: 'Atualização de métricas',
    hash: 'j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2',
    prevHash: 'i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2',
    status: 'Íntegro',
    payload: { pacienteId: 'p5', score: 95 },
  },
  {
    id: '12',
    timestamp: '2023-10-26T15:00:00Z',
    user: 'Ana Silva',
    userId: 'u1',
    event: 'Vital Score',
    action: 'Edição de Score',
    hash: 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2',
    prevHash: 'j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2',
    status: 'Corrompido',
    payload: { pacienteId: 'p1', oldScore: 88, newScore: 90, reason: 'Correção manual' },
  },
  {
    id: '13',
    timestamp: '2023-10-25T10:00:00Z',
    user: 'Carlos Oliveira',
    userId: 'u2',
    event: 'Acesso Prontuário',
    action: 'Visualização de Anamnese',
    hash: 'l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2',
    prevHash: 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2',
    status: 'Íntegro',
    payload: { pacienteId: 'p2', document: 'anamnese_v1' },
  },
  {
    id: '14',
    timestamp: '2023-10-26T14:15:00Z',
    user: 'Mariana Santos',
    userId: 'u3',
    event: 'Acesso Prontuário',
    action: 'Exportação de PDF',
    hash: 'm1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2',
    prevHash: 'l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2',
    status: 'Íntegro',
    payload: { pacienteId: 'p3', format: 'pdf', pages: 5 },
  },
  {
    id: '15',
    timestamp: '2023-10-26T16:30:00Z',
    user: 'Ana Silva',
    userId: 'u1',
    event: 'Acesso Prontuário',
    action: 'Visualização de Evolução (Offline)',
    hash: 'n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2',
    prevHash: 'm1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2',
    status: 'Pendente',
    payload: { pacienteId: 'p1', document: 'evolucao_2023' },
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
