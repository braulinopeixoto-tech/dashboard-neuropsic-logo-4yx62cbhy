import pb from '@/lib/pocketbase/client'

export const getReceitas = async () => {
  return pb.collection('receitas').getFullList({ sort: '-data', expand: 'categoria_receita' })
}

export const getDespesas = async () => {
  return pb.collection('despesas').getFullList({ sort: '-data' })
}

export const getCategoriasDespesas = async () => {
  return pb.collection('categorias_despesas').getFullList({ sort: 'nome' })
}

export const getCategoriasReceitas = async () => {
  return pb.collection('categorias_receitas').getFullList({ sort: 'nome' })
}

export const createReceita = async (data: any) => {
  return pb.collection('receitas').create(data)
}

export const createDespesa = async (data: any) => {
  return pb.collection('despesas').create(data)
}
