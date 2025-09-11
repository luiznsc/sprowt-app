import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, FileText, Edit2, Eye, Calendar, User, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface RelatoriosManagerProps {
  relatorios: Relatorio[];
  alunos: Aluno[];
  onRelatoriosChange: (relatorios: Relatorio[]) => void;
  onAlunosChange: (alunos: Aluno[]) => void;
  onRequestAI: (prompt: string, alunoNome: string) => Promise<string>;
}

import { useApp } from "@/context/use-app";

export function RelatoriosManager() {
  const { relatorios, alunos, loading, onRelatoriosChange, onAlunosChange, onRequestAI } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingRelatorio, setViewingRelatorio] = useState<Relatorio | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [filtroAluno, setFiltroAluno] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [formData, setFormData] = useState({
    alunoId: "",
    titulo: "",
    periodo: "",
    conteudo: "",
    observacoes: "",
    status: "rascunho" as "rascunho" | "concluido"
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      alunoId: "",
      titulo: "",
      periodo: "",
      conteudo: "",
      observacoes: "",
      status: "rascunho"
    });
  };

  const handleAdd = () => {
    if (!formData.alunoId || !formData.titulo || !formData.periodo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha aluno, título e período",
        variant: "destructive"
      });
      return;
    }

    const aluno = alunos.find(a => a.id === formData.alunoId);
    if (!aluno) return;

    const novoRelatorio: Relatorio = {
      id: Date.now().toString(),
      alunoId: formData.alunoId,
      alunoNome: aluno.nome,
      turma: aluno.turma,
      titulo: formData.titulo,
      periodo: formData.periodo,
      conteudo: formData.conteudo,
      observacoes: formData.observacoes,
      status: formData.status,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      geradoPorIA: false
    };

    onRelatoriosChange([...relatorios, novoRelatorio]);

    // Atualizar contador de relatórios do aluno
    const alunosAtualizados = alunos.map(a =>
      a.id === formData.alunoId
        ? { ...a, relatoriosCount: a.relatoriosCount + 1 }
        : a
    );
    onAlunosChange(alunosAtualizados);

    setIsAddDialogOpen(false);
    resetForm();
    toast({
      title: "Relatório criado!",
      description: `Relatório para ${aluno.nome} foi criado com sucesso.`
    });
  };

  const handleGerarComIA = async () => {
    if (!formData.alunoId || !formData.titulo || !formData.periodo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha aluno, título e período antes de gerar com IA",
        variant: "destructive"
      });
      return;
    }

    const aluno = alunos.find(a => a.id === formData.alunoId);
    if (!aluno) return;

    setIsLoadingAI(true);
    try {
      const prompt = `Gere um relatório de educação infantil para o aluno ${aluno.nome} (${aluno.idade} anos) da turma ${aluno.turma}.
      
Título: ${formData.titulo}
Período: ${formData.periodo}
${formData.observacoes ? `Observações específicas: ${formData.observacoes}` : ''}

O relatório deve incluir:
- Desenvolvimento cognitivo
- Desenvolvimento social e emocional  
- Desenvolvimento motor
- Linguagem e comunicação
- Participação em atividades
- Relacionamento com colegas e professores

Use linguagem positiva, construtiva e adequada para educação infantil. Seja específico mas carinhoso.`;

      const conteudoIA = await onRequestAI(prompt, aluno.nome);
      
      setFormData(prev => ({ 
        ...prev, 
        conteudo: conteudoIA 
      }));

      toast({
        title: "Relatório gerado com IA!",
        description: "O conteúdo foi gerado automaticamente. Revise antes de salvar.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório com IA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSalvarComIA = () => {
    if (!formData.alunoId || !formData.titulo || !formData.periodo) return;

    const aluno = alunos.find(a => a.id === formData.alunoId);
    if (!aluno) return;

    const novoRelatorio: Relatorio = {
      id: Date.now().toString(),
      alunoId: formData.alunoId,
      alunoNome: aluno.nome,
      turma: aluno.turma,
      titulo: formData.titulo,
      periodo: formData.periodo,
      conteudo: formData.conteudo,
      observacoes: formData.observacoes,
      status: formData.status,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      geradoPorIA: true
    };

    onRelatoriosChange([...relatorios, novoRelatorio]);

    // Atualizar contador de relatórios do aluno
    const alunosAtualizados = alunos.map(a =>
      a.id === formData.alunoId
        ? { ...a, relatoriosCount: a.relatoriosCount + 1 }
        : a
    );
    onAlunosChange(alunosAtualizados);

    setIsAddDialogOpen(false);
    resetForm();
    toast({
      title: "Relatório salvo!",
      description: `Relatório gerado por IA para ${aluno.nome} foi salvo com sucesso.`
    });
  };

  const relatoriosFiltrados = relatorios.filter(relatorio => {
    const filtroAlunoOk = filtroAluno === "todos" || relatorio.alunoId === filtroAluno;
    const filtroStatusOk = filtroStatus === "todos" || relatorio.status === filtroStatus;
    return filtroAlunoOk && filtroStatusOk;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return status === "concluido" ? "bg-success-light text-success" : "bg-warning-light text-warning";
  };

  const getStatusText = (status: string) => {
    return status === "concluido" ? "Concluído" : "Rascunho";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">Gerencie os relatórios dos alunos</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório</DialogTitle>
              <DialogDescription>
                Crie um relatório para um aluno específico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aluno">Aluno *</Label>
                  <Select value={formData.alunoId} onValueChange={(value) => setFormData({ ...formData, alunoId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome} - {aluno.turma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "rascunho" | "concluido") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Relatório Mensal - Janeiro 2024"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="periodo">Período *</Label>
                  <Input
                    id="periodo"
                    placeholder="Ex: Janeiro 2024"
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações Específicas</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações sobre o comportamento, desenvolvimento ou situações específicas do aluno..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="conteudo">Conteúdo do Relatório</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGerarComIA}
                    disabled={isLoadingAI || !formData.alunoId || !formData.titulo || !formData.periodo}
                    className="text-accent border-accent hover:bg-accent-light"
                  >
                    {isLoadingAI ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isLoadingAI ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </div>
                <Textarea
                  id="conteudo"
                  placeholder="Digite o conteúdo do relatório ou use a IA para gerar automaticamente..."
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={8}
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              {formData.conteudo && formData.conteudo.length > 100 && (
                <Button 
                  onClick={handleSalvarComIA} 
                  className="bg-gradient-accent hover:opacity-90 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Salvar (Gerado por IA)
                </Button>
              )}
              <Button 
                onClick={handleAdd} 
                className="bg-gradient-primary hover:opacity-90 text-white"
                disabled={!formData.conteudo}
              >
                Salvar Relatório
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingRelatorio && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{viewingRelatorio.titulo}</DialogTitle>
                    <DialogDescription>
                      {viewingRelatorio.alunoNome} - {viewingRelatorio.turma} - {viewingRelatorio.periodo}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(viewingRelatorio.status)}>
                      {getStatusText(viewingRelatorio.status)}
                    </Badge>
                    {viewingRelatorio.geradoPorIA && (
                      <Badge variant="outline" className="border-accent text-accent">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Informações do Relatório</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>
                      <p>{new Date(viewingRelatorio.criadoEm).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atualizado em:</span>
                      <p>{new Date(viewingRelatorio.atualizadoEm).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {viewingRelatorio.observacoes && (
                  <div>
                    <h4 className="font-semibold mb-2">Observações Específicas</h4>
                    <div className="bg-secondary-light p-3 rounded-lg text-sm">
                      {viewingRelatorio.observacoes}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Conteúdo do Relatório</h4>
                  <div className="bg-white border rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {viewingRelatorio.conteudo}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="flex gap-4">
        <div>
          <Label htmlFor="filtro-aluno">Filtrar por Aluno</Label>
          <Select value={filtroAluno} onValueChange={setFiltroAluno}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os alunos</SelectItem>
              {alunos.map((aluno) => (
                <SelectItem key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtro-status">Filtrar por Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Relatórios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatoriosFiltrados.map((relatorio) => (
          <Card key={relatorio.id} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-gradient-primary">
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                      {getInitials(relatorio.alunoNome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base leading-tight">{relatorio.titulo}</CardTitle>
                    <CardDescription className="text-sm">
                      {relatorio.alunoNome} - {relatorio.turma}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewingRelatorio(relatorio);
                    setIsViewDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(relatorio.status)}>
                  {getStatusText(relatorio.status)}
                </Badge>
                {relatorio.geradoPorIA && (
                  <Badge variant="outline" className="border-accent text-accent">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Período:</span>
                  <span className="text-foreground font-medium">{relatorio.periodo}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="text-foreground">{new Date(relatorio.criadoEm).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {relatorio.conteudo && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    {relatorio.conteudo.substring(0, 100)}...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {relatoriosFiltrados.length === 0 && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {filtroAluno === "todos" && filtroStatus === "todos" 
                ? "Nenhum relatório criado" 
                : "Nenhum relatório encontrado"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {alunos.length === 0 
                ? "Primeiro, você precisa cadastrar alunos para criar relatórios"
                : "Comece criando seu primeiro relatório com ou sem ajuda da IA"
              }
            </p>
            {alunos.length > 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-primary hover:opacity-90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Relatório
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}