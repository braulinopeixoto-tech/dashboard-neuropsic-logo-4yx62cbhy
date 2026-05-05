import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDespesa } from '@/services/financeiro'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  data: z.string().min(1, 'Obrigatório'),
  descricao: z
    .string()
    .min(1, 'Obrigatório')
    .transform((s) => s.trim()),
  valor: z.coerce.number().min(0.01, 'Valor inválido'),
  categoria: z.string().min(1, 'Obrigatório'),
  tipo: z.enum(['Fixo', 'Variável'], { required_error: 'Obrigatório' }),
})

type FormData = z.infer<typeof schema>

export function DespesaForm({
  categorias,
  onSuccess,
}: {
  categorias: any[]
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { data: new Date().toISOString().split('T')[0], valor: 0, descricao: '' },
  })

  const selectedCategoria = form.watch('categoria')

  useEffect(() => {
    if (selectedCategoria) {
      const cat = categorias.find((c) => c.nome === selectedCategoria)
      if (cat) {
        form.setValue('tipo', cat.tipo)
      }
    }
  }, [selectedCategoria, categorias, form])

  const onSubmit = async (d: FormData) => {
    setLoading(true)
    try {
      await createDespesa({ ...d, usuario_id: user.id })
      toast({ description: 'Despesa adicionada com sucesso.' })
      onSuccess()
    } catch (e) {
      toast({ variant: 'destructive', description: 'Erro ao adicionar despesa.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" {...form.register('data')} />
          {form.formState.errors.data && (
            <p className="text-sm text-destructive">{form.formState.errors.data.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input type="number" step="0.01" {...form.register('valor')} />
          {form.formState.errors.valor && (
            <p className="text-sm text-destructive">{form.formState.errors.valor.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Controller
          name="categoria"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.categoria && (
          <p className="text-sm text-destructive">{form.formState.errors.categoria.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Controller
          name="tipo"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixo">Fixo</SelectItem>
                <SelectItem value="Variável">Variável</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.tipo && (
          <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input {...form.register('descricao')} placeholder="Ex: Pagamento internet" />
        {form.formState.errors.descricao && (
          <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Despesa
      </Button>
    </form>
  )
}
