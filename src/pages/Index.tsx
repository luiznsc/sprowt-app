import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { TurmasManager } from "@/components/turmas/TurmasManager";
import { AlunosManager } from "@/components/alunos/AlunosManager";
import { RelatoriosManager } from "@/components/relatorios/RelatoriosManager";
import { AssistenteIA } from "@/components/ia/AssistenteIA";
import { useToast } from "@/hooks/use-toast";

interface Turma {
  id: string;
  nome: string;
  faixaEtaria: string;
  cor: string;
  alunosCount: number;
}

interface Aluno {
  id: string;
  nome: string;
  idade: number;
  turmaId: string;
  turma: string;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  observacoes: string;
  relatoriosCount: number;
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

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const { toast } = useToast();

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const savedTurmas = localStorage.getItem("edurelatos_turmas");
    const savedAlunos = localStorage.getItem("edurelatos_alunos");
    const savedRelatorios = localStorage.getItem("edurelatos_relatorios");

    if (savedTurmas) setTurmas(JSON.parse(savedTurmas));
    if (savedAlunos) setAlunos(JSON.parse(savedAlunos));
    if (savedRelatorios) setRelatorios(JSON.parse(savedRelatorios));
  }, []);

  // Salvar dados no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem("edurelatos_turmas", JSON.stringify(turmas));
  }, [turmas]);

  useEffect(() => {
    localStorage.setItem("edurelatos_alunos", JSON.stringify(alunos));
  }, [alunos]);

  useEffect(() => {
    localStorage.setItem("edurelatos_relatorios", JSON.stringify(relatorios));
  }, [relatorios]);

  const handleLogin = async (email: string, password: string) => {
    // Simulação de login - em produção, usar Supabase Auth
    if (email && password) {
      setIsAuthenticated(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vinda ao EduRelatos",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab("dashboard");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Função para integração com OpenAI
  const handleRequestAI = async (prompt: string, alunoNome?: string): Promise<string> => {
    const apiKey = localStorage.getItem("openai_api_key");
    
    if (!apiKey) {
      throw new Error("API Key não configurada");
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é uma especialista em educação infantil, pedagoga experiente que cria relatórios educacionais carinhosos, construtivos e profissionais. Sempre use linguagem positiva e adequada para relatórios escolares.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro da API: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      throw new Error('Erro ao processar solicitação de IA');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome onNavigate={handleTabChange} />;
      case "turmas":
        return (
          <TurmasManager 
            turmas={turmas} 
            onTurmasChange={setTurmas}
          />
        );
      case "alunos":
        return (
          <AlunosManager 
            alunos={alunos}
            turmas={turmas}
            onAlunosChange={setAlunos}
            onTurmasChange={setTurmas}
          />
        );
      case "relatorios":
        return (
          <RelatoriosManager 
            relatorios={relatorios}
            alunos={alunos}
            onRelatoriosChange={setRelatorios}
            onAlunosChange={setAlunos}
            onRequestAI={handleRequestAI}
          />
        );
      case "ia":
        return (
          <AssistenteIA 
            alunos={alunos}
            onRequestAI={handleRequestAI}
          />
        );
      default:
        return <DashboardHome onNavigate={handleTabChange} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
