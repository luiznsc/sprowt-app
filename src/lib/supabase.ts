import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas
export interface Turma {
  id: string
  nome: string
  faixa_etaria: string
  cor: string
  alunos_count: number
  created_at: string
}

export interface Aluno {
  id: string
  nome: string
  turma_id: string
  observacoes?: string
  created_at: string
}

export interface Relatorio {
  id: string
  aluno_id: string
  conteudo: string
  data: string
  created_at: string
}

// Funções de acesso ao banco
export const database = {
  // Turmas
  async getTurmas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createTurma(turma: Omit<Turma, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('turmas')
      .insert(turma)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateTurma(id: string, turma: Partial<Omit<Turma, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('turmas')
      .update(turma)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteTurma(id: string) {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Alunos
  async getAlunos() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data
  },

  async createAluno(aluno: Omit<Aluno, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('alunos')
      .insert(aluno)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Relatórios
  async getRelatorios() {
    const { data, error } = await supabase
      .from('relatorios')
      .select('*')
      .order('data', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createRelatorio(relatorio: Omit<Relatorio, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('relatorios')
      .insert(relatorio)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
