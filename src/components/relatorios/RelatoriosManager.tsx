import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, FileText, Edit2, Eye, Calendar, User, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/ui/InputField";
import { database } from "@/lib/supabase"; 
import { useApp } from "@/context/use-app";

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

export function RelatoriosManager() {
  const { relatorios, alunos, turmas, loading, onRelatoriosChange, onAlunosChange, onRequestAI } = useApp();
  
  // ✅ ESTADOS CORRIGIDOS E ADICIONADOS
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // ← ADICIONADO
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingRelatorio, setViewingRelatorio] = useState<Relatorio | null>(null);
  const [editingRelatorio, setEditingRelatorio] = useState<Relatorio | null>(null); // ← ADICIONADO
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [filtroAluno, setFiltroAluno] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTurma, setFiltroTurma] = useState("todas");
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

  // ✅ CREATE - CORRIGIDO COM BANCO
  const handleAdd = async () => { // ← ASYNC ADICIONADO
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

    try {
      // ✅ SALVAR NO BANCO PRIMEIRO
      const relatorioDb = await database.createRelatorio({
        aluno_id: formData.alunoId,
        titulo: formData.titulo,
        periodo: formData.periodo,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes,
        status: formData.status,
        gerado_por_ia: false
      });

      // ✅ TRANSFORMAR PARA FORMATO DO COMPONENTE
      const novoRelatorio: Relatorio = {
        id: relatorioDb.id,
        alunoId: relatorioDb.aluno_id,
        alunoNome: aluno.nome,
        turma: aluno.turma,
        titulo: relatorioDb.titulo,
        periodo: relatorioDb.periodo,
        conteudo: relatorioDb.conteudo,
        observacoes: relatorioDb.observacoes,
        status: relatorioDb.status,
        criadoEm: relatorioDb.created_at,
        atualizadoEm: relatorioDb.updated_at,
        geradoPorIA: relatorioDb.gerado_por_ia
      };

      onRelatoriosChange([...relatorios, novoRelatorio]);

      // Atualizar contador do aluno
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
        description: `Relatório para ${aluno.nome} foi salvo no banco.`
      });

    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível salvar o relatório",
        variant: "destructive"
      });
    }
  };

  // ✅ UPDATE - FUNÇÃO ADICIONADA
  const handleEdit = async () => {
    if (!editingRelatorio || !formData.titulo || !formData.periodo) return;

    try {
      const relatorioAtualizado = await database.updateRelatorio(editingRelatorio.id, {
        titulo: formData.titulo,
        periodo: formData.periodo,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes,
        status: formData.status
      });

      // Atualizar no estado
      const relatoriosAtualizados = relatorios.map(rel =>
        rel.id === editingRelatorio.id
          ? { ...rel, 
              titulo: relatorioAtualizado.titulo,
              periodo: relatorioAtualizado.periodo,
              conteudo: relatorioAtualizado.conteudo,
              observacoes: relatorioAtualizado.observacoes,
              status: relatorioAtualizado.status,
              atualizadoEm: relatorioAtualizado.updated_at
            }
          : rel
      );
      onRelatoriosChange(relatoriosAtualizados);

      setIsEditDialogOpen(false);
      setEditingRelatorio(null);
      resetForm();

      toast({
        title: "Relatório atualizado!",
        description: "As alterações foram salvas no banco."
      });

    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o relatório",
        variant: "destructive"
      });
    }
  };

  // ✅ DELETE - FUNÇÃO ADICIONADA
  const handleDelete = async (relatorio: Relatorio) => {
    try {
      await database.deleteRelatorio(relatorio.id);

      // Remover do estado
      const relatoriosAtualizados = relatorios.filter(rel => rel.id !== relatorio.id);
      onRelatoriosChange(relatoriosAtualizados);

      // Atualizar contador do aluno
      const alunosAtualizados = alunos.map(a =>
        a.id === relatorio.alunoId
          ? { ...a, relatoriosCount: a.relatoriosCount - 1 }
          : a
      );
      onAlunosChange(alunosAtualizados);

      toast({
        title: "Relatório removido",
        description: `Relatório "${relatorio.titulo}" foi deletado.`
      });

    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível deletar o relatório",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (relatorio: Relatorio) => {
    setEditingRelatorio(relatorio);
    setFormData({
      alunoId: relatorio.alunoId,
      titulo: relatorio.titulo,
      periodo: relatorio.periodo,
      conteudo: relatorio.conteudo,
      observacoes: relatorio.observacoes,
      status: relatorio.status
    });
    setIsEditDialogOpen(true);
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
      const prompt = `Gere um relatório de educação infantil para ${aluno.nome}`;
      const conteudoIA = await onRequestAI(prompt, aluno.nome);

      setFormData(prev => ({
        ...prev,
        conteudo: conteudoIA
      }));

      toast({
        title: "Relatório gerado com IA!",
        description: "O conteúdo foi gerado automaticamente. Revise antes de salvar."
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

  // ✅ CREATE COM IA - CORRIGIDO COM BANCO
  const handleSalvarComIA = async () => { // ← ASYNC ADICIONADO
    if (!formData.alunoId || !formData.titulo || !formData.periodo) return;

    const aluno = alunos.find(a => a.id === formData.alunoId);
    if (!aluno) return;

    try {
      const relatorioDb = await database.createRelatorio({
        aluno_id: formData.alunoId,
        titulo: formData.titulo,
        periodo: formData.periodo,
        conteudo: formData.conteudo,
        observacoes: formData.observacoes,
        status: formData.status,
        gerado_por_ia: true // ← FLAG IA
      });

      const novoRelatorio: Relatorio = {
        id: relatorioDb.id,
        alunoId: relatorioDb.aluno_id,
        alunoNome: aluno.nome,
        turma: aluno.turma,
        titulo: relatorioDb.titulo,
        periodo: relatorioDb.periodo,
        conteudo: relatorioDb.conteudo,
        observacoes: relatorioDb.observacoes,
        status: relatorioDb.status,
        criadoEm: relatorioDb.created_at,
        atualizadoEm: relatorioDb.updated_at,
        geradoPorIA: relatorioDb.gerado_por_ia
      };

      onRelatoriosChange([...relatorios, novoRelatorio]);

      // Atualizar contador do aluno
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
        description: `Relatório IA para ${aluno.nome} foi salvo no banco.`
      });

    } catch (error) {
      console.error('Erro ao salvar relatório IA:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o relatório",
        variant: "destructive"
      });
    }
  };

  const relatoriosFiltrados = relatorios.filter(relatorio => {
    const filtroAlunoOk = filtroAluno === "todos" || relatorio.alunoId === filtroAluno;
    const filtroStatusOk = filtroStatus === "todos" || relatorio.status === filtroStatus;
    const filtroTurmaOk = filtroTurma === "todas" || relatorio.turma === filtroTurma;
    return filtroAlunoOk && filtroStatusOk && filtroTurmaOk;
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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Gerencie os relatórios dos alunos</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório</DialogTitle>
              <DialogDescription>
                Crie um relatório para um aluno específico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="aluno">Aluno<span className="text-red-500 ml-1">*</span></Label>
                <Select value={formData.alunoId} onValueChange={(value) => setFormData({ ...formData, alunoId: value })}>
                  <SelectTrigger className="bg-gray-200">
                    <SelectValue placeholder="Selecione um aluno" />
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
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <InputField
                label="Título"
                type="text"
                value={formData.titulo}
                onChange={(value) => setFormData({ ...formData, titulo: value })}
                required
                placeholder="Ex: Relatório Mensal - Março 2024"
              />

              <InputField
                label="Período"
                type="text"
                value={formData.periodo}
                onChange={(value) => setFormData({ ...formData, periodo: value })}
                required
                placeholder="Ex: Março 2024 ou 1º Semestre"
              />

              <div>
                <Label htmlFor="observacoes">Observações Específicas</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações específicas..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="bg-gray-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="conteudo">Conteúdo do Relatório</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGerarComIA}
                    disabled={isLoadingAI}
                    className="ml-2"
                  >
                    {isLoadingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isLoadingAI ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </div>
                <Textarea
                  id="conteudo"
                  placeholder="Digite o conteúdo do relatório..."
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={8}
                  className="min-h-[200px] bg-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              {formData.conteudo && formData.conteudo.length > 100 && (
                <Button 
                  onClick={handleSalvarComIA}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Salvar (Gerado por IA)
                </Button>
              )}
              <Button onClick={handleAdd} className="bg-gradient-primary hover:opacity-90 text-white">
                Salvar Relatório
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ MODAL DE EDITAR - ADICIONADO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Relatório</DialogTitle>
            <DialogDescription>
              Edite as informações do relatório
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-aluno">Aluno<span className="text-red-500 ml-1">*</span></Label>
              <Select value={formData.alunoId} onValueChange={(value) => setFormData({ ...formData, alunoId: value })}>
                <SelectTrigger className="bg-gray-200">
                  <SelectValue placeholder="Selecione um aluno" />
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
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <InputField
              label="Título"
              type="text"
              value={formData.titulo}
              onChange={(value) => setFormData({ ...formData, titulo: value })}
              required
              placeholder="Ex: Relatório Mensal - Março 2024"
            />

            <InputField
              label="Período"
              type="text"
              value={formData.periodo}
              onChange={(value) => setFormData({ ...formData, periodo: value })}
              required
              placeholder="Ex: Março 2024 ou 1º Semestre"
            />

            <div>
              <Label htmlFor="edit-observacoes">Observações Específicas</Label>
              <Textarea
                id="edit-observacoes"
                placeholder="Observações específicas..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="bg-gray-200"
              />
            </div>

            <div>
              <Label htmlFor="edit-conteudo">Conteúdo do Relatório</Label>
              <Textarea
                id="edit-conteudo"
                placeholder="Digite o conteúdo do relatório..."
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                rows={8}
                className="min-h-[200px] bg-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="bg-gradient-primary hover:opacity-90 text-white">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          {viewingRelatorio && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingRelatorio.titulo}</DialogTitle>
                <DialogDescription>
                  {viewingRelatorio.alunoNome} - {viewingRelatorio.turma} - {viewingRelatorio.periodo}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(viewingRelatorio.status)}>
                    {getStatusText(viewingRelatorio.status)}
                  </Badge>
                  {viewingRelatorio.geradoPorIA && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Criado em:</strong>
                    <p>{new Date(viewingRelatorio.criadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <strong>Atualizado em:</strong>
                    <p>{new Date(viewingRelatorio.atualizadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                {viewingRelatorio.observacoes && (
                  <div>
                    <strong>Observações Específicas</strong>
                    <p className="mt-2 p-3 bg-gray-50 rounded-lg">{viewingRelatorio.observacoes}</p>
                  </div>
                )}
                
                <div>
                  <strong>Conteúdo do Relatório</strong>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {viewingRelatorio.conteudo}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px]">
          <Label htmlFor="filtro-aluno">Filtrar por Aluno</Label>
          <Select value={filtroAluno} onValueChange={setFiltroAluno}>
            <SelectTrigger className="bg-gray-200">
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

        <div className="min-w-[200px]">
          <Label htmlFor="filtro-turma">Filtrar por Turma</Label>
          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <SelectTrigger className="bg-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.nome}>
                  {turma.nome} ({turma.faixaEtaria})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[200px]">
          <Label htmlFor="filtro-status">Filtrar por Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="bg-gray-200">
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

      {/* ✅ RELATÓRIOS GRID - CORRIGIDO COM BOTÕES CRUD */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatoriosFiltrados.map((relatorio) => (
          <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {getInitials(relatorio.alunoNome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{relatorio.titulo}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {relatorio.alunoNome} - {relatorio.turma}
                    </CardDescription>
                  </div>
                </div>
                
                {/* ✅ BOTÕES CRUD ADICIONADOS */}
                <div className="flex gap-1">
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
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(relatorio)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(relatorio)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getStatusColor(relatorio.status)}>
                  {getStatusText(relatorio.status)}
                </Badge>
                {relatorio.geradoPorIA && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Período: {relatorio.periodo}
                </div>
                <div>
                  Criado em: {new Date(relatorio.criadoEm).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              {relatorio.conteudo && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                  {relatorio.conteudo.substring(0, 100)}...
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {relatoriosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {filtroAluno === "todos" && filtroStatus === "todos" && filtroTurma === "todas"
              ? "Nenhum relatório criado"
              : "Nenhum relatório encontrado"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {alunos.length === 0
              ? "Primeiro, você precisa cadastrar alunos para criar relatórios"
              : "Comece criando seu primeiro relatório com ou sem ajuda da IA"}
          </p>
          {alunos.length > 0 && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="bg-gradient-primary hover:opacity-90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Relatório
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
