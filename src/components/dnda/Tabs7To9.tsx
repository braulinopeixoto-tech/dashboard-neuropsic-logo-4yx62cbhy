import { TabsContent } from '@/components/ui/tabs'
import { FormText, FormRadio, FormCheckboxBoolean } from './FormFields'

export function Tabs7To9() {
  return (
    <>
      <TabsContent value="d7" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Histórico Crítico</h3>
            <FormText name="temporal_traumas" label="Traumas Relevantes" />
            <FormText name="temporal_perdas" label="Perdas Significativas" />
            <FormRadio
              name="temporal_classificacao_perdas"
              label="Classificação de Perda/Luto"
              options={['Com oportunidade', 'Sem oportunidade', 'Terminal']}
            />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Curso Clínico</h3>
            <FormText name="temporal_evolucao" label="Evolução do Quadro" />
            <FormText name="temporal_resposta_intervencoes" label="Resposta a Intervenções" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d8" className="space-y-6 mt-4 animate-fade-in">
        <div className="max-w-2xl mx-auto bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-subtle space-y-6">
          <div className="text-center">
            <h3 className="font-bold text-2xl mb-2 text-primary">Convergência Diagnóstica</h3>
            <p className="text-slate-500 mb-6">Síntese do padrão neurofuncional dimensional.</p>
          </div>

          <FormRadio
            name="convergencia_risco_clinico"
            label="Risco Clínico Avaliado"
            options={['Baixo', 'Médio', 'Alto']}
          />
          <FormText name="convergencia_estado_neurofuncional" label="Estado Neurofuncional" />
          <FormText name="convergencia_vetor_adaptativo" label="Vetor Adaptativo" />
          <FormText name="convergencia_resumo" label="Síntese Convergente" />
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

          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Fases de Intervenção</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormCheckboxBoolean name="intervencao_base" label="Base / Estabilização" />
              <FormCheckboxBoolean
                name="intervencao_integracao"
                label="Integração Neuromodulatória"
              />
              <FormCheckboxBoolean
                name="intervencao_especializacao"
                label="Especialização Cognitiva"
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Ferramentas de Neuromodulação</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormCheckboxBoolean name="intervencao_neuromodulacao_tdcs" label="tDCS" />
              <FormCheckboxBoolean name="intervencao_neuromodulacao_tacs" label="tACS" />
              <FormCheckboxBoolean name="intervencao_neuromodulacao_reac" label="REAC" />
              <FormCheckboxBoolean name="intervencao_neuromodulacao_tms" label="TMS" />
              <FormCheckboxBoolean name="intervencao_neurofeedback" label="Neurofeedback" />
              <FormCheckboxBoolean name="intervencao_biofeedback" label="HRV Biofeedback" />
            </div>
          </div>
        </div>
      </TabsContent>
    </>
  )
}
