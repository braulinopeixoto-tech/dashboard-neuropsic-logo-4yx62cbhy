migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alertas')
    const field = col.fields.getByName('tipo')
    if (field) {
      field.values = [...field.values, 'observacao_clinica']
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alertas')
    const field = col.fields.getByName('tipo')
    if (field) {
      field.values = field.values.filter((v) => v !== 'observacao_clinica')
    }
    app.save(col)
  },
)
