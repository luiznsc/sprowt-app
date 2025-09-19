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
import { Plus, Users, Edit2, Trash2, BookOpen, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/ui/InputField";

// ✅ ÚNICA ADIÇÃO NECESSÁRIA - IMPORT DO HELPER
import { deleteTurma } from "@/utils/deleteHelpers";

interface Turma {
  id: string;
  nome: string;
  faixa_etaria: string;
  cor: string;
  alunos_count: number;
  created_at?: string;
}

interface TurmasManagerProps {
  turmas: Turma[];
  onTurmasChange: (turmas: Turma[]) => void;
}

// ✅ ADIÇÃO NECESSÁRIA - HOOK DE CONFIRMAÇÃO INLINE
interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [promiseResolve, setPromiseResolve] = useState<((value: boolean | PromiseLike<boolean>) => void) | null>(null);

  const confirm = (opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      setPromiseResolve(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (promiseResolve) {
      promiseResolve(true);
      setPromiseResolve(null);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (promiseResolve) {
      promiseResolve(false);
      setPromiseResolve(null);
    }
  };

  return { confirm, isOpen, options, handleConfirm, handleCancel };
}

// ✅ ADIÇÃO NECESSÁRIA - COMPONENTE DE CONFIRMAÇÃO INLINE
function ConfirmationDialog({ isOpen, options, onConfirm, onCancel }: { isOpen: boolean; options: ConfirmationOptions | null; onConfirm: () => void; onCancel: () => void }) {
  if (!options) return null;

  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default'
  } = options;

  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${
              variant === 'destructive' 
                ? 'text-destructive' 
                : 'text-primary'
            }`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TurmasManager() {
  const { profile } = useAuth();
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    faixa_etaria: "", // Changed from faixa_etaria to faixa_etaria
    cor: "bg-gradient-primary"
  });
  const { toast } = useToast();

  // ✅ ADIÇÃO NECESSÁRIA - HOOK DE CONFIRMAÇÃO
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirmation();

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
    { value: "bg-gradient-accent", label: "Roxo", color: "bg-purple-500" },
    { value: "bg-gradient-info", label: "Ciano", color: "bg-cyan-500" },
    { value: "bg-gradient-warning", label: "Laranja", color: "bg-orange-500" },
    { value: "bg-gradient-danger", label: "Vermelho", color: "bg-red-500" },
    { value: "bg-gradient-pink", label: "Rosa", color: "bg-pink-500" },
    { value: "bg-gradient-teal", label: "Verde-azulado", color: "bg-teal-500" },
    { value: "bg-gradient-indigo", label: "Índigo", color: "bg-indigo-500" }
  ];

  const resetForm = () => {
    setFormData({ nome: "", faixa_etaria: "", cor: "bg-gradient-primary" });
  };

  const handleAdd = async () => {
    if (!formData.nome || !formData.faixa_etaria) {
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
        faixa_etaria: formData.faixa_etaria,
        cor: formData.cor
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
    if (!editingTurma || !formData.nome || !formData.faixa_etaria) return;

    try {
      const turmaAtualizada = await database.updateTurma(editingTurma.id, {
        nome: formData.nome,
        faixa_etaria: formData.faixa_etaria,
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

  // ✅ ÚNICA MUDANÇA NA FUNÇÃO ORIGINAL - USAR HELPER COM CONFIRMAÇÃO
  const handleDelete = async (turma: Turma) => {
    const sucesso = await deleteTurma(turma.id, turma.nome, {
      toast,
      confirm,
      onSuccess: () => {
        setTurmas(turmas.filter(t => t.id !== turma.id));
      }
    });

    if (sucesso) {
      console.log(`Turma ${turma.nome} deletada com sucesso!`);
    }
  };

  const openEditDialog = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      faixa_etaria: turma.faixa_etaria,
      cor: turma.cor
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando turmas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ ÚNICA ADIÇÃO NO JSX - COMPONENTE DE CONFIRMAÇÃO */}
      <ConfirmationDialog
        isOpen={isOpen}
        options={options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Turmas</h1>
          <p className="text-muted-foreground">
            Organize suas turmas de educação infantil
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
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
                value={formData.nome}
                onChange={(value) => setFormData({ ...formData, nome: value })}
                required
                placeholder="Digite o nome da turma"
              />
              
              <div className="space-y-2">
                <Label>Faixa Etária</Label>
                <Select value={formData.faixa_etaria} onValueChange={(value) => setFormData({ ...formData, faixa_etaria: value })}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Cor da Turma</Label>
                <div className="flex gap-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.value}
                      type="button"
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
              <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>
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
              value={formData.nome}
              onChange={(value) => setFormData({ ...formData, nome: value })}
              required
              placeholder="Digite o nome completo"
            />
            
            <div className="space-y-2">
              <Label>Faixa Etária</Label>
              <Select value={formData.faixa_etaria} onValueChange={(value) => setFormData({ ...formData, faixa_etaria: value })}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Cor da Turma</Label>
              <div className="flex gap-2">
                {cores.map((cor) => (
                  <button
                    key={cor.value}
                    type="button"
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
            <Button variant="cancel" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Turmas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map((turma) => (
          <Card key={turma.id} className="relative group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${cores.find(c => c.value === turma.cor)?.color || 'bg-gray-400'}`} />
                  <Badge variant="outline">{turma.faixa_etaria}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="editOutline"
                    size="icon"
                    onClick={() => openEditDialog(turma)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructiveOutline"
                    size="icon"
                    onClick={() => handleDelete(turma)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{turma.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{turma.alunos_count} aluno(s)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {turma.faixa_etaria}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {turmas.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma turma cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando sua primeira turma para organizar os alunos
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary-500 text-white hover:bg-primary-600">
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Turma
          </Button>
        </div>
      )}
    </div>
  );
}
