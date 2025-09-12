import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { database } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase para autenticação
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Aluno {
  id: string;
  nome: string;
  turmaId: string;
  turma: string;
  idade: number;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  observacoes: string;
  relatoriosCount: number;
}

interface Turma {
  id: string;
  nome: string;
  faixaEtaria: string;
  cor: string;
  alunosCount: number;
}

interface Relatorio {
  id: string;
  alunoId: string;
  alunoNome: string;
  turma: string;
  titulo: string;
  periodo: string;
  conteudo: string;
  observacoes: string;
  status: "rascunho" | "concluido";
  criadoEm: string;
  atualizadoEm: string;
  geradoPorIA: boolean;
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
  
  // NOVOS: Estados de autenticação
  user: any;
  session: any;
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
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
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
  const transformTurmaData = (turma: any) => ({
    id: turma.id,
    nome: turma.nome,
    faixaEtaria: turma.faixa_etaria,
    cor: turma.cor,
    alunosCount: turma.alunos_count || 0
  });

  const transformAlunoData = (aluno: any) => ({
    id: aluno.id,
    nome: aluno.nome,
    turmaId: aluno.turma_id,
    turma: '', // Será preenchido depois
    idade: 0, // Será calculado depois
    dataNascimento: aluno.data_nascimento,
    responsavel: aluno.responsavel,
    telefone: aluno.telefone || '',
    observacoes: aluno.observacoes || '',
    relatoriosCount: aluno.relatorios_count || 0
  });

  // Efeito existente para carregar dados
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [turmasData, alunosData, relatoriosData] = await Promise.all([
          database.getTurmas(),
          database.getAlunos(),
          database.getRelatorios()
        ]);
        
        // Transformar dados das turmas
        const turmasTransformadas = turmasData.map(transformTurmaData);
        
        // Transformar dados dos alunos e associar com turmas
        const alunosTransformados = alunosData.map(aluno => {
          const alunoTransformado = transformAlunoData(aluno);
          const turma = turmasTransformadas.find(t => t.id === aluno.turma_id);
          if (turma) {
            alunoTransformado.turma = turma.nome;
            // Calcular idade se tiver data de nascimento
            if (aluno.data_nascimento) {
              const hoje = new Date();
              const nascimento = new Date(aluno.data_nascimento);
              let idade = hoje.getFullYear() - nascimento.getFullYear();
              const mes = hoje.getMonth() - nascimento.getMonth();
              if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
              }
              alunoTransformado.idade = idade;
            }
          }
          return alunoTransformado;
        });
        
        // Transformar dados dos relatórios
        const relatoriosTransformados = relatoriosData.map(relatorio => ({
          id: relatorio.id,
          alunoId: relatorio.aluno_id,
          alunoNome: '', // Será preenchido depois
          turma: '', // Será preenchido depois
          titulo: relatorio.titulo || '',
          periodo: relatorio.periodo || '',
          conteudo: relatorio.conteudo,
          observacoes: relatorio.observacoes || '',
          status: relatorio.status || 'rascunho',
          criadoEm: relatorio.created_at,
          atualizadoEm: relatorio.updated_at || relatorio.created_at,
          geradoPorIA: relatorio.gerado_por_ia || false
        }));

        // Associar nomes dos alunos e turmas nos relatórios
        relatoriosTransformados.forEach(relatorio => {
          const aluno = alunosTransformados.find(a => a.id === relatorio.alunoId);
          if (aluno) {
            relatorio.alunoNome = aluno.nome;
            relatorio.turma = aluno.turma;
          }
        });

        // O relatoriosCount já vem do banco de dados
        
        setTurmas(turmasTransformadas);
        setAlunos(alunosTransformados);
        setRelatorios(relatoriosTransformados);
      } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
      } finally {
        setLoading(false);
      }
    }

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

  // Função simplificada para chamar IA - apenas envia prompt do usuário
  const onRequestAI = useCallback(async (prompt: string, alunoNome?: string): Promise<string> => {
    try {
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

    } catch (error) {
      throw error;
    }
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
