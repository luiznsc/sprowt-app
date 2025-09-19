import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { database } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  FileText, 
  Calendar, 
  BookOpen,
  Heart,
  Star,
  Brain,
  Plus,
  StickyNote
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [data, setData] = useState({
    turmas: [],
    alunos: [],
    relatorios: [],
    observacoes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [turmas, alunos, relatorios, observacoes] = await Promise.all([
          database.getTurmas(),
          database.getAlunos(),
          database.getRelatorios(),
          database.getAllObservacoes()
        ]);

        setData({ turmas, alunos, relatorios, observacoes});
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const stats = [
    {
      title: "Turmas Ativas",
      value: data.turmas.length.toString(),
      icon: Users,
      color: "bg-gradient-primary",
      description: data.turmas.length > 0 
        ? data.turmas.map(t => t.nome).join(", ") 
        : "Nenhuma turma cadastrada"
    },
    {
      title: "Total de Alunos",
      value: data.alunos.length.toString(),
      icon: BookOpen,
      color: "bg-gradient-amber",
      description: data.alunos.length > 0 
        ? "Distribuídos nas turmas" 
        : "Nenhum aluno cadastrado"
    },

    {
    title: "Observações Registradas",
      value: data.observacoes.length.toString(),
      icon: StickyNote, // ← Adicione import: MessageSquare
      color: "bg-gradient-orange",
      description: data.observacoes.length > 0 
        ? `Média: ${(data.observacoes.reduce((acc, obs) => acc + obs.range_avaliacao, 0) / data.observacoes.length).toFixed(1)} estrelas`
        : "Nenhuma observação registrada"
    },

    {
      title: "Relatórios este Mês",
      value: data.relatorios.length.toString(),
      icon: FileText,
      color: "bg-gradient-success",
      description: data.relatorios.length > 0 
        ? `${data.relatorios.filter(r => r.status === "concluido").length} concluídos` 
        : "Nenhum relatório criado"
    },
    {
      title: "Relatórios com IA",
      value: data.relatorios.filter(r => r.geradoPorIA).length.toString(),
      icon: Brain,
      color: "bg-gradient-accent",
      description: "Gerados ou revisados com IA"
    }
  ];

  const quickActions = [
    {
      title: "Novo Relatório",
      description: "Criar relatório para um aluno",
      icon: Plus,
      action: () => navigate("/relatorios"),
      color: "bg-gradient-success"
    },
    {
      title: "Gerenciar Turmas",
      description: "Organizar turmas e alunos",
      icon: Users,
      action: () => navigate("/turmas"),
      color: "bg-gradient-primary"
    },
    {
      title: "Assistente IA",
      description: "Usar IA para relatórios",
      icon: Brain,
      action: () => navigate("/ia"),
      color: "bg-gradient-accent"
    },
    {
      title: "Ver Observações",
      description: "Todas observações dos alunos",
      icon: StickyNote,
      action: () => navigate("/observacoes"),
      color: "bg-gradient-orange"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-green-custom rounded-xl p-6 text-white">
        
        <div className="flex items-center justify-between">
          <div>

            <h2 className="text-2xl font-bold mb-2">Olá, Professora {profile?.nome}! 👋</h2>
            <p className="text-white/90 text-lg">
              Bem-vinda ao seu sistema de relatórios. Vamos cuidar juntas do desenvolvimento dos pequenos!
            </p>
            <div className="flex items-center gap-4 mt-4 text-white/80">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Com amor</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span className="text-sm">Com cuidado</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                <span className="text-sm">Com inteligência</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-white shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-[100px] mb-2" />
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-3 w-[120px] mt-2" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground min-h-10">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 min-h-8">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`${stat.color} rounded-lg p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="bg-white shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-[150px] mb-1" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={index} 
                  className="bg-white shadow-soft hover:shadow-medium transition-smooth cursor-pointer"
                  onClick={action.action}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${action.color} rounded-lg p-2`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Últimas ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/*
              Recent activity items can be mapped here
            */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
