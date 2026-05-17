migrate(
  (app) => {
    let collection
    try {
      collection = app.findCollectionByNameOrId('quick_reports')
    } catch (_) {
      collection = new Collection({
        name: 'quick_reports',
        type: 'base',
        fields: [
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
    }

    collection.listRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    collection.viewRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    collection.createRule = "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'"
    collection.updateRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    collection.deleteRule = "@request.auth.id != '' && usuario_id = @request.auth.id"

    if (!collection.fields.getByName('usuario_id')) {
      collection.fields.add(
        new RelationField({
          name: 'usuario_id',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }
    if (!collection.fields.getByName('paciente_id')) {
      collection.fields.add(
        new RelationField({
          name: 'paciente_id',
          required: true,
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }
    if (!collection.fields.getByName('titulo')) {
      collection.fields.add(new TextField({ name: 'titulo', required: true }))
    }
    if (!collection.fields.getByName('conteudo')) {
      collection.fields.add(new TextField({ name: 'conteudo', required: true }))
    }

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('quick_reports')
      app.delete(col)
    } catch (_) {}
  },
)
