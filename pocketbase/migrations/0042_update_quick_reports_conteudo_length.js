migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('quick_reports')
    const field = col.fields.getByName('conteudo')
    if (field) {
      field.max = 50000
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('quick_reports')
    const field = col.fields.getByName('conteudo')
    if (field) {
      field.max = 5000
      app.save(col)
    }
  },
)
