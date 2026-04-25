import { TabsContent } from '@/components/ui/tabs'
import { FormSlider, FormRadio } from './FormFields'

export function Tabs4To6() {
  return (
    <>
      <TabsContent value="d4" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Desempenho Cognitivo</h3>
            <FormSlider name="d4_attention" label="Atenção Concentrada" />
            <FormSlider name="d4_inhibitory" label="Controle Inibitório" />
            <FormSlider name="d4_flexibility" label="Flexibilidade Cognitiva" />
            <FormSlider name="d4_memory" label="Memória de Trabalho" />
            <FormSlider name="d4_emotion" label="Regulação Emocional" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Integração de Personalidade</h3>
            <FormRadio
              name="d4_big_five"
              label="Traço Dominante (Big Five)"
              options={['abertura', 'consciência', 'extroversão', 'amabilidade', 'neuroticismo']}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d5" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Sistemas de Valência</h3>
            <FormSlider name="d5_negative" label="Valência Negativa" />
            <FormSlider name="d5_positive" label="Valência Positiva" />
            <FormSlider name="d5_arousal" label="Arousal / Excitação" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Sistemas Funcionais</h3>
            <FormSlider name="d5_cognitive" label="Sistemas Cognitivos" />
            <FormSlider name="d5_social" label="Processos Sociais" />
            <FormSlider name="d5_sensory" label="Sistemas Sensório-Motores" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d6" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Métricas Orgânicas</h3>
            <FormSlider name="d6_metabolism" label="Perfil Metabólico" />
            <FormSlider name="d6_inflammation" label="Nível de Inflamação Sistêmica" />
            <FormSlider name="d6_sleep" label="Qualidade do Sono" />
            <FormSlider name="d6_hrv" label="VFC (Heart Rate Variability)" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Influências Sistêmicas</h3>
            <FormRadio
              name="d6_menstrual"
              label="Ciclo Menstrual"
              options={['regular', 'irregular', 'menopausa', 'n/a']}
            />
            <FormRadio
              name="d6_diet"
              label="Perfil de Dieta"
              options={['adequada', 'inflamatória', 'restritiva']}
            />
            <FormRadio
              name="d6_intestinal"
              label="Trânsito Intestinal"
              options={['regular', 'constipado', 'diarreico', 'alternante']}
            />
          </div>
        </div>
      </TabsContent>
    </>
  )
}
