migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('anamneses')

    if (!col.fields.getByName('queixa_principal'))
      col.fields.add(new TextField({ name: 'queixa_principal' }))
    if (!col.fields.getByName('historia_clinica'))
      col.fields.add(new TextField({ name: 'historia_clinica' }))
    if (!col.fields.getByName('historia_resumida'))
      col.fields.add(new TextField({ name: 'historia_resumida' }))
    if (!col.fields.getByName('antecedentes_pessoais'))
      col.fields.add(new TextField({ name: 'antecedentes_pessoais' }))
    if (!col.fields.getByName('antecedentes_familiares'))
      col.fields.add(new TextField({ name: 'antecedentes_familiares' }))
    if (!col.fields.getByName('medicacoes')) col.fields.add(new JSONField({ name: 'medicacoes' }))
    if (!col.fields.getByName('alergias')) col.fields.add(new JSONField({ name: 'alergias' }))
    if (!col.fields.getByName('cirurgias')) col.fields.add(new JSONField({ name: 'cirurgias' }))
    if (!col.fields.getByName('traumas')) col.fields.add(new TextField({ name: 'traumas' }))
    if (!col.fields.getByName('perdas_recentes'))
      col.fields.add(new TextField({ name: 'perdas_recentes' }))
    if (!col.fields.getByName('pressao_arterial'))
      col.fields.add(new TextField({ name: 'pressao_arterial' }))
    if (!col.fields.getByName('frequencia_cardiaca'))
      col.fields.add(new NumberField({ name: 'frequencia_cardiaca' }))
    if (!col.fields.getByName('frequencia_respiratoria'))
      col.fields.add(new NumberField({ name: 'frequencia_respiratoria' }))
    if (!col.fields.getByName('temperatura'))
      col.fields.add(new NumberField({ name: 'temperatura' }))
    if (!col.fields.getByName('imc')) col.fields.add(new NumberField({ name: 'imc' }))
    if (!col.fields.getByName('exame_neurologico'))
      col.fields.add(new TextField({ name: 'exame_neurologico' }))
    if (!col.fields.getByName('exame_psiquico'))
      col.fields.add(new TextField({ name: 'exame_psiquico' }))
    if (!col.fields.getByName('impressao_ia'))
      col.fields.add(new TextField({ name: 'impressao_ia' }))

    col.listRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.updateRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.deleteRule = "@request.auth.id != '' && usuario_id = @request.auth.id"

    app.save(col)
  },
  (app) => {
    // Irreversible schema change, do nothing on down
  },
)
