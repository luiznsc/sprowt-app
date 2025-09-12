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
  Plus
} from "lucide-react";

export function DashboardHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [data, setData] = useState({
    turmas: [],
    alunos: [],
    relatorios: []
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [turmas, alunos, relatorios] = await Promise.all([
          database.getTurmas(),
          database.getAlunos(),
          database.getRelatorios()
        ]);

        setData({ turmas, alunos, relatorios });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
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
      color: "bg-gradient-secondary",
      description: data.alunos.length > 0 
        ? "Distribuídos nas turmas" 
        : "Nenhum aluno cadastrado"
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
      color: "bg-gradient-primary"
    },
    {
      title: "Gerenciar Turmas",
      description: "Organizar turmas e alunos",
      icon: Users,
      action: () => navigate("/turmas"),
      color: "bg-gradient-secondary"
    },
    {
      title: "Assistente IA",
      description: "Usar IA para relatórios",
      icon: Brain,
      action: () => navigate("/ia"),
      color: "bg-gradient-accent"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white">
        
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
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
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
          })}
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