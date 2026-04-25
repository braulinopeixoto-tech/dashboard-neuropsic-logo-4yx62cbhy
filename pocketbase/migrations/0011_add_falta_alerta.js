migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alertas')
    col.fields.removeByName('tipo')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        required: true,
        values: [
          'risco_desistência',
          'falta_consecutiva',
          'pausa_excedida',
          'observacao_clinica',
          'falta',
        ],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alertas')
    col.fields.removeByName('tipo')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        required: true,
        values: ['risco_desistência', 'falta_consecutiva', 'pausa_excedida', 'observacao_clinica'],
      }),
    )
    app.save(col)
  },
)
