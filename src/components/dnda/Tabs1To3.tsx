import { TabsContent } from '@/components/ui/tabs'
import { FormSlider, FormRadio } from './FormFields'

export function Tabs1To3() {
  return (
    <>
      <TabsContent value="d1" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Marcadores Frequenciais</h3>
            <FormSlider name="d1_delta" label="Delta" />
            <FormSlider name="d1_theta" label="Theta" />
            <FormSlider name="d1_alpha" label="Alpha" />
            <FormSlider name="d1_beta" label="Beta" />
            <FormSlider name="d1_gamma" label="Gamma" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Métricas Compostas</h3>
            <FormSlider name="d1_tbr" label="TBR (Theta/Beta Ratio)" />
            <FormSlider name="d1_excitation" label="Nível de Excitação Global" />
            <FormRadio
              name="d1_variability"
              label="Variabilidade"
              options={['instável', 'normal', 'rígido']}
            />
            <FormRadio
              name="d1_class"
              label="Classificação Neuroenergética (Auto)"
              options={['hipoativo', 'hiperativo', 'instável']}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d2" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Métricas de Conexão</h3>
            <FormSlider name="d2_coherence" label="Coerência Global" />
            <FormSlider name="d2_connectivity" label="Conectividade Funcional" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Redes Intrínsecas</h3>
            <FormRadio
              name="d2_dmn"
              label="Default Mode Network (DMN)"
              options={['acoplado', 'desacoplado', 'hiperacoplado']}
            />
            <FormRadio
              name="d2_salience"
              label="Rede de Saliência"
              options={['acoplado', 'desacoplado', 'hiperacoplado']}
            />
            <FormRadio
              name="d2_executive"
              label="Rede Executiva Central"
              options={['acoplado', 'desacoplado', 'hiperacoplado']}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d3" className="space-y-6 mt-4 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Organização Espacial</h3>
            <FormSlider name="d3_symmetry" label="Simetria Hemisférica" />
            <FormSlider name="d3_gradients" label="Gradientes Antero-Posteriores" />
            <FormSlider name="d3_topography" label="Distribuição Topográfica" />
            <FormSlider name="d3_entropy" label="Entropia de Sinal" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Classificação</h3>
            <FormRadio
              name="d3_class"
              label="Classificação Organizacional (Auto)"
              options={['coerente', 'difuso', 'desorganizado']}
            />
          </div>
        </div>
      </TabsContent>
    </>
  )
}
