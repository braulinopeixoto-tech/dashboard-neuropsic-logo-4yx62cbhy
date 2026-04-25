migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')

    if (!col.fields.getByName('endereco')) {
      col.fields.add(new TextField({ name: 'endereco', required: true }))
    }
    if (!col.fields.getByName('documento')) {
      col.fields.add(new TextField({ name: 'documento', required: true }))
    }
    if (!col.fields.getByName('queixa_principal')) {
      col.fields.add(new TextField({ name: 'queixa_principal' }))
    }
    if (!col.fields.getByName('historico_medico')) {
      col.fields.add(new TextField({ name: 'historico_medico' }))
    }
    if (!col.fields.getByName('medicacoes_atuais')) {
      col.fields.add(new TextField({ name: 'medicacoes_atuais' }))
    }
    if (!col.fields.getByName('exames')) {
      col.fields.add(
        new FileField({
          name: 'exames',
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg'],
        }),
      )
    }

    col.addIndex('idx_pacientes_email_unique', true, 'email', "email != ''")

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')
    col.fields.removeByName('endereco')
    col.fields.removeByName('documento')
    col.fields.removeByName('queixa_principal')
    col.fields.removeByName('historico_medico')
    col.fields.removeByName('medicacoes_atuais')
    col.fields.removeByName('exames')

    col.removeIndex('idx_pacientes_email_unique')

    app.save(col)
  },
)
