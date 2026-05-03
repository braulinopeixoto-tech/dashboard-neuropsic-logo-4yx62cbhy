import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Prescrever from './pages/Prescrever'
import Pacientes from './pages/Pacientes'
import PacientePerfil from './pages/PacientePerfil'
import NovoPaciente from './pages/NovoPaciente'
import NovaAnamnese from './pages/NovaAnamnese'
import NovoDNDA from './pages/NovoDNDA'
import VisualizarDNDA from './pages/VisualizarDNDA'
import MinhasSessoes from './pages/Sessoes'
import Alertas from './pages/Alertas'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Auditoria from './pages/Auditoria'
import Compliance from './pages/Compliance'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import CommandCenter from './pages/CommandCenter'
import RelatorioFinal from './pages/RelatorioFinal'
import ResumoProntuario from './pages/ResumoProntuario'
import RelatorioConformidade from './pages/RelatorioConformidade'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/cockpit" element={<Navigate to="/" replace />} />
            <Route path="/prescrever-protocolo" element={<Prescrever />} />
            <Route path="/minhas-sessoes" element={<MinhasSessoes />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/novo" element={<NovoPaciente />} />
            <Route path="/pacientes/:id" element={<PacientePerfil />} />
            <Route path="/pacientes/:id/anamnese" element={<NovaAnamnese />} />
            <Route path="/pacientes/:id/dnda/novo" element={<NovoDNDA />} />
            <Route path="/pacientes/:id/dnda/:dndaId/editar" element={<NovoDNDA />} />
            <Route path="/pacientes/:id/dnda/:dndaId" element={<VisualizarDNDA />} />
            <Route path="/pacientes/:id/resumo-prontuario" element={<ResumoProntuario />} />
            <Route path="/relatorio-final/:id" element={<RelatorioFinal />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/relatorio-conformidade" element={<RelatorioConformidade />} />
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
