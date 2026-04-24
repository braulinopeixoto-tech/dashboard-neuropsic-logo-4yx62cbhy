migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new SelectField({
        name: 'tipo',
        values: ['neuropsicólogo', 'assistente_líder', 'neuromoduladora'],
        maxSelect: 1,
      }),
    )
    users.fields.add(new TextField({ name: 'unidade' }))
    users.fields.add(new BoolField({ name: 'ativo' }))
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('tipo')
    users.fields.removeByName('unidade')
    users.fields.removeByName('ativo')
    app.save(users)
  },
)
