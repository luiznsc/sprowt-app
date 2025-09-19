import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Turma {
  id: string
  nome: string
  faixa_etaria: string
  cor: string
  alunos_count: number // Reverted to alunos_count as per database pattern
  professor_id: string  
  created_at: string
}

export interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  data_nascimento: string;
  responsavel: string;
  telefone?: string;
  observacoes?: string;
  relatorios_count: number;
  observacoes_count: number;
  professor_id: string;
  created_at: string;
  turma?: string; // Added for the joined turma name
}


export interface ObservacaoAluno {
  id: number;
  id_aluno: string;
  data_registro: string;
  tipo_obs: TipoObservacao;
  range_avaliacao: number;
  obs: string;
  professor_id: string;
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

export type FilterTipoObservacao = TipoObservacao | 'todos';

export interface CreateObservacaoData {
  id_aluno: string;
  tipo_obs: TipoObservacao;
  range_avaliacao: number;
  obs: string;
}

export interface Relatorio {
  id: string
  aluno_id: string
  titulo: string
  periodo: string
  conteudo: string
  observacoes: string
  status: 'rascunho' | 'concluido'
  gerado_por_ia: boolean
  professor_id: string 
  data: string
  created_at: string
}

export interface UserProfile {
  id: string;
  nome: string;
  tipo: 'admin' | 'professor';
  created_at: string;
}


class DatabaseHelper {
  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(`Erro de autenticação: ${error.message}`);
    if (!user) throw new Error('Usuário não autenticado');
    return user;
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(`Erro ao buscar perfil: ${error.message}`);
    return data;
  }

  private async determineProfessorId(forProfessorId?: string): Promise<string> {
    const user = await this.getCurrentUser();
    const profile = await this.getUserProfile(user.id);
    
    if (profile.tipo === 'admin') {
      return forProfessorId || user.id;
    }
    
    if (profile.tipo === 'professor') {
      if (forProfessorId && forProfessorId !== user.id) {
        throw new Error('Professores só podem criar dados para si mesmos');
      }
      return user.id;
    }
    
    throw new Error('Tipo de usuário não autorizado');
  }

  private async validatePermissions(): Promise<{ user: User, profile: UserProfile }> {
    const user = await this.getCurrentUser();
    const profile = await this.getUserProfile(user.id);
    
    if (!['admin', 'professor'].includes(profile.tipo)) {
      throw new Error('Permissão negada. Apenas professores e administradores podem realizar esta operação.');
    }
    
    return { user, profile };
  }


  async getTurmas() {
    const { user } = await this.validatePermissions(); // Obter o usuário para filtrar
    
    const { data, error } = await supabase
      .from('turmas')
      .select('*') // Select all from turmas, assuming alunos_count is a direct column
      .eq('professor_id', user.id) // Filtrar por professor_id
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // No need to map if alunos_count is directly selected
    return data;
  }

