import { TabsContent } from '@/components/ui/tabs'
import { FormText, FormRadio, FormChecklist } from './FormFields'

export function Tabs7To9() {
  return (
    <>
      <TabsContent value="d7" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Histórico Crítico</h3>
            <FormText name="d7_traumas" label="Traumas Relevantes" />
            <FormText name="d7_losses" label="Perdas Significativas" />
            <FormRadio
              name="d7_loss_class"
              label="Classificação de Perda/Luto"
              options={['aguda', 'crônica', 'resolvida']}
            />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Curso Clínico</h3>
            <FormText name="d7_evolution" label="Evolução do Quadro" />
            <FormText name="d7_previous" label="Intervenções Anteriores" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d8" className="space-y-6 mt-4 animate-fade-in">
        <div className="max-w-2xl mx-auto bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-subtle space-y-6">
          <div className="text-center">
            <h3 className="font-bold text-2xl mb-2 text-primary">Convergência Diagnóstica</h3>
            <p className="text-slate-500 mb-6">
              Síntese automatizada do padrão neurofuncional dimensional.
            </p>
          </div>

          <FormRadio
            name="d8_risk"
            label="Risco Clínico Avaliado"
            options={['baixo', 'médio', 'alto']}
          />
          <FormText name="d8_summary" label="Síntese Convergente (Auto-gerada)" />
        </div>
      </TabsContent>

      <TabsContent value="d9" className="space-y-6 mt-4 animate-fade-in">
        <div className="max-w-3xl mx-auto space-y-8 bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-subtle">
          <div className="text-center mb-6">
            <h3 className="font-bold text-2xl mb-2 text-primary">Plano de Intervenção</h3>
            <p className="text-slate-500">
              Seleção de fases de estabilização e ferramentas de neuromodulação.
            </p>
          </div>

          <FormChecklist
            name="d9_phases"
            label="Fases de Intervenção Recomendadas"
            options={[
              'Base / Estabilização',
              'Integração Neuromodulatória',
              'Especialização Cognitiva',
            ]}
          />

          <FormChecklist
            name="d9_tools"
            label="Ferramentas Técnicas (Protocolos)"
            options={[
              'tDCS',
              'tACS',
              'REAC',
              'TMS',
              'HRV Biofeedback',
              'Neurofeedback',
              'Estimulação Magnética Transcraniana',
            ]}
          />
        </div>
      </TabsContent>
    </>
  )
}
