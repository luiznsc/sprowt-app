import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, User, Edit2, Trash2, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Turma {
  id: string;
  nome: string;
  faixaEtaria: string;
  cor: string;
  alunosCount: number;
}

interface AlunosManagerProps {
  alunos: Aluno[];
  turmas: Turma[];
  onAlunosChange: (alunos: Aluno[]) => void;
  onTurmasChange: (turmas: Turma[]) => void;
}

import { useApp } from "@/context/use-app";

export function AlunosManager() {
  const { alunos, turmas, loading, onAlunosChange, onTurmasChange } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [filtroTurma, setFiltroTurma] = useState<string>("todas");
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    turmaId: "",
    dataNascimento: "",
    responsavel: "",
    telefone: "",
    observacoes: ""
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      nome: "",
      idade: "",
      turmaId: "",
      dataNascimento: "",
      responsavel: "",
      telefone: "",
      observacoes: ""
    });
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const handleAdd = () => {
    if (!formData.nome || !formData.turmaId || !formData.dataNascimento || !formData.responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const turma = turmas.find(t => t.id === formData.turmaId);
    if (!turma) return;

    const novoAluno: Aluno = {
      id: Date.now().toString(),
      nome: formData.nome,
      idade: calcularIdade(formData.dataNascimento),
      turmaId: formData.turmaId,
      turma: turma.nome,
      dataNascimento: formData.dataNascimento,
      responsavel: formData.responsavel,
      telefone: formData.telefone,
      observacoes: formData.observacoes,
      relatoriosCount: 0
    };

    // Atualizar lista de alunos
    onAlunosChange([...alunos, novoAluno]);

    // Atualizar contador da turma
    const turmasAtualizadas = turmas.map(t =>
      t.id === formData.turmaId
        ? { ...t, alunosCount: t.alunosCount + 1 }
        : t
    );
    onTurmasChange(turmasAtualizadas);

    setIsAddDialogOpen(false);
    resetForm();
    toast({
      title: "Aluno cadastrado!",
      description: `${formData.nome} foi adicionado à turma ${turma.nome}.`
    });
  };

  const handleEdit = () => {
    if (!editingAluno || !formData.nome || !formData.turmaId || !formData.dataNascimento || !formData.responsavel) return;

    const turmaAnterior = editingAluno.turmaId;
    const turmaAtual = formData.turmaId;
    const turma = turmas.find(t => t.id === formData.turmaId);
    if (!turma) return;

    const alunoAtualizado: Aluno = {
      ...editingAluno,
      nome: formData.nome,
      idade: calcularIdade(formData.dataNascimento),
      turmaId: formData.turmaId,
      turma: turma.nome,
      dataNascimento: formData.dataNascimento,
      responsavel: formData.responsavel,
      telefone: formData.telefone,
      observacoes: formData.observacoes
    };

    const alunosAtualizados = alunos.map(aluno =>
      aluno.id === editingAluno.id ? alunoAtualizado : aluno
    );
    onAlunosChange(alunosAtualizados);

    // Atualizar contadores das turmas se mudou de turma
    if (turmaAnterior !== turmaAtual) {
      const turmasAtualizadas = turmas.map(t => {
        if (t.id === turmaAnterior) {
          return { ...t, alunosCount: t.alunosCount - 1 };
        }
        if (t.id === turmaAtual) {
          return { ...t, alunosCount: t.alunosCount + 1 };
        }
        return t;
      });
      onTurmasChange(turmasAtualizadas);
    }

    setIsEditDialogOpen(false);
    setEditingAluno(null);
    resetForm();
    toast({
      title: "Aluno atualizado!",
      description: "As alterações foram salvas com sucesso."
    });
  };

  const handleDelete = (aluno: Aluno) => {
    const alunosAtualizados = alunos.filter(a => a.id !== aluno.id);
    onAlunosChange(alunosAtualizados);

    // Atualizar contador da turma
    const turmasAtualizadas = turmas.map(t =>
      t.id === aluno.turmaId
        ? { ...t, alunosCount: t.alunosCount - 1 }
        : t
    );
    onTurmasChange(turmasAtualizadas);

    toast({
      title: "Aluno removido",
      description: `${aluno.nome} foi removido do sistema.`
    });
  };

  const openEditDialog = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      idade: aluno.idade.toString(),
      turmaId: aluno.turmaId,
      dataNascimento: aluno.dataNascimento,
      responsavel: aluno.responsavel,
      telefone: aluno.telefone,
      observacoes: aluno.observacoes
    });
    setIsEditDialogOpen(true);
  };

  const alunosFiltrados = filtroTurma === "todas"
    ? alunos
    : alunos.filter(aluno => aluno.turmaId === filtroTurma);

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando alunos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Alunos</h2>
          <p className="text-muted-foreground">Cadastre e organize os alunos de suas turmas</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
              <DialogDescription>
                Adicione um novo aluno ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Ana Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="turma">Turma *</Label>
                <Select value={formData.turmaId} onValueChange={(value) => setFormData({ ...formData, turmaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} ({turma.faixaEtaria})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nascimento">Data de Nascimento *</Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  placeholder="Nome do responsável"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  placeholder="Observações importantes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} className="bg-gradient-primary hover:opacity-90 text-white">
                Cadastrar Aluno
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Edite as informações do aluno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="edit-nome">Nome Completo *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-turma">Turma *</Label>
              <Select value={formData.turmaId} onValueChange={(value) => setFormData({ ...formData, turmaId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} ({turma.faixaEtaria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-nascimento">Data de Nascimento *</Label>
              <Input
                id="edit-nascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-responsavel">Responsável *</Label>
              <Input
                id="edit-responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Input
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="bg-gradient-primary hover:opacity-90 text-white">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="filtro">Filtrar por Turma</Label>
          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {turma.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alunos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alunosFiltrados.map((aluno) => (
          <Card key={aluno.id} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-gradient-primary">
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                    <CardDescription>{aluno.idade} anos</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(aluno)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(aluno)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-muted">
                  {aluno.turma}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span className="text-xs">{aluno.relatoriosCount} relatórios</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="text-foreground font-medium">{aluno.responsavel}</span>
                </div>
                
                {aluno.telefone && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">📞</span>
                    <span className="text-foreground">{aluno.telefone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Nascimento:</span>
                  <span className="text-foreground">{new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {aluno.observacoes && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    {aluno.observacoes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alunosFiltrados.length === 0 && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {filtroTurma === "todas" ? "Nenhum aluno cadastrado" : "Nenhum aluno nesta turma"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {turmas.length === 0 
                ? "Primeiro, você precisa criar pelo menos uma turma"
                : "Comece adicionando seus primeiros alunos"
              }
            </p>
            {turmas.length > 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-primary hover:opacity-90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}