import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, User, Edit2, Trash2, Calendar, FileText, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/use-app";
import { InputField } from "@/components/ui/InputField";
import { database } from "@/lib/supabase";

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
  observacoes_count: number;
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

export function AlunosManager() {
  const navigate = useNavigate();
  const { alunos, turmas, loading, onAlunosChange, onTurmasChange, refreshAlunos } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [filtroTurma, setFiltroTurma] = useState("todas");
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

const handleAdd = async () => {  // ← ADICIONAR 'async' aqui
  if (!formData.nome || !formData.turmaId || !formData.dataNascimento || !formData.responsavel) {
    toast({
      title: "Campos obrigatórios",
      description: "Preencha os campos obrigatórios",
      variant: "destructive"
    });
    return;
  }

  try {
    // Primeiro, criar o aluno no banco
    const novoAlunoDb = await database.createAluno({
      nome: formData.nome,
      turma_id: formData.turmaId,
      data_nascimento: formData.dataNascimento,
      responsavel: formData.responsavel,
      telefone: formData.telefone,
      observacoes: formData.observacoes
    });

    // Encontrar dados da turma
    const turma = turmas.find(t => t.id === formData.turmaId);
    if (!turma) return;

    // Transformar para o formato usado no componente
    const novoAluno = {
      id: novoAlunoDb.id,
      nome: novoAlunoDb.nome,
      idade: calcularIdade(novoAlunoDb.data_nascimento),
      turmaId: novoAlunoDb.turma_id,
      turma: turma.nome,
      dataNascimento: novoAlunoDb.data_nascimento,
      responsavel: novoAlunoDb.responsavel,
      telefone: novoAlunoDb.telefone || "",
      observacoes: novoAlunoDb.observacoes || "",
      relatoriosCount: 0, // Inicializa com 0, será atualizado no refresh
      observacoes_count: 0 // Inicializa com 0, será atualizado no refresh
    };

    // Atualizar lista de alunos no estado
    // onAlunosChange([...alunos, novoAluno]); // Não é mais necessário, refreshAlunos fará isso

    // Atualizar contador da turma
    const turmasAtualizadas = turmas.map(t =>
      t.id === formData.turmaId
        ? { ...t, alunosCount: t.alunosCount + 1 }
        : t
    );
    onTurmasChange(turmasAtualizadas);

    setIsAddDialogOpen(false);
    resetForm();
    await refreshAlunos(); // Recarregar alunos para obter os counts atualizados
    
    toast({
      title: "Aluno cadastrado!",
      description: `${formData.nome} foi adicionado à turma ${turma.nome} e salvo no banco.`
    });
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível salvar o aluno no banco de dados",
        variant: "destructive"
      });
    }
  };



 const handleEdit = async () => {  // ← ADICIONAR 'async' aqui também
  if (!editingAluno || !formData.nome || !formData.turmaId || !formData.dataNascimento || !formData.responsavel) return;

  try {
    // Atualizar no banco primeiro
    const alunoAtualizado = await database.updateAluno(editingAluno.id, {
      nome: formData.nome,
      turma_id: formData.turmaId,
      data_nascimento: formData.dataNascimento,
      responsavel: formData.responsavel,
      telefone: formData.telefone,
      observacoes: formData.observacoes
    });

    const turma = turmas.find(t => t.id === formData.turmaId);
    if (!turma) return;

    // Transformar para formato do componente
    const alunoFormatado = {
      ...editingAluno,
      nome: alunoAtualizado.nome,
      idade: calcularIdade(alunoAtualizado.data_nascimento),
      turmaId: alunoAtualizado.turma_id,
      turma: turma.nome,
      dataNascimento: alunoAtualizado.data_nascimento,
      responsavel: alunoAtualizado.responsavel,
      telefone: alunoAtualizado.telefone || "",
      observacoes: alunoAtualizado.observacoes || "",
      relatoriosCount: editingAluno.relatoriosCount, // Manter os counts existentes
      observacoes_count: editingAluno.observacoes_count // Manter os counts existentes
    };

    // Atualizar no estado
    const alunosAtualizados = alunos.map(aluno =>
      aluno.id === editingAluno.id ? alunoFormatado : aluno
    );
    // onAlunosChange(alunosAtualizados); // Não é mais necessário, refreshAlunos fará isso

    // Atualizar contadores das turmas se mudou de turma
    const turmaAnterior = editingAluno.turmaId;
    const turmaAtual = formData.turmaId;
    
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
    await refreshAlunos(); // Recarregar alunos para obter os counts atualizados
    
    toast({
      title: "Aluno atualizado!",
      description: "As alterações foram salvas no banco de dados."
    });
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o aluno",
        variant: "destructive"
      });
    }
  };


  const handleDelete = async (aluno: Aluno) => { // ← Adicionar 'async'
    try {

      await database.deleteAluno(aluno.id);

      // const alunosAtualizados = alunos.filter(a => a.id !== aluno.id); // Não é mais necessário, refreshAlunos fará isso
      // onAlunosChange(alunosAtualizados);

      const turmasAtualizadas = turmas.map(t =>
        t.id === aluno.turmaId
          ? { ...t, alunosCount: t.alunosCount - 1 }
          : t
      );
      onTurmasChange(turmasAtualizadas);
      await refreshAlunos(); // Recarregar alunos para obter os counts atualizados
      
      toast({
        title: "Aluno removido",
        description: `${aluno.nome} foi removido do sistema e banco de dados.`
      });
    } catch (error) {
      console.error('Erro ao deletar aluno:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o aluno do banco de dados",
        variant: "destructive"
      });
    }
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
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Alunos</h1>
          <p className="text-muted-foreground">Cadastre e organize os alunos de suas turmas</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 text-white hover:bg-amber-600">
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
            <div className="space-y-4">
              <InputField
                label="Nome Completo"
                type="text"
                value={formData.nome}
                onChange={(value) => setFormData({ ...formData, nome: value })}
                required
                placeholder="Digite o nome completo"
              />
              <div>
                <Label htmlFor="turma">Turma<span className="text-red-500 ml-1 ">*</span></Label>
                <Select value={formData.turmaId} onValueChange={(value) => setFormData({ ...formData, turmaId: value })}>
                  <SelectTrigger className="bg-gray-200">
                    <SelectValue placeholder="Selecione uma turma" />
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
                <Label htmlFor="dataNascimento">Data de Nascimento<span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  className="bg-gray-200 pr-10"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}/>
              </div>
              
              <InputField
                label="Responsável"
                type="text"
                value={formData.responsavel}
                onChange={(value) => setFormData({ ...formData, responsavel: value })}
                required
                placeholder="Nome do responsável"
              />
              <InputField
                label="Telefone"
                type="telefone"
                value={formData.telefone}
                onChange={(value) => setFormData({ ...formData, telefone: value })}
              />
              <InputField
                label="Observações"
                type="text"
                value={formData.observacoes}
                onChange={(value) => setFormData({ ...formData, observacoes: value })}
                placeholder="Observações adicionais"
              />
            </div>
            <DialogFooter>
              <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} className="bg-amber-500 text-white hover:bg-amber-600">
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome Completo *</Label>
              <Input
                id="edit-nome"
                placeholder="Digite o nome completo"
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
              <Label htmlFor="edit-dataNascimento">Data de Nascimento *</Label>
              <Input
                id="edit-dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-responsavel">Responsável *</Label>
              <Input
                id="edit-responsavel"
                placeholder="Nome do responsável"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Input
                id="edit-observacoes"
                placeholder="Observações adicionais"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <SelectTrigger className="w-full bg-gray-200">
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
        </CardContent>
      </Card>

      {/* Alunos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alunosFiltrados.map((aluno) => (
          <Card key={aluno.id} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
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
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {aluno.turma}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span className="text-xs">{aluno.relatoriosCount} relatórios</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs">{aluno.observacoes_count || 0} observações</span>
              </div>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <strong>Responsável:</strong> {aluno.responsavel}
                </div>
                {aluno.telefone && (
                  <div>
                    <strong>Telefone:</strong> {aluno.telefone}
                  </div>
                )}
                <div>
                  <strong>Nascimento:</strong> {new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')}
                </div>
                {aluno.observacoes && (
                  <div className="text-muted-foreground text-xs italic">
                    {aluno.observacoes}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => navigate(`/observacoes?aluno=${aluno.id}`)}
                className="w-full mt-4"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ver Observações
              </Button>
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
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-amber-500 text-white hover:bg-amber-600">
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
