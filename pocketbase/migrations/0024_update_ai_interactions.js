migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('ai_interactions')
    if (!col.fields.getByName('model')) col.fields.add(new TextField({ name: 'model' }))
    if (!col.fields.getByName('tokens_used'))
      col.fields.add(new NumberField({ name: 'tokens_used' }))

    col.listRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.deleteRule = "@request.auth.id != '' && usuario_id = @request.auth.id"

    app.save(col)
  },
  (app) => {},
)
