import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  data_nascimento: string
  responsavel: string
  telefone?: string
  observacoes?: string
  relatorios_count: number
  created_at: string
}

export interface ObservacaoAluno {
  id: number;
  id_aluno: string;
  data_registro: string;
  tipo_obs: TipoObservacao;
  range_avaliacao: number;
  obs: string;
  created_at: string;
  updated_at: string;
}

export type TipoObservacao = 
  | 'comportamental'
  | 'cognitivo'
  | 'motora'
  | 'alimentacao'
  | 'social'
  | 'comunicacao'
  | 'autonomia'
  | 'rotina';

export interface CreateObservacaoData {
  id_aluno: string;
  tipo_obs: TipoObservacao;
  range_avaliacao: number;
  obs: string;
}

export interface ObservacaoFormData {
  tipo_obs: TipoObservacao;
  range_avaliacao: number;
  obs: string;
}

export interface Relatorio {
  id: string
  aluno_id: string
  conteudo: string
  data: string
  created_at: string
}

// ============================================
// FUNÇÕES DE ACESSO AO BANCO - COMPLETAS
// ============================================

const database = {

  // ============================================
  // FUNÇÕES DE AUTENTICAÇÃO E VALIDAÇÃO
  // ============================================

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(`Erro de autenticação: ${error.message}`);
    if (!user) throw new Error('Usuário não autenticado');
    return user;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw new Error(`Erro ao buscar perfil: ${error.message}`);
    return data;
  },

  // ============================================
  // TURMAS - FUNÇÕES ORIGINAIS + VALIDAÇÃO
  // ============================================

  async getTurmas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createTurma(turma: Omit<Turma, 'id' | 'created_at' | 'alunos_count'>) {
    const { data, error } = await supabase
      .from('turmas')
      .insert({
        nome: turma.nome,
        faixa_etaria: turma.faixa_etaria,
        cor: turma.cor
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateTurma(id: string, turma: Partial<Omit<Turma, 'id' | 'created_at' | 'alunos_count'>>) {
    const updateData: any = {};
    if (turma.nome) updateData.nome = turma.nome;
    if (turma.faixa_etaria) updateData.faixa_etaria = turma.faixa_etaria;
    if (turma.cor) updateData.cor = turma.cor;

    const { data, error } = await supabase
      .from('turmas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // FUNÇÃO ORIGINAL (SEM VALIDAÇÃO) - MANTIDA PARA COMPATIBILIDADE
  async deleteTurma(id: string) {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // NOVA FUNÇÃO COM VALIDAÇÃO - PROFESSOR OU ADMIN PODEM DELETAR
  async deleteTurmaWithValidation(turmaId: string) {
    // 1. Verificar autenticação
    const currentUser = await this.getCurrentUser();
    
    // 2. Verificar permissão (PROFESSOR OU ADMIN)
    const userProfile = await this.getUserProfile(currentUser.id);
    if (!userProfile || !['professor', 'admin'].includes(userProfile.tipo)) {
      throw new Error('Permissão negada. Apenas professores e administradores podem deletar turmas.');
    }

    // 3. Buscar dados da turma
    const { data: turma, error: turmaError } = await supabase
      .from('turmas')
      .select('nome, faixa_etaria')
      .eq('id', turmaId)
      .single();

    if (turmaError || !turma) {
      throw new Error('Turma não encontrada');
    }

    // 4. Contar registros que serão deletados
    const { count: alunosCount } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('turma_id', turmaId);

    let totalObservacoes = 0;
    let totalRelatorios = 0;

    if (alunosCount && alunosCount > 0) {
      const { data: alunos } = await supabase
        .from('alunos')
        .select('id')
        .eq('turma_id', turmaId);

      for (const aluno of alunos || []) {
        const { count: obsCount } = await supabase
          .from('observacoes_aluno')
          .select('*', { count: 'exact', head: true })
          .eq('id_aluno', aluno.id);

        const { count: relCount } = await supabase
          .from('relatorios')
          .select('*', { count: 'exact', head: true })
          .eq('aluno_id', aluno.id);

        totalObservacoes += obsCount || 0;
        totalRelatorios += relCount || 0;
      }
    }

    // 5. Executar deleção (CASCADE fará o resto)
    const { error: deleteError } = await supabase
      .from('turmas')
      .delete()
      .eq('id', turmaId);

    if (deleteError) {
      throw new Error(`Erro ao deletar turma: ${deleteError.message}`);
    }

    // 6. Retornar resultado detalhado
    return {
      sucesso: true,
      turma: turma.nome,
      usuario: userProfile.nome,
      dadosRemovidos: {
        alunos: alunosCount || 0,
        observacoes: totalObservacoes,
        relatorios: totalRelatorios
      }
    };
  },

  // ============================================
  // ALUNOS - FUNÇÕES ORIGINAIS + VALIDAÇÃO
  // ============================================

  async getAlunos() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome')
    
    if (error) throw error
    return data
  },

  async createAluno(aluno: Omit<Aluno, 'id' | 'created_at' | 'relatorios_count'>) {
    const { data, error } = await supabase
      .from('alunos')
      .insert({
        nome: aluno.nome,
        turma_id: aluno.turma_id,
        data_nascimento: aluno.data_nascimento,
        responsavel: aluno.responsavel,
        telefone: aluno.telefone,
        observacoes: aluno.observacoes
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateAluno(id: string, aluno: Partial<Omit<Aluno, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // FUNÇÃO ORIGINAL (SEM VALIDAÇÃO) - MANTIDA PARA COMPATIBILIDADE
  async deleteAluno(id: string) {
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // NOVA FUNÇÃO COM VALIDAÇÃO - PROFESSOR OU ADMIN PODEM DELETAR
  async deleteAlunoWithValidation(alunoId: string) {
    // 1. Verificar autenticação
    const currentUser = await this.getCurrentUser();
    
    // 2. Verificar permissão (PROFESSOR OU ADMIN)
    const userProfile = await this.getUserProfile(currentUser.id);
    if (!userProfile || !['professor', 'admin'].includes(userProfile.tipo)) {
      throw new Error('Permissão negada. Apenas professores e administradores podem deletar alunos.');
    }

    // 3. Buscar dados do aluno
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('nome, turma_id, responsavel')
      .eq('id', alunoId)
      .single();

    if (alunoError || !aluno) {
      throw new Error('Aluno não encontrado');
    }

    // 4. Contar registros relacionados que serão deletados
    const { count: observacoesCount } = await supabase
      .from('observacoes_aluno')
      .select('*', { count: 'exact', head: true })
      .eq('id_aluno', alunoId);

    const { count: relatoriosCount } = await supabase
      .from('relatorios')
      .select('*', { count: 'exact', head: true })
      .eq('aluno_id', alunoId);

    // 5. Executar deleção (CASCADE cuidará das observações e relatórios)
    const { error: deleteError } = await supabase
      .from('alunos')
      .delete()
      .eq('id', alunoId);

    if (deleteError) {
      throw new Error(`Erro ao deletar aluno: ${deleteError.message}`);
    }

    // 6. Retornar resultado detalhado
    return {
      sucesso: true,
      aluno: aluno.nome,
      usuario: userProfile.nome,
      dadosRemovidos: {
        observacoes: observacoesCount || 0,
        relatorios: relatoriosCount || 0
      }
    };
  },

  // ============================================
  // OBSERVAÇÕES - FUNÇÕES ORIGINAIS + VALIDAÇÃO
  // ============================================

  async getObservacoesByAluno(alunoId: string) {
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .select('*')
      .eq('id_aluno', alunoId)
      .order('data_registro', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createObservacao(observacao: CreateObservacaoData) {
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .insert([observacao])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateObservacao(id: number, updates: Partial<CreateObservacaoData>) {
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // FUNÇÃO ORIGINAL (SEM VALIDAÇÃO) - MANTIDA PARA COMPATIBILIDADE
  async deleteObservacao(id: number) {
    const { error } = await supabase
      .from('observacoes_aluno')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // NOVA FUNÇÃO COM VALIDAÇÃO - PROFESSOR OU ADMIN PODEM DELETAR
  async deleteObservacaoWithValidation(observacaoId: number) {
    // 1. Verificar autenticação
    const currentUser = await this.getCurrentUser();
    
    // 2. Verificar permissão (PROFESSOR OU ADMIN)
    const userProfile = await this.getUserProfile(currentUser.id);
    if (!userProfile || !['professor', 'admin'].includes(userProfile.tipo)) {
      throw new Error('Permissão negada. Apenas professores e administradores podem deletar observações.');
    }

    // 3. Executar deleção
    const { error } = await supabase
      .from('observacoes_aluno')
      .delete()
      .eq('id', observacaoId);

    if (error) throw new Error(`Erro ao deletar observação: ${error.message}`);

    return { 
      sucesso: true, 
      usuario: userProfile.nome 
    };
  },

  async getAllObservacoes() {
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .select(`
        *,
        alunos!id_aluno(nome, turma_id)
      `)
      .order('data_registro', { ascending: false })
    
    if (error) throw error
    return data
  },

  // ============================================
  // RELATÓRIOS - FUNÇÕES ORIGINAIS + VALIDAÇÃO
  // ============================================

  async getRelatorios() {
    const { data, error } = await supabase
      .from('relatorios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createRelatorio(relatorio: {
    aluno_id: string;
    titulo: string;
    periodo: string;
    conteudo: string;
    observacoes: string;
    status: 'rascunho' | 'concluido';
    gerado_por_ia: boolean;
  }) {
    const { data, error } = await supabase
      .from('relatorios')
      .insert(relatorio)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateRelatorio(id: string, updates: {
    titulo?: string;
    periodo?: string;
    conteudo?: string;
    observacoes?: string;
    status?: 'rascunho' | 'concluido';
  }) {
    const { data, error } = await supabase
      .from('relatorios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // FUNÇÃO ORIGINAL (SEM VALIDAÇÃO) - MANTIDA PARA COMPATIBILIDADE
  async deleteRelatorio(id: string) {
    const { error } = await supabase
      .from('relatorios')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // NOVA FUNÇÃO COM VALIDAÇÃO - PROFESSOR OU ADMIN PODEM DELETAR
  async deleteRelatorioWithValidation(relatorioId: string) {
    // 1. Verificar autenticação
    const currentUser = await this.getCurrentUser();
    
    // 2. Verificar permissão (PROFESSOR OU ADMIN)
    const userProfile = await this.getUserProfile(currentUser.id);
    if (!userProfile || !['professor', 'admin'].includes(userProfile.tipo)) {
      throw new Error('Permissão negada. Apenas professores e administradores podem deletar relatórios.');
    }

    // 3. Executar deleção
    const { error } = await supabase
      .from('relatorios')
      .delete()
      .eq('id', relatorioId);

    if (error) throw new Error(`Erro ao deletar relatório: ${error.message}`);

    return { 
      sucesso: true, 
      usuario: userProfile.nome 
    };
  },

  // ============================================
  // FUNCTIONS AVANÇADAS (MANTIDAS ORIGINAIS)
  // ============================================

  async getDashboardObservacoes() {
    const { data, error } = await supabase
      .from('dashboard_observacoes')
      .select('*')
    
    if (error) throw error
    return data || []
  },

  async getProgressoAluno(alunoId: string) {
    const { data, error } = await supabase
      .rpc('get_progresso_aluno', { aluno_uuid: alunoId })
    
    if (error) throw error
    return data || []
  },

  async getMediaAvaliacaoAluno(alunoId: string) {
    const { data, error } = await supabase
      .rpc('get_aluno_media_avaliacao', { aluno_uuid: alunoId })
    
    if (error) throw error
    return data || 0
  },

  async getObservacoesPeriodo(dataInicio: string, dataFim: string, alunoId?: string) {
    const { data, error } = await supabase
      .rpc('get_observacoes_periodo', {
        data_inicio: dataInicio,
        data_fim: dataFim,
        aluno_uuid: alunoId || null
      })
    
    if (error) throw error
    return data || []
  },

  async getEstatisticasTurma(turmaId: string) {
    const { data, error } = await supabase
      .rpc('get_estatisticas_turma', { turma_uuid: turmaId })
    
    if (error) throw error
    return data?.[0] || null
  },

  // Busca com texto completo
  async searchObservacoes(searchTerm: string) {
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .select(`
        *,
        alunos!id_aluno(nome, turma_id)
      `)
      .textSearch('obs', searchTerm, {
        type: 'websearch',
        config: 'portuguese'
      })
      .order('data_registro', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

export { supabase, database };
