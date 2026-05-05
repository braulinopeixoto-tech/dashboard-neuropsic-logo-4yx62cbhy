migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('receitas')
    if (!col.fields.getByName('categoria_receita')) {
      const catCol = app.findCollectionByNameOrId('categorias_receitas')
      col.fields.add(
        new RelationField({
          name: 'categoria_receita',
          collectionId: catCol.id,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('receitas')
    const field = col.fields.getByName('categoria_receita')
    if (field) {
      col.fields.removeByName('categoria_receita')
      app.save(col)
    }
  },
)
