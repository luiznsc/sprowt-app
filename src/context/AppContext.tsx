import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { database, Aluno as DBAluno, Turma as DBTurma, Relatorio as DBRelatorio } from '@/lib/supabase';
import { createClient, User, Session } from '@supabase/supabase-js';

// Inicializar cliente Supabase para autenticação
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interfaces para o contexto da aplicação, adaptadas das interfaces do Supabase
export interface Aluno {
  id: string;
  nome: string;
  turmaId: string; // Renamed from turma_id
  turma?: string; // Added from join
  idade: number; // Calculated
  dataNascimento: string; // Renamed from data_nascimento
  responsavel: string;
  telefone?: string;
  observacoes?: string;
  relatorios_count: number;
  observacoes_count: number;
  professor_id: string;
  created_at: string;
}

export interface Turma {
  id: string;
  nome: string;
  faixaEtaria: string; // Renamed from faixa_etaria
  cor: string;
  alunosCount: number; // Renamed from alunos_count
  professor_id: string;
  created_at: string;
}

export interface Relatorio {
  id: string;
  alunoId: string; // Renamed from aluno_id
  alunoNome: string; // Added from join
  turma: string; // Added from join
  titulo: string;
  periodo: string;
  conteudo: string;
  observacoes?: string;
  status: 'rascunho' | 'concluido';
  geradoPorIA: boolean; // Renamed from gerado_por_ia
  professor_id: string;
  data: string;
  criadoEm: string; // Renamed from created_at
  atualizadoEm: string; // Not in DBRelatorio, but used in frontend
}

export interface AppContextType {
  // Estados existentes
  alunos: Aluno[];
  turmas: Turma[];
  relatorios: Relatorio[];
  loading: boolean;
  onAlunosChange: (alunos: Aluno[]) => void;
  onTurmasChange: (turmas: Turma[]) => void;
  onRelatoriosChange: (relatorios: Relatorio[]) => void;
  refreshAlunos: () => Promise<void>; // Adicionar função para recarregar alunos
  
  // NOVOS: Estados de autenticação
  user: User | null;
  session: Session | null;
  supabase: typeof supabase;
  authLoading: boolean;
  
  // ATUALIZADA: Função AI real
  onRequestAI: (prompt: string, alunoNome?: string) => Promise<string>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Estados existentes
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);

  // NOVOS: Estados de autenticação
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Efeito para gerenciar autenticação
  useEffect(() => {
    // Pegar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Função para transformar dados do banco para o formato da aplicação
  const transformTurmaData = (turma: DBTurma): Turma => ({
    id: turma.id,
    nome: turma.nome,
    faixaEtaria: turma.faixa_etaria,
    cor: turma.cor,
    alunosCount: turma.alunos_count || 0,
    professor_id: turma.professor_id,
    created_at: turma.created_at,
  });

  const transformAlunoData = (aluno: DBAluno): Aluno => {
    const hoje = new Date();
    const nascimento = new Date(aluno.data_nascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return {
      id: aluno.id,
      nome: aluno.nome,
      turmaId: aluno.turma_id,
      turma: aluno.turma || 'Sem Turma',
      idade: idade,
      dataNascimento: aluno.data_nascimento,
      responsavel: aluno.responsavel,
      telefone: aluno.telefone || '',
      observacoes: aluno.observacoes || '',
      relatorios_count: aluno.relatorios_count || 0,
      observacoes_count: aluno.observacoes_count || 0,
      professor_id: aluno.professor_id,
      created_at: aluno.created_at,
    };
  };

  const transformRelatorioData = (relatorio: DBRelatorio, alunosTransformed: Aluno[]): Relatorio => {
    const aluno = alunosTransformed.find(a => a.id === relatorio.aluno_id);
    return {
      id: relatorio.id,
      alunoId: relatorio.aluno_id,
      alunoNome: aluno?.nome || 'Aluno Desconhecido',
      turma: aluno?.turma || 'Sem Turma',
      titulo: relatorio.titulo || '',
      periodo: relatorio.periodo || '',
      conteudo: relatorio.conteudo,
      observacoes: relatorio.observacoes || '',
      status: relatorio.status || 'rascunho',
      geradoPorIA: relatorio.gerado_por_ia || false,
      professor_id: relatorio.professor_id,
      data: relatorio.data,
      criadoEm: relatorio.created_at,
      atualizadoEm: relatorio.created_at, // DBRelatorio doesn't have updated_at
    };
  };

  // Efeito existente para carregar dados
  useEffect(() => {
    loadInitialData();
  }, []);

  // Funções existentes
  const onAlunosChange = useCallback((newAlunos: Aluno[]) => {
    setAlunos(newAlunos);
  }, []);

  const onTurmasChange = useCallback((newTurmas: Turma[]) => {
    setTurmas(newTurmas);
  }, []);

  const onRelatoriosChange = useCallback((newRelatorios: Relatorio[]) => {
    setRelatorios(newRelatorios);
  }, []);

  const refreshAlunos = useCallback(async () => {
    setLoading(true);
    try {
      const alunosData = await database.getAlunos();
      const turmasData = await database.getTurmas(); // Re-fetch turmas to ensure counts are correct
      
      const turmasTransformadas = turmasData.map(transformTurmaData);
      const alunosTransformados = alunosData.map(transformAlunoData);
      
      setAlunos(alunosTransformados);
      setTurmas(turmasTransformadas); // Update turmas as well
    } catch (error) {
      console.error('❌ Erro ao recarregar alunos:', error);
    } finally {
      setLoading(false);
    }
  }, [transformAlunoData, transformTurmaData]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [turmasData, alunosData, relatoriosData] = await Promise.all([
        database.getTurmas(),
        database.getAlunos(),
        database.getRelatorios()
      ]);
      
      const turmasTransformadas = turmasData.map(transformTurmaData);
      const alunosTransformados = alunosData.map(transformAlunoData);
      const relatoriosTransformados = relatoriosData.map(relatorio => transformRelatorioData(relatorio, alunosTransformados));
      
      setTurmas(turmasTransformadas);
      setAlunos(alunosTransformados);
      setRelatorios(relatoriosTransformados);
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  }

  // Função simplificada para chamar IA - apenas envia prompt do usuário
  const onRequestAI = useCallback(async (prompt: string, alunoNome?: string): Promise<string> => {
    // Verificar se usuário está autenticado
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado. Faça login para usar a IA.');
    }

    // Enviar apenas o prompt do usuário + contexto básico para o Supabase
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt, // Apenas o prompt do usuário
        alunoNome: alunoNome || null,
        tipo: 'gerar_relatorio', // Tipo específico para relatórios
        contexto: alunoNome ? `Aluno: ${alunoNome}` : null
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      throw new Error(error.message || 'Erro ao chamar IA');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'IA retornou erro desconhecido');
    }

    return data.resposta;
  }, [session]);


  return (
    <AppContext.Provider
      value={{
        // Estados existentes
        alunos,
        turmas,
        relatorios,
        loading,
        onAlunosChange,
        onTurmasChange,
        onRelatoriosChange,
        refreshAlunos,
        
        // NOVOS: Estados de autenticação
        user,
        session,
        supabase,
        authLoading,
        
        // ATUALIZADA: Função AI
        onRequestAI
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
