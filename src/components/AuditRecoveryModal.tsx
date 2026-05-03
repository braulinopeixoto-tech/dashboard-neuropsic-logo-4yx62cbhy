import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldAlert, AlertTriangle, History, ShieldCheck, Trash2 } from 'lucide-react'
import { recoverAuditChain } from '@/services/audit_logs_system'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface AuditRecoveryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chainBreak: any
  onSuccess: () => void
}

export function AuditRecoveryModal({
  open,
  onOpenChange,
  chainBreak,
  onSuccess,
}: AuditRecoveryModalProps) {
  const [isRecovering, setIsRecovering] = useState(false)
  const [action, setAction] = useState<string>('investigacao')
  const [notes, setNotes] = useState('')
  const [backupDate, setBackupDate] = useState('')
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const handleOpenChange = (val: boolean) => {
    if (isRecovering) return
    if (!val) {
      setTimeout(() => {
        setStep(1)
        setAction('investigacao')
        setNotes('')
        setBackupDate('')
      }, 300)
    }
    onOpenChange(val)
  }

  const submitRecovery = async () => {
    setIsRecovering(true)
    try {
      await recoverAuditChain(chainBreak.id, action, notes, backupDate)
      toast.success('Procedimento de recuperação concluído com sucesso.')
      onSuccess()
      handleOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro na revalidação da cadeia. Verifique os logs do sistema.')
    } finally {
      setIsRecovering(false)
    }
  }

  const handlePrimaryClick = () => {
    if (action === 'delecao') {
      if (step === 1) setStep(2)
      else if (step === 2) setStep(3)
      else submitRecovery()
    } else {
      submitRecovery()
    }
  }

  if (!chainBreak) return null

  const firstLog = chainBreak.expand?.first_corrupted_log_id
  const lastLog = chainBreak.expand?.last_corrupted_log_id

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Painel de Recuperação de Auditoria
          </DialogTitle>
          <DialogDescription>
            Procedimento estruturado para investigação e restauração da integridade da cadeia de
            logs.
          </DialogDescription>
        </DialogHeader>

        {isRecovering ? (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h3 className="text-lg font-semibold text-slate-900">
              Revalidando cadeia de auditoria...
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              O sistema está recalculando os hashes e verificando a integridade de todos os
              registros. Não feche esta janela.
            </p>
          </div>
        ) : step === 1 ? (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Primeiro Log Corrompido
                </span>
                <div className="text-sm font-medium text-slate-900">
                  {firstLog ? format(new Date(firstLog.timestamp), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  ID: {chainBreak.first_corrupted_log_id}
                </div>
                <div className="text-xs text-slate-500">
                  Usuário: {firstLog?.expand?.usuario_id?.name || firstLog?.usuario_id}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Último Log Afetado
                </span>
                <div className="text-sm font-medium text-slate-900">
                  {lastLog ? format(new Date(lastLog.timestamp), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  ID: {chainBreak.last_corrupted_log_id}
                </div>
                <div className="text-xs text-slate-500">
                  Usuário: {lastLog?.expand?.usuario_id?.name || lastLog?.usuario_id}
                </div>
              </div>
              <div className="col-span-2 border-t border-slate-200 pt-3 mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Total de registros afetados:
                </span>
                <Badge variant="destructive" className="px-3 py-1 text-sm">
                  {chainBreak.affected_logs_count} registros
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900">Ação de Recuperação</Label>
              <RadioGroup
                value={action}
                onValueChange={setAction}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <Label
                  htmlFor="act-invest"
                  className={cn(
                    'border rounded-xl p-4 cursor-pointer flex flex-col gap-2 hover:bg-slate-50 transition-colors',
                    action === 'investigacao' &&
                      'border-blue-500 bg-blue-50/50 hover:bg-blue-50/50 ring-1 ring-blue-500',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="investigacao" id="act-invest" />
                    <span className="font-semibold text-slate-900">Investigação</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">
                    Registrar causa e manter cadeia como "investigada". Não altera dados.
                  </p>
                </Label>

                <Label
                  htmlFor="act-rest"
                  className={cn(
                    'border rounded-xl p-4 cursor-pointer flex flex-col gap-2 hover:bg-slate-50 transition-colors',
                    action === 'restauracao' &&
                      'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50/50 ring-1 ring-emerald-500',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="restauracao" id="act-rest" />
                    <span className="font-semibold text-slate-900">Restaurar Backup</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">
                    Restaurar logs de um ponto no tempo e revalidar toda a cadeia.
                  </p>
                </Label>

                <Label
                  htmlFor="act-del"
                  className={cn(
                    'border rounded-xl p-4 cursor-pointer flex flex-col gap-2 hover:bg-slate-50 transition-colors',
                    action === 'delecao' &&
                      'border-red-500 bg-red-50/50 hover:bg-red-50/50 ring-1 ring-red-500',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="delecao" id="act-del" />
                    <span className="font-semibold text-slate-900">Excluir e Reencadear</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">
                    Excluir os logs corrompidos e recriar a cadeia com os remanescentes.
                  </p>
                </Label>
              </RadioGroup>
            </div>

            {action === 'restauracao' && (
              <div className="space-y-2 animate-fade-in-up">
                <Label htmlFor="backupDate">Ponto de Restauração (Data)</Label>
                <Input
                  id="backupDate"
                  type="date"
                  value={backupDate}
                  onChange={(e) => setBackupDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">
                Causa Investigada / Notas Administrativas <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Descreva os achados da investigação técnica..."
                className="min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handlePrimaryClick}
                disabled={!notes.trim() || (action === 'restauracao' && !backupDate)}
              >
                {action === 'delecao' ? 'Avançar para Exclusão' : 'Executar Recuperação'}
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Atenção: Exclusão de Registros</h3>
            <p className="text-slate-600 max-w-md">
              Você está prestes a excluir{' '}
              <strong>{chainBreak.affected_logs_count} registros</strong> da trilha de auditoria.
              Esta ação é irreversível e removerá permanentemente o histórico no período afetado.
            </p>
            <div className="flex w-full justify-center gap-3 pt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handlePrimaryClick}>
                Sim, desejo prosseguir
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center mb-2 shadow-lg shadow-red-200">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Aviso Final de Reencadeamento</h3>
            <p className="text-slate-600 max-w-md">
              A exclusão modificará a cadeia criptográfica de todos os logs subsequentes. Uma nova
              entrada será gerada reportando esta deleção manual. Deseja aplicar a mudança agora?
            </p>
            <div className="flex w-full justify-center gap-3 pt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                Cancelar Exclusão
              </Button>
              <Button variant="destructive" onClick={handlePrimaryClick}>
                Confirmar e Excluir Logs
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
