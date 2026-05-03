migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    if (!col.fields.getByName('verified_at')) {
      col.fields.add(new DateField({ name: 'verified_at' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.fields.removeByName('verified_at')
    app.save(col)
  },
)
