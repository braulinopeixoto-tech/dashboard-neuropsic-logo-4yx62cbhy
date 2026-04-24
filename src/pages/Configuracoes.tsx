import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, User, Settings2 } from 'lucide-react'

export default function Configuracoes() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências pessoais e estruturação das unidades clínicas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" /> Perfil Profissional
              </CardTitle>
              <CardDescription>
                Informações de identificação exibidas para a equipe e em relatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">
                    Nome Completo
                  </Label>
                  <Input id="name" defaultValue="Dr. Neuro" className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">
                    E-mail Profissional
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="dr.neuro@clinica.com"
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg" className="text-slate-700">
                    Registro Profissional (CRP/CRM)
                  </Label>
                  <Input id="reg" defaultValue="CRP 00/00000" className="bg-slate-50" />
                </div>
              </div>
              <Button className="mt-4">Salvar Alterações</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" /> Unidades de Atendimento
              </CardTitle>
              <CardDescription>
                Gerencie as clínicas onde você atende e supervisiona tratamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Unidade Cidade A</p>
                      <p className="text-sm text-slate-500">Matriz Principal</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    Gerenciar
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Unidade Cidade B</p>
                      <p className="text-sm text-slate-500">Filial Sul</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    Gerenciar
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cadastrar Nova Unidade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4">
          <Card className="shadow-sm border-slate-200 bg-slate-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <Settings2 className="w-5 h-5" /> Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600 space-y-4">
                <p>
                  <strong>Versão do Sistema:</strong> v2.1.4
                </p>
                <p>
                  <strong>Último login:</strong> Hoje, 08:42
                </p>
                <div className="h-px bg-slate-200 w-full my-4" />
                <Button
                  variant="outline"
                  className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  Desconectar Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
