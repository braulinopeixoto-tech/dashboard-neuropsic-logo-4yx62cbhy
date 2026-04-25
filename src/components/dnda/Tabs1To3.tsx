import { TabsContent } from '@/components/ui/tabs'
import { FormSlider, FormRadio } from './FormFields'

export function Tabs1To3() {
  return (
    <>
      <TabsContent value="d1" className="space-y-[32px] mt-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Marcadores Frequenciais
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="neuroenergetica_potencia" label="Potência Absoluta" />
              <FormSlider name="neuroenergetica_tbr" label="Theta/Beta Ratio (TBR)" />
              <FormSlider name="neuroenergetica_excitacao" label="Nível de Excitação Global" />
            </div>
          </div>
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Características
            </h3>
            <div className="space-y-[16px]">
              <FormRadio
                name="neuroenergetica_variabilidade"
                label="Variabilidade"
                options={['Instável', 'Normal', 'Rígido']}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="d2" className="space-y-[32px] mt-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Métricas de Conexão
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="integracao_coerencia" label="Coerência Global" />
              <FormSlider name="integracao_conectividade" label="Conectividade Funcional" />
            </div>
          </div>
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Redes Intrínsecas
            </h3>
            <div className="space-y-[16px]">
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
        </div>
      </TabsContent>

      <TabsContent value="d3" className="space-y-[32px] mt-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px]">
          <div className="space-y-[32px]">
            <h3 className="font-semibold text-[16px] border-b pb-2 text-slate-800">
              Organização Espacial
            </h3>
            <div className="space-y-[16px]">
              <FormSlider name="organizacional_simetria" label="Simetria Hemisférica" />
              <FormSlider name="organizacional_gradientes" label="Gradientes Antero-Posteriores" />
              <FormSlider name="organizacional_topografia" label="Distribuição Topográfica" />
              <FormSlider name="organizacional_complexidade" label="Complexidade (Entropia)" />
            </div>
          </div>
        </div>
      </TabsContent>
    </>
  )
}
