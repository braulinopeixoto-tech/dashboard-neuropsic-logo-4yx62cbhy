migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alertas')
    if (!col.fields.getByName('intervencao_realizada')) {
      col.fields.add(new BoolField({ name: 'intervencao_realizada' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alertas')
    if (col.fields.getByName('intervencao_realizada')) {
      col.fields.removeByName('intervencao_realizada')
    }
    app.save(col)
  },
)
