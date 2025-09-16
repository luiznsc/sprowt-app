import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Calendar, MessageSquare, Star, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/use-app";
import { useSearchParams } from "react-router-dom";
import { database, ObservacaoAluno, TipoObservacao } from "@/lib/supabase";

const tiposObservacao: { value: TipoObservacao; label: string; color: string }[] = [
  { value: 'comportamental', label: 'Comportamental', color: 'bg-blue-100 text-blue-800' },
  { value: 'cognitivo', label: 'Cognitivo', color: 'bg-purple-100 text-purple-800' },
  { value: 'motora', label: 'Motora', color: 'bg-green-100 text-green-800' },
  { value: 'alimentacao', label: 'Alimentação', color: 'bg-orange-100 text-orange-800' },
  { value: 'social', label: 'Social', color: 'bg-pink-100 text-pink-800' },
  { value: 'comunicacao', label: 'Comunicação', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'autonomia', label: 'Autonomia', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'rotina', label: 'Rotina', color: 'bg-yellow-100 text-yellow-800' }
];

export function ObservacoesManager() {
  const { alunos } = useApp();
  const [searchParams] = useSearchParams();
  const alunoSelecionado = searchParams.get('aluno');
  
  const [observacoes, setObservacoes] = useState<ObservacaoAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Filtros
  const [filtroAluno, setFiltroAluno] = useState(alunoSelecionado || "todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  
  const [formData, setFormData] = useState({
    id_aluno: alunoSelecionado || "",
    tipo_obs: 'comportamental' as TipoObservacao,
    range_avaliacao: 1,
    obs: ""
  });
  const obsTexto = formData.obs ? formData.obs.toString().trim() : '';
  const alunoId = formData.id_aluno ? formData.id_aluno.toString().trim() : '';

  const { toast } = useToast();

  useEffect(() => {
    loadObservacoes();
    if (alunoSelecionado) {
      setFiltroAluno(alunoSelecionado);
      setFormData(prev => ({ ...prev, id_aluno: alunoSelecionado }));
    }
  }, [alunoSelecionado]);

  const loadObservacoes = async () => {
    try {
      setLoading(true);
      const data = await database.getAllObservacoes();
      setObservacoes(data);
    } catch (error) {
      console.error('Erro ao carregar observações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!alunoId || !obsTexto) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um aluno e preencha a observação",
        variant: "destructive"
      });
      return;
    }

    try {
      const novaObservacao = await database.createObservacao({
        id_aluno: formData.id_aluno,
        tipo_obs: formData.tipo_obs,
        range_avaliacao: formData.range_avaliacao,
        obs: formData.obs
      });

      setObservacoes(prev => [novaObservacao, ...prev]);
      setIsAddDialogOpen(false);
      setFormData({ 
        id_aluno: alunoSelecionado || "", 
        tipo_obs: 'comportamental', 
        range_avaliacao: 1, 
        obs: "" 
      });
      
      toast({
        title: "Observação adicionada!",
        description: "A observação foi registrada com sucesso."
      });
    } catch (error) {
      console.error('Erro ao criar observação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a observação",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (observacao: ObservacaoAluno) => {
    try {
      await database.deleteObservacao(observacao.id);
      setObservacoes(prev => prev.filter(obs => obs.id !== observacao.id));
      
      toast({
        title: "Observação removida",
        description: "A observação foi excluída do sistema."
      });
    } catch (error) {
      console.error('Erro ao deletar observação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a observação",
        variant: "destructive"
      });
    }
  };

  const getAlunoNome = (alunoId: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    return aluno ? aluno.nome : 'Aluno não encontrado';
  };

  const getTipoInfo = (tipo: TipoObservacao) => {
    return tiposObservacao.find(t => t.value === tipo) || tiposObservacao;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar observações
  const observacoesFiltradas = observacoes.filter(obs => {
    const matchAluno = filtroAluno === "todos" || obs.id_aluno === filtroAluno;
    const matchTipo = filtroTipo === "todos" || obs.tipo_obs === filtroTipo;
    return matchAluno && matchTipo;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Carregando observações...</p>
      </div>
    );
  }

  const alunoFiltrado = alunos.find(a => a.id === alunoSelecionado);
  const titulo = alunoFiltrado 
    ? `Observações - ${alunoFiltrado.nome}` 
    : "Observações dos Alunos";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{titulo}</h1>
          <p className="text-muted-foreground">
            {alunoFiltrado 
              ? "Acompanhe o desenvolvimento específico deste aluno"
              : "Registre e acompanhe o desenvolvimento dos alunos"
            }
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 text-white hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Nova Observação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Observação</DialogTitle>
              <DialogDescription>
                {alunoFiltrado 
                  ? `Registrar observação para ${alunoFiltrado.nome}`
                  : "Registrar nova observação para um aluno"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!alunoFiltrado && (
                <div>
                  <Label htmlFor="aluno">Selecionar Aluno *</Label>
                  <Select value={formData.id_aluno} onValueChange={(value) => setFormData({ ...formData, id_aluno: value })}>
                    <SelectTrigger className="bg-gray-200">
                      <SelectValue placeholder="Escolha um aluno" />
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
              )}
              
              <div>
                <Label htmlFor="tipo">Tipo de Observação *</Label>
                <Select 
                  value={formData.tipo_obs} 
                  onValueChange={(value: TipoObservacao) => setFormData({ ...formData, tipo_obs: value })}
                >
                  <SelectTrigger className="bg-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposObservacao.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Avaliação (1-5 estrelas) *</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, range_avaliacao: star })}
                      className="p-1"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= formData.range_avaliacao 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="observacao">
                  Observação
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="observacao"
                  placeholder="Descreva sua observação detalhadamente..."
                  value={formData.obs}
                  onChange={(e) => {
                    setFormData({ ...formData, obs: e.target.value });
                  }}
                  rows={4}
                  maxLength={500}
                  className="bg-gray-200"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {(formData.obs || '').length}/500 caracteres
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} className="bg-orange-500 text-white hover:bg-orange-600">
                Adicionar Observação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros - apenas se não for específico de aluno */}
      {!alunoFiltrado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filtro-aluno">Aluno</Label>
                <Select value={filtroAluno} onValueChange={setFiltroAluno}>
                  <SelectTrigger  className="bg-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" >Todos os alunos</SelectItem>
                    {alunos.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filtro-tipo">Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger  className="bg-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {tiposObservacao.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Observações */}
      <div className="grid grid-cols-1 gap-4">
        {observacoesFiltradas.map((observacao) => {
          const tipoInfo = getTipoInfo(observacao.tipo_obs);
          return (
            <Card key={observacao.id} className="bg-white shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      {!alunoFiltrado && (
                        <CardTitle className="text-lg">{getAlunoNome(observacao.id_aluno)}</CardTitle>
                      )}
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge className={tipoInfo.color}>
                          {tipoInfo.label}
                        </Badge>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= observacao.range_avaliacao 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(observacao.data_registro)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(observacao)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{observacao.obs}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {observacoesFiltradas.length === 0 && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {alunoFiltrado 
                ? `Nenhuma observação para ${alunoFiltrado.nome}`
                : "Nenhuma observação encontrada"
              }
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {alunos.length === 0 
                ? "Primeiro, você precisa cadastrar alunos no sistema" 
                : "Comece registrando as primeiras observações sobre o desenvolvimento dos alunos"
              }
            </p>
            {alunos.length > 0 && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Observação
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
