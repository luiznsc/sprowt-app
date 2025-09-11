import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { database } from '@/lib/supabase';

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
  alunos: Aluno[];
  turmas: Turma[];
  relatorios: Relatorio[];
  loading: boolean;
  onAlunosChange: (alunos: Aluno[]) => void;
  onTurmasChange: (turmas: Turma[]) => void;
  onRelatoriosChange: (relatorios: Relatorio[]) => void;
  onRequestAI: (prompt: string, alunoNome?: string) => Promise<string>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [turmasData, alunosData, relatoriosData] = await Promise.all([
          database.getTurmas(),
          database.getAlunos(),
          database.getRelatorios()
        ]);
        
        setTurmas(turmasData);
        setAlunos(alunosData);
        setRelatorios(relatoriosData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const onAlunosChange = useCallback((newAlunos: Aluno[]) => {
    setAlunos(newAlunos);
  }, []);

  const onTurmasChange = useCallback((newTurmas: Turma[]) => {
    setTurmas(newTurmas);
  }, []);

  const onRelatoriosChange = useCallback((newRelatorios: Relatorio[]) => {
    setRelatorios(newRelatorios);
  }, []);

  const onRequestAI = useCallback(async (prompt: string, alunoNome?: string): Promise<string> => {
    // TODO: Implementar integração com IA
    return `Resposta simulada da IA ${alunoNome ? `para ${alunoNome}` : ''}`;
  }, []);

  return (
    <AppContext.Provider
      value={{
        alunos,
        turmas,
        relatorios,
        loading,
        onAlunosChange,
        onTurmasChange,
        onRelatoriosChange,
        onRequestAI
      }}
    >
      {children}
    </AppContext.Provider>
  );
}


