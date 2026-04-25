import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Index from './pages/Index'
import Prescrever from './pages/Prescrever'
import Pacientes from './pages/Pacientes'
import PacientePerfil from './pages/PacientePerfil'
import NovoPaciente from './pages/NovoPaciente'
import NovoDNDA from './pages/NovoDNDA'
import MinhasSessoes from './pages/Sessoes'
import Alertas from './pages/Alertas'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/prescrever-protocolo" element={<Prescrever />} />
            <Route path="/minhas-sessoes" element={<MinhasSessoes />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/novo" element={<NovoPaciente />} />
            <Route path="/pacientes/:id" element={<PacientePerfil />} />
            <Route path="/pacientes/:id/dnda/novo" element={<NovoDNDA />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
