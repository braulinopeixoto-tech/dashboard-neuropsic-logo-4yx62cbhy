import { TabsContent } from '@/components/ui/tabs'
import { FormSlider, FormRadio } from './FormFields'

export function Tabs4To6() {
  return (
    <>
      <TabsContent value="d4" className="space-y-[32px] mt-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Desempenho Cognitivo
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="funcional_atencao_sustentada" label="Atenção Sustentada" />
              <FormSlider name="funcional_atencao_seletiva" label="Atenção Seletiva" />
              <FormSlider name="funcional_controle_inibitorio" label="Controle Inibitório" />
              <FormSlider name="funcional_flexibilidade" label="Flexibilidade Cognitiva" />
              <FormSlider name="funcional_memoria_trabalho" label="Memória de Trabalho" />
              <FormSlider
                name="funcional_processamento_emocional"
                label="Processamento Emocional"
              />
            </div>
          </div>
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Personalidade
            </h3>
            <div className="space-y-[16px]">
              <FormRadio
                name="funcional_big_five"
                label="Traço Dominante (Big Five)"
                options={['Abertura', 'Consciência', 'Extroversão', 'Amabilidade', 'Neuroticismo']}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d5" className="space-y-[32px] mt-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Sistemas de Valência
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="rdoc_valencia_negativa" label="Valência Negativa" />
              <FormSlider name="rdoc_valencia_positiva" label="Valência Positiva" />
              <FormSlider name="rdoc_arousal_regulacao" label="Arousal / Excitação" />
            </div>
          </div>
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Sistemas Funcionais
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="rdoc_sistemas_cognitivos" label="Sistemas Cognitivos" />
              <FormSlider name="rdoc_sistemas_sociais" label="Processos Sociais" />
              <FormSlider name="rdoc_regulacao_sensoriomotora" label="Regulação Sensório-motora" />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d6" className="space-y-[32px] mt-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Métricas Orgânicas
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="neurobiologica_metabolismo" label="Perfil Metabólico" />
              <FormSlider name="neurobiologica_inflamacao" label="Nível de Inflamação Sistêmica" />
              <FormSlider name="neurobiologica_sono" label="Qualidade do Sono" />
              <FormSlider name="neurobiologica_hrv" label="VFC (Heart Rate Variability)" />
            </div>
          </div>
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Influências Sistêmicas
            </h3>
            <div className="space-y-[16px]">
              <FormRadio
                name="neurobiologica_ciclo_menstrual"
                label="Ciclo Menstrual"
                options={['Regular', 'Irregular', 'N/A']}
              />
              <FormRadio
                name="neurobiologica_dieta"
                label="Perfil de Dieta"
                options={['Balanceada', 'Seletiva', 'Abusiva']}
              />
              <FormRadio
                name="neurobiologica_intestino"
                label="Trânsito Intestinal"
                options={['Normal', 'Constipação', 'Diarreia']}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </>
  )
}
