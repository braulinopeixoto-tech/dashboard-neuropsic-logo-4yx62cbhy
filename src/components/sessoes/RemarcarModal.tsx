import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getSuggestedSlots, remarcarSessaoCascade, checkReacPause } from '@/services/sessoes'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RemarcarModalProps {
  sessao: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RemarcarModal({ sessao, open, onOpenChange, onSuccess }: RemarcarModalProps) {
  const { toast } = useToast()
  const [slots, setSlots] = useState<Date[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reacBlocked, setReacBlocked] = useState(false)

  useEffect(() => {
    if (open && sessao) {
      loadSlots()
      setSelectedDate(new Date())
      setSelectedSlot(null)
      setReacBlocked(false)
    }
  }, [open, sessao])

  const loadSlots = async () => {
    setLoadingSlots(true)
    try {
      const fetched = await getSuggestedSlots(sessao)
      setSlots(fetched)
      if (fetched.length > 0) {
        setSelectedDate(fetched[0])
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar horários.', variant: 'destructive' })
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSlotSelect = async (slot: Date) => {
    setSelectedSlot(slot)
    setReacBlocked(false)
    if (sessao.expand?.protocolo_id?.tipo === 'REAC') {
      const blocked = await checkReacPause(sessao, slot, sessao.usuario_id)
      setReacBlocked(blocked)
    }
  }

  const handleConfirm = async () => {
    if (!selectedSlot || !sessao) return
    setIsSubmitting(true)
    try {
      await remarcarSessaoCascade(sessao, selectedSlot, sessao.usuario_id)
      toast({
        title: 'Sessão remarcada com sucesso!',
        description: 'Paciente notificado via WhatsApp.',
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao remarcar. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableForDate = slots.filter((s) => selectedDate && isSameDay(s, selectedDate))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">Remarcação Inteligente</DialogTitle>
          <DialogDescription className="text-base mt-1">
            <span className="font-semibold text-slate-800">
              {sessao?.expand?.paciente_id?.nome}
            </span>{' '}
            • {sessao?.expand?.protocolo_id?.tipo} • Sessão {sessao?.numero_sessao}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loadingSlots ? (
            <div className="space-y-4">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </div>
          ) : slots.length === 0 ? (
            <div className="p-10 text-center text-slate-500 bg-slate-50 border border-dashed rounded-xl">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              Nenhum slot disponível
            </div>
          ) : (
            <div className="grid sm:grid-cols-[1fr_200px] gap-6">
              <div className="border rounded-xl p-3 bg-white shadow-sm self-start flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => !slots.some((s) => isSameDay(s, date))}
                  className="mx-auto"
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Horários Disponíveis
                </h4>
                <ScrollArea className="h-[280px] pr-4">
                  <div className="flex flex-col gap-2.5">
                    {availableForDate.length > 0 ? (
                      availableForDate.map((slot, i) => (
                        <Button
                          key={i}
                          variant={selectedSlot === slot ? 'default' : 'outline'}
                          className={cn(
                            'justify-start w-full text-base',
                            selectedSlot === slot &&
                              'border-primary bg-primary text-primary-foreground shadow-md',
                          )}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {format(slot, 'HH:mm')}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg border border-dashed">
                        Nenhum horário na data selecionada.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {reacBlocked && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 mt-6 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold mb-1">Ação Bloqueada</p>
                <p>A pausa excede 15 dias. É recomendado reiniciar o ciclo.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || reacBlocked || isSubmitting}
            className="min-w-[180px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              'Confirmar remarcação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
