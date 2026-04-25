import { TabsContent } from '@/components/ui/tabs'
import { FormSlider, FormRadio } from './FormFields'

export function Tabs1To3() {
  return (
    <>
      <TabsContent value="d1" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Marcadores Frequenciais</h3>
            <FormSlider name="neuroenergetica_potencia" label="Potência Absoluta" />
            <FormSlider name="neuroenergetica_tbr" label="Theta/Beta Ratio (TBR)" />
            <FormSlider name="neuroenergetica_excitacao" label="Nível de Excitação Global" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Características</h3>
            <FormRadio
              name="neuroenergetica_variabilidade"
              label="Variabilidade"
              options={['Instável', 'Normal', 'Rígido']}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d2" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Métricas de Conexão</h3>
            <FormSlider name="integracao_coerencia" label="Coerência Global" />
            <FormSlider name="integracao_conectividade" label="Conectividade Funcional" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Redes Intrínsecas</h3>
            <FormRadio
              name="integracao_dmn"
              label="Default Mode Network (DMN)"
              options={['Acoplado', 'Desacoplado', 'Hiperacoplado']}
            />
            <FormRadio
              name="integracao_salience"
              label="Rede de Saliência"
              options={['Acoplado', 'Desacoplado', 'Hiperacoplado']}
            />
            <FormRadio
              name="integracao_executive"
              label="Rede Executiva Central"
              options={['Acoplado', 'Desacoplado', 'Hiperacoplado']}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d3" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Organização Espacial</h3>
            <FormSlider name="organizacional_simetria" label="Simetria Hemisférica" />
            <FormSlider name="organizacional_gradientes" label="Gradientes Antero-Posteriores" />
            <FormSlider name="organizacional_topografia" label="Distribuição Topográfica" />
            <FormSlider name="organizacional_complexidade" label="Complexidade (Entropia)" />
          </div>
        </div>
      </TabsContent>
    </>
  )
}
