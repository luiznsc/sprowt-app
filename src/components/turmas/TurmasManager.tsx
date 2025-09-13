import { useState, useEffect } from "react";
import { database } from "@/lib/supabase";
import { useAuth, canManageTurmas } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Edit2, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/ui/inputField";

interface Turma {
  id: string;
  nome: string;
  faixaEtaria: string;
  cor: string;
  alunosCount: number;
  created_at?: string;
}

interface TurmasManagerProps {
  turmas: Turma[];
  onTurmasChange: (turmas: Turma[]) => void;
}

export function TurmasManager() {
  const { profile } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    faixaEtaria: "",
    cor: "bg-gradient-primary"
  });
  const { toast } = useToast();

  useEffect(() => {
    const carregarTurmas = async () => {
      try {
        const data = await database.getTurmas();
        setTurmas(data);
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        toast({
          title: "Erro ao carregar turmas",
          description: "Não foi possível carregar as turmas. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarTurmas();
  }, [toast]);

  const cores = [
    { value: "bg-gradient-primary", label: "Azul", color: "bg-blue-500" },
    { value: "bg-gradient-secondary", label: "Amarelo", color: "bg-yellow-500" },
    { value: "bg-gradient-success", label: "Verde", color: "bg-green-500" },
    { value: "bg-gradient-accent", label: "Roxo", color: "bg-purple-500" }
  ];

  const resetForm = () => {
    setFormData({ nome: "", faixaEtaria: "", cor: "bg-gradient-primary" });
  };

  const handleAdd = async () => {
    if (!formData.nome || !formData.faixaEtaria) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    try {
      const novaTurma = await database.createTurma({
        nome: formData.nome,
        faixa_etaria: formData.faixaEtaria,
        cor: formData.cor,
        alunos_count: 0
      });

      setTurmas([...turmas, novaTurma]);
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Turma criada!",
        description: `A turma ${formData.nome} foi criada com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      toast({
        title: "Erro ao criar turma",
        description: "Não foi possível criar a turma. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async () => {
    if (!editingTurma || !formData.nome || !formData.faixaEtaria) return;

    try {
      const turmaAtualizada = await database.updateTurma(editingTurma.id, {
        nome: formData.nome,
        faixa_etaria: formData.faixaEtaria,
        cor: formData.cor
      });

      setTurmas(turmas.map(turma =>
        turma.id === editingTurma.id ? turmaAtualizada : turma
      ));

      setIsEditDialogOpen(false);
      setEditingTurma(null);
      resetForm();
      toast({
        title: "Turma atualizada!",
        description: "As alterações foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      toast({
        title: "Erro ao atualizar turma",
        description: "Não foi possível atualizar a turma. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (turma: Turma) => {
    try {
      await database.deleteTurma(turma.id);
      setTurmas(turmas.filter(t => t.id !== turma.id));
      toast({
        title: "Turma removida",
        description: `A turma ${turma.nome} foi removida.`
      });
    } catch (error) {
      console.error('Erro ao deletar turma:', error);
      toast({
        title: "Erro ao remover turma",
        description: "Não foi possível remover a turma. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      faixaEtaria: turma.faixaEtaria,
      cor: turma.cor
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando turmas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Turmas</h2>
          <p className="text-muted-foreground">Organize suas turmas de educação infantil</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-450 hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
              <DialogDescription>
                Adicione uma nova turma ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <InputField
                label="Nome da Turma"
                type="text"
                value={formData.nome}
                onChange={(value) => setFormData({ ...formData, nome: value })}
                required
                placeholder="Digite o nome da turma"
              />
              <div>
                <Label htmlFor="faixa">Faixa Etária</Label>
                <Select value={formData.faixaEtaria} onValueChange={(value) => setFormData({ ...formData, faixaEtaria: value })}>
                  <SelectTrigger className="bg-gray-200">
                    <SelectValue placeholder="Selecione a faixa etária" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1 anos">0-1 anos (Berçário)</SelectItem>
                    <SelectItem value="1-2 anos">1-2 anos (Maternal I)</SelectItem>
                    <SelectItem value="2-3 anos">2-3 anos (Maternal II)</SelectItem>
                    <SelectItem value="3-4 anos">3-4 anos (Pré I)</SelectItem>
                    <SelectItem value="4-5 anos">4-5 anos (Pré II)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor da Turma</Label>
                <div className="flex gap-2 mt-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.value}
                      onClick={() => setFormData({ ...formData, cor: cor.value })}
                      className={`w-8 h-8 rounded-full ${cor.color} border-2 ${
                        formData.cor === cor.value ? 'border-foreground' : 'border-border'
                      }`}
                      title={cor.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} className="bg-blue-500 hover:bg-blue-450 hover:opacity-90 text-white">
                Criar Turma
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
            <DialogDescription>
              Edite as informações da turma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <InputField
              label="Nome da Turma"
              type="text"
              value={formData.nome}
              onChange={(value) => setFormData({ ...formData, nome: value })}
              required
              placeholder="Digite o nome completo"
            />
            <div>
              <Label htmlFor="edit-faixa">Faixa Etária</Label>
              <Select value={formData.faixaEtaria} onValueChange={(value) => setFormData({ ...formData, faixaEtaria: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1 anos">0-1 anos (Berçário)</SelectItem>
                  <SelectItem value="1-2 anos">1-2 anos (Maternal I)</SelectItem>
                  <SelectItem value="2-3 anos">2-3 anos (Maternal II)</SelectItem>
                  <SelectItem value="3-4 anos">3-4 anos (Pré I)</SelectItem>
                  <SelectItem value="4-5 anos">4-5 anos (Pré II)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor da Turma</Label>
              <div className="flex gap-2 mt-2">
                {cores.map((cor) => (
                  <button
                    key={cor.value}
                    onClick={() => setFormData({ ...formData, cor: cor.value })}
                    className={`w-8 h-8 rounded-full ${cor.color} border-2 ${
                      formData.cor === cor.value ? 'border-foreground' : 'border-border'
                    }`}
                    title={cor.label}
                  />
                ))}
              </div>
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

      {/* Turmas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map((turma) => (
          <Card key={turma.id} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className={`${turma.cor} rounded-lg p-2`}>
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(turma)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(turma)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <CardTitle className="text-lg">{turma.nome}</CardTitle>
                <CardDescription>{turma.faixaEtaria}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {turma.alunosCount} aluno(s)
                  </span>
                </div>
                <Badge variant="secondary" className="bg-muted">
                  {turma.faixaEtaria}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {turmas.length === 0 && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma turma cadastrada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando sua primeira turma para organizar os alunos
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary-500 text-white hover:bg-primary-600">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Turma
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}