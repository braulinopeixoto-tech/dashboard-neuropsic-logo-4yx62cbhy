migrate(
  (app) => {
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
    } catch (_) {
      return // Sem admin, ignorar seed de dados especificos do usuario
    }

    const catDespesasCol = app.findCollectionByNameOrId('categorias_despesas')
    const despesasFixo = [
      'Salário Maira',
      'Salário Carlene',
      'Salário Sarah',
      'Equipamento REAC',
      'Honorário Contabilidade',
      'Imposto FGTS',
      'Imposto Simples Nacional Parcelado',
      'Prudential Braulino',
      'Prudential Breno',
      'Condomínio SSA',
    ]
    const despesasVariavel = [
      'Técnico Salvador',
      'Hospedagem Salvador',
      'Alimentação + Transp. SSA',
      'Hospedagem Irecê',
      'Alimentação Irecê',
      'Gasolina Lençóis x Irecê',
      'Gasolina Lençóis x Seabra',
      'Sonda REAC',
      'Imposto Receita Federal',
      'Imposto Simples Nacional',
      'Karen MKT',
      'Despesas Atendimento Seabra',
      '2ª Parc. 13º Maira',
      '2ª Parc. 13º Carlene',
      'Tec Irecê',
    ]

    for (const nome of despesasFixo) {
      try {
        app.findFirstRecordByFilter('categorias_despesas', 'nome={:nome} && usuario_id={:uid}', {
          nome,
          uid: admin.id,
        })
      } catch (_) {
        const rec = new Record(catDespesasCol)
        rec.set('usuario_id', admin.id)
        rec.set('nome', nome)
        rec.set('tipo', 'Fixo')
        app.save(rec)
      }
    }
    for (const nome of despesasVariavel) {
      try {
        app.findFirstRecordByFilter('categorias_despesas', 'nome={:nome} && usuario_id={:uid}', {
          nome,
          uid: admin.id,
        })
      } catch (_) {
        const rec = new Record(catDespesasCol)
        rec.set('usuario_id', admin.id)
        rec.set('nome', nome)
        rec.set('tipo', 'Variável')
        app.save(rec)
      }
    }

    const catReceitasCol = app.findCollectionByNameOrId('categorias_receitas')
    const receitas = [
      'Avaliação',
      'Terapia REAC',
      'NPPO',
      'NPO',
      'NPPO CB',
      'TACS',
      'TDCS',
      'QEEG',
      'Palestra',
      'Workshop',
      'Congresso',
      'Consultoria',
    ]

    for (const nome of receitas) {
      try {
        app.findFirstRecordByFilter('categorias_receitas', 'nome={:nome} && usuario_id={:uid}', {
          nome,
          uid: admin.id,
        })
      } catch (_) {
        const rec = new Record(catReceitasCol)
        rec.set('usuario_id', admin.id)
        rec.set('nome', nome)
        app.save(rec)
      }
    }
  },
  (app) => {
    // down não estritamente necessário para seed
  },
)