  async getTurma(turmaId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', turmaId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createTurma(turma: Omit<Turma, 'id' | 'created_at' | 'alunos_count' | 'professor_id'>, forProfessorId?: string) {
    const professorId = await this.determineProfessorId(forProfessorId);

    const { data, error } = await supabase
      .from('turmas')
      .insert({
        nome: turma.nome,
        faixa_etaria: turma.faixa_etaria,
        cor: turma.cor,
        professor_id: professorId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTurma(turmaId: string, updates: Partial<Omit<Turma, 'id' | 'created_at' | 'alunos_count' | 'professor_id'>>) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('turmas')
      .update(updates) // Use updates directly
      .eq('id', turmaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTurma(turmaId: string) {
    await this.validatePermissions();
    
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', turmaId);
    
    if (error) throw error;
    return true;
  }


  async getAlunos() {
    const { user } = await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        *,
        turmas(nome)
      `) // Select all from alunos, and the name from the related turma
      .eq('professor_id', user.id) // Filtrar por professor_id
      .order('nome');
    
    if (error) throw error;

    // Map the data to ensure turma name is directly accessible
    return data.map(aluno => ({
      ...aluno,
      turma: aluno.turmas?.nome || 'Sem Turma' // Add turma name directly
    }));
  }

  async getAluno(alunoId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getAlunosByTurma(turmaId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('nome');
    
    if (error) throw error;
    return data;
  }

  async createAluno(aluno: Omit<Aluno, 'id' | 'created_at' | 'relatorios_count' | 'observacoes_count' | 'professor_id'>, forProfessorId?: string) {
    const professorId = await this.determineProfessorId(forProfessorId);

    const { data, error } = await supabase
      .from('alunos')
      .insert({
        nome: aluno.nome,
        turma_id: aluno.turma_id,
        data_nascimento: aluno.data_nascimento,
        responsavel: aluno.responsavel,
        telefone: aluno.telefone,
        observacoes: aluno.observacoes,
        professor_id: professorId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAluno(alunoId: string, updates: Partial<Omit<Aluno, 'id' | 'created_at' | 'professor_id'>>) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('alunos')
      .update(updates)
      .eq('id', alunoId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAluno(alunoId: string) {
    await this.validatePermissions();
    
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', alunoId);
    
    if (error) throw error;
    return true;
  }

  async getAllObservacoes(alunoId?: string, tipoObs?: FilterTipoObservacao) {
    const { user } = await this.validatePermissions(); // Obter o usuário para filtrar
    
    let query = supabase
      .from('observacoes_aluno')
      .select(`
        *,
        alunos!id_aluno(nome, turma_id)
      `)
      .eq('professor_id', user.id); // Filtrar por professor_id

    if (alunoId && alunoId !== "todos") {
      query = query.eq('id_aluno', alunoId);
    }
    if (tipoObs && tipoObs !== "todos") {
      query = query.eq('tipo_obs', tipoObs as TipoObservacao); // Cast to TipoObservacao
    }

    const { data, error } = await query.order('data_registro', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getObservacao(observacaoId: number) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .select('*')
      .eq('id', observacaoId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getObservacoesByAluno(alunoId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .select('*')
      .eq('id_aluno', alunoId)
      .order('data_registro', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createObservacao(observacao: CreateObservacaoData, forProfessorId?: string) {
    const professorId = await this.determineProfessorId(forProfessorId);

    const { data, error } = await supabase
      .from('observacoes_aluno')
      .insert({
        ...observacao,
        professor_id: professorId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateObservacao(observacaoId: number, updates: Partial<CreateObservacaoData>) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('observacoes_aluno')
      .update(updates)
      .eq('id', observacaoId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteObservacao(observacaoId: number) {
    await this.validatePermissions();
    
    const { error } = await supabase
      .from('observacoes_aluno')
      .delete()
      .eq('id', observacaoId);
    
    if (error) throw error;
    return true;
  }

  // ============================================
  // RELATÓRIOS - CRUD COMPLETO COM VALIDAÇÕES
  // ============================================

  async getRelatorios() {
    const { user } = await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('relatorios')
      .select('*')
      .eq('professor_id', user.id) // Filtrar por professor_id
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getRelatorio(relatorioId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('relatorios')
      .select('*')
      .eq('id', relatorioId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getRelatoriosByAluno(alunoId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('relatorios')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createRelatorio(relatorio: Omit<Relatorio, 'id' | 'created_at' | 'professor_id'>, forProfessorId?: string) {
    const professorId = await this.determineProfessorId(forProfessorId);

    const { data, error } = await supabase
      .from('relatorios')
      .insert({
        ...relatorio,
        professor_id: professorId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRelatorio(relatorioId: string, updates: Partial<Omit<Relatorio, 'id' | 'created_at' | 'professor_id'>>) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('relatorios')
      .update(updates)
      .eq('id', relatorioId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteRelatorio(relatorioId: string) {
    await this.validatePermissions();
    
    const { error } = await supabase
      .from('relatorios')
      .delete()
      .eq('id', relatorioId);
    
    if (error) throw error;
    return true;
  }


  async deleteTurmaWithValidation(turmaId: string) {
    const { profile } = await this.validatePermissions();

    const { data: turma, error: turmaError } = await supabase
      .from('turmas')
      .select('nome, faixa_etaria')
      .eq('id', turmaId)
      .single();

    if (turmaError || !turma) {
      throw new Error('Turma não encontrada');
    }

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

    const { error: deleteError } = await supabase
      .from('turmas')
      .delete()
      .eq('id', turmaId);

    if (deleteError) {
      throw new Error(`Erro ao deletar turma: ${deleteError.message}`);
    }

    return {
      sucesso: true,
      turma: turma.nome,
      usuario: profile.nome,
      dadosRemovidos: {
        alunos: alunosCount || 0,
        observacoes: totalObservacoes,
        relatorios: totalRelatorios
      }
    };
  }

  async deleteAlunoWithValidation(alunoId: string) {
    const { profile } = await this.validatePermissions();

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('nome, turma_id, responsavel')
      .eq('id', alunoId)
      .single();

    if (alunoError || !aluno) {
      throw new Error('Aluno não encontrado');
    }

    const { count: observacoesCount } = await supabase
      .from('observacoes_aluno')
      .select('*', { count: 'exact', head: true })
      .eq('id_aluno', alunoId);

    const { count: relatoriosCount } = await supabase
      .from('relatorios')
      .select('*', { count: 'exact', head: true })
      .eq('aluno_id', alunoId);

    const { error: deleteError } = await supabase
      .from('alunos')
      .delete()
      .eq('id', alunoId);

    if (deleteError) {
      throw new Error(`Erro ao deletar aluno: ${deleteError.message}`);
    }

    return {
      sucesso: true,
      aluno: aluno.nome,
      usuario: profile.nome,
      dadosRemovidos: {
        observacoes: observacoesCount || 0,
        relatorios: relatoriosCount || 0
      }
    };
  }

  async deleteObservacaoWithValidation(observacaoId: number) {
    const { profile } = await this.validatePermissions();

    const { error } = await supabase
      .from('observacoes_aluno')
      .delete()
      .eq('id', observacaoId);

    if (error) throw new Error(`Erro ao deletar observação: ${error.message}`);

    return {
      sucesso: true,
      usuario: profile.nome
    };
  }

  async deleteRelatorioWithValidation(relatorioId: string) {
    const { profile } = await this.validatePermissions();

    const { error } = await supabase
      .from('relatorios')
      .delete()
      .eq('id', relatorioId);

    if (error) throw new Error(`Erro ao deletar relatório: ${error.message}`);

    return {
      sucesso: true,
      usuario: profile.nome
    };
  }

  async getDashboardObservacoes() {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .from('dashboard_observacoes')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getProgressoAluno(alunoId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .rpc('get_progresso_aluno', { aluno_uuid: alunoId });
    
    if (error) throw error;
    return data || [];
  }

  async getMediaAvaliacaoAluno(alunoId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .rpc('get_aluno_media_avaliacao', { aluno_uuid: alunoId });
    
    if (error) throw error;
    return data || 0;
  }

  async getObservacoesPeriodo(dataInicio: string, dataFim: string, alunoId?: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .rpc('get_observacoes_periodo', {
        data_inicio: dataInicio,
        data_fim: dataFim,
        aluno_uuid: alunoId || null
      });
    
    if (error) throw error;
    return data || [];
  }

  async getEstatisticasTurma(turmaId: string) {
    await this.validatePermissions();
    
    const { data, error } = await supabase
      .rpc('get_estatisticas_turma', { turma_uuid: turmaId });
    
    if (error) throw error;
    return data?.[0] || null;
  }

  async searchObservacoes(searchTerm: string) {
    await this.validatePermissions();
    
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
      .order('data_registro', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

const database = new DatabaseHelper();

export { supabase, database };
