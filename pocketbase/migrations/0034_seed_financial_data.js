migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
    } catch (_) {
      return // No admin to seed for
    }

    const categoriasCol = app.findCollectionByNameOrId('categorias_despesas')
    const despesasCol = app.findCollectionByNameOrId('despesas')
    const receitasCol = app.findCollectionByNameOrId('receitas')

    const categorias = [
      { nome: 'Salário Maira', tipo: 'Fixo' },
      { nome: 'Salário Carlene', tipo: 'Fixo' },
      { nome: 'Salário Sarah', tipo: 'Fixo' },
      { nome: 'Técnico Salvador', tipo: 'Fixo' },
      { nome: 'Hospedagem Salvador', tipo: 'Variável' },
      { nome: 'Alimentação + Transp. SSA', tipo: 'Variável' },
      { nome: 'Hospedagem Irecê', tipo: 'Variável' },
      { nome: 'Alimentação Irecê', tipo: 'Variável' },
      { nome: 'Gasolina Lençóis x Irecê', tipo: 'Variável' },
      { nome: 'Gasolina Lençóis x Seabra', tipo: 'Variável' },
      { nome: 'Equipamento REAC', tipo: 'Fixo' },
      { nome: 'Sonda REAC', tipo: 'Variável' },
      { nome: 'Honorário Contabilidade', tipo: 'Fixo' },
      { nome: 'Imposto Receita Federal', tipo: 'Variável' },
      { nome: 'Imposto FGTS', tipo: 'Variável' },
      { nome: 'Imposto Simples Nacional Parcelado', tipo: 'Fixo' },
      { nome: 'Imposto Simples Nacional', tipo: 'Variável' },
      { nome: 'Prudential Braulino', tipo: 'Fixo' },
      { nome: 'Prudential Breno', tipo: 'Fixo' },
      { nome: 'Condomínio SSA', tipo: 'Fixo' },
      { nome: 'Karen MKT', tipo: 'Fixo' },
      { nome: 'Despesas Atendimento Seabra', tipo: 'Variável' },
      { nome: '2ª Parc. 13º Maira', tipo: 'Variável' },
      { nome: '2ª Parc. 13º Carlene', tipo: 'Variável' },
      { nome: 'Tec Irecê', tipo: 'Variável' },
    ]

    for (const c of categorias) {
      try {
        app.findFirstRecordByData('categorias_despesas', 'nome', c.nome)
      } catch (_) {
        const record = new Record(categoriasCol)
        record.set('usuario_id', admin.id)
        record.set('nome', c.nome)
        record.set('tipo', c.tipo)
        app.save(record)
      }
    }

    // Seed some mock receitas
    try {
      app.findFirstRecordByData('receitas', 'descricao', 'Consulta João S.')
    } catch (_) {
      const record = new Record(receitasCol)
      record.set('usuario_id', admin.id)
      record.set('data', new Date().toISOString())
      record.set('tipo', 'PIX')
      record.set('valor', 2500)
      record.set('local', 'Salvador')
      record.set('descricao', 'Consulta João S.')
      app.save(record)

      const record2 = new Record(receitasCol)
      record2.set('usuario_id', admin.id)
      record2.set('data', new Date().toISOString())
      record2.set('tipo', 'Cartão')
      record2.set('valor', 1500)
      record2.set('local', 'Consultas Online')
      record2.set('descricao', 'Pacote 10 Sessões')
      app.save(record2)
    }

    // Seed some mock despesas
    try {
      app.findFirstRecordByData('despesas', 'descricao', 'Pagamento Mensal Maira')
    } catch (_) {
      const record = new Record(despesasCol)
      record.set('usuario_id', admin.id)
      record.set('data', new Date().toISOString())
      record.set('descricao', 'Pagamento Mensal Maira')
      record.set('valor', 3500)
      record.set('categoria', 'Salário Maira')
      record.set('tipo', 'Fixo')
      app.save(record)

      const record2 = new Record(despesasCol)
      record2.set('usuario_id', admin.id)
      record2.set('data', new Date().toISOString())
      record2.set('descricao', 'Almoço equipe Irecê')
      record2.set('valor', 150)
      record2.set('categoria', 'Alimentação Irecê')
      record2.set('tipo', 'Variável')
      app.save(record2)
    }
  },
  (app) => {
    // Cannot easily cleanly rollback without hard deletes, ignore.
  },
)
