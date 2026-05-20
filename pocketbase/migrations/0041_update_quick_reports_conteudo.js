migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('quick_reports')
    const field = collection.fields.getByName('conteudo')

    if (field) {
      // Increase the character limit to support large clinical reports (NQL + Markdown)
      field.max = 200000
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('quick_reports')
    const field = collection.fields.getByName('conteudo')

    if (field) {
      // Revert to the previous assumed constraint
      field.max = 5000
      app.save(collection)
    }
  },
)
