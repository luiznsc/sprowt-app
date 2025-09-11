import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sparkles, MessageSquare, FileText, Send, Loader2, Settings, Key } from "lucide-react";
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

interface ChatMessage {
  id: string;
  tipo: "usuario" | "assistente";
  conteudo: string;
  timestamp: string;
}

import { useApp } from "@/context/use-app";

export function AssistenteIA() {
  const { alunos, onRequestAI } = useApp();
  const [apiKey, setApiKey] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [tipoAjuda, setTipoAjuda] = useState<string>("");
  const [pergunta, setPergunta] = useState("");
  const [relatorioTexto, setRelatorioTexto] = useState("");
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const tiposDeAjuda = [
    { value: "gerar_relatorio", label: "Gerar relatório completo" },
    { value: "revisar_relatorio", label: "Revisar relatório existente" },
    { value: "sugestoes_atividades", label: "Sugestões de atividades" },
    { value: "analise_desenvolvimento", label: "Análise de desenvolvimento" },
    { value: "conversa_livre", label: "Conversa livre sobre educação" }
  ];

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key obrigatória",
        description: "Por favor, insira sua API Key da OpenAI",
        variant: "destructive"
      });
      return;
    }

    // Salvar no localStorage temporariamente
    localStorage.setItem("openai_api_key", apiKey);
    setIsConfigured(true);
    
    toast({
      title: "Configuração salva!",
      description: "Sua API Key foi salva com segurança. Agora você pode usar o assistente IA.",
    });
  };

  const adicionarMensagem = (tipo: "usuario" | "assistente", conteudo: string) => {
    const novaMensagem: ChatMessage = {
      id: Date.now().toString(),
      tipo,
      conteudo,
      timestamp: new Date().toISOString()
    };
    setMensagens(prev => [...prev, novaMensagem]);
  };

  const handleGerarRelatorio = async () => {
    if (!alunoSelecionado) {
      toast({
        title: "Selecione um aluno",
        description: "Escolha um aluno para gerar o relatório",
        variant: "destructive"
      });
      return;
    }

    const aluno = alunos.find(a => a.id === alunoSelecionado);
    if (!aluno) return;

    setIsLoading(true);
    adicionarMensagem("usuario", `Gerar relatório completo para ${aluno.nome}`);

    try {
      const prompt = `Gere um relatório completo de educação infantil para o aluno ${aluno.nome} (${aluno.idade} anos) da turma ${aluno.turma}.

O relatório deve incluir:
- Desenvolvimento cognitivo (aprendizagem, concentração, curiosidade)
- Desenvolvimento social e emocional (relacionamentos, expressão de sentimentos)
- Desenvolvimento motor (coordenação, habilidades físicas)
- Linguagem e comunicação (expressão oral, compreensão)
- Participação em atividades (interesse, engajamento)
- Relacionamento com colegas e professores
- Sugestões de atividades para casa

Use linguagem positiva, construtiva e adequada para educação infantil. Seja específico mas carinhoso. O relatório deve ter entre 300-500 palavras.`;

      const resposta = await onRequestAI(prompt, aluno.nome);
      adicionarMensagem("assistente", resposta);

      toast({
        title: "Relatório gerado!",
        description: "Relatório completo criado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório. Verifique sua API Key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevisarRelatorio = async () => {
    if (!relatorioTexto.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Cole o texto do relatório para revisão",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    adicionarMensagem("usuario", `Revisar relatório: ${relatorioTexto.substring(0, 100)}...`);

    try {
      const prompt = `Por favor, revise o seguinte relatório de educação infantil e sugira melhorias:

"${relatorioTexto}"

Analise e sugira melhorias em:
1. Clareza e estrutura
2. Linguagem adequada para educação infantil
3. Aspectos positivos a destacar
4. Sugestões de desenvolvimento
5. Correções gramaticais se necessário

Mantenha o tom carinhoso e construtivo.`;

      const resposta = await onRequestAI(prompt);
      adicionarMensagem("assistente", resposta);

      toast({
        title: "Revisão concluída!",
        description: "Sua revisão foi gerada com sugestões de melhoria"
      });
    } catch (error) {
      toast({
        title: "Erro na revisão",
        description: "Não foi possível revisar o relatório. Verifique sua API Key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setRelatorioTexto("");
    }
  };

  const handlePerguntaLivre = async () => {
    if (!pergunta.trim()) {
      toast({
        title: "Digite sua pergunta",
        description: "Escreva sua pergunta sobre educação infantil",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    adicionarMensagem("usuario", pergunta);

    try {
      const prompt = `Como especialista em educação infantil, responda à seguinte pergunta:

"${pergunta}"

Forneça uma resposta prática, baseada em pedagogia infantil e adequada para professores de educação infantil. Seja clara e útil.`;

      const resposta = await onRequestAI(prompt);
      adicionarMensagem("assistente", resposta);

      setPergunta("");
    } catch (error) {
      toast({
        title: "Erro ao responder",
        description: "Não foi possível processar sua pergunta. Verifique sua API Key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSugestaoAtividades = async () => {
    if (!alunoSelecionado) {
      toast({
        title: "Selecione um aluno",
        description: "Escolha um aluno para gerar sugestões de atividades",
        variant: "destructive"
      });
      return;
    }

    const aluno = alunos.find(a => a.id === alunoSelecionado);
    if (!aluno) return;

    setIsLoading(true);
    adicionarMensagem("usuario", `Sugestões de atividades para ${aluno.nome}`);

    try {
      const prompt = `Crie sugestões de atividades educativas para ${aluno.nome} (${aluno.idade} anos) da turma ${aluno.turma}.

Inclua:
- 5 atividades para desenvolver coordenação motora
- 5 atividades para estimular linguagem
- 5 atividades criativas (arte, música, etc)
- 3 atividades para fazer em casa com a família

Todas as atividades devem ser adequadas para a idade da criança e divertidas.`;

      const resposta = await onRequestAI(prompt, aluno.nome);
      adicionarMensagem("assistente", resposta);

      toast({
        title: "Atividades sugeridas!",
        description: "Lista de atividades educativas criada"
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar atividades",
        description: "Não foi possível gerar as sugestões.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const limparChat = () => {
    setMensagens([]);
    toast({
      title: "Chat limpo",
      description: "Histórico de conversas removido"
    });
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assistente IA</h2>
          <p className="text-muted-foreground">Configure a integração com OpenAI para usar o assistente</p>
        </div>

        <Card className="bg-gradient-accent text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Configuração Necessária
            </CardTitle>
            <CardDescription className="text-white/90">
              Para usar o assistente IA, você precisa de uma API Key da OpenAI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apikey" className="text-white">API Key da OpenAI *</Label>
              <Input
                id="apikey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
              <p className="text-xs text-white/80 mt-1">
                Sua API Key será armazenada localmente e usada apenas para esta sessão
              </p>
            </div>
            
            <Button 
              onClick={handleSaveApiKey}
              className="bg-white text-accent hover:bg-white/90"
            >
              <Settings className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground">Como obter uma API Key?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  1. Acesse platform.openai.com<br/>
                  2. Crie uma conta ou faça login<br/>
                  3. Vá em "API Keys" e crie uma nova chave<br/>
                  4. Cole a chave no campo acima
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assistente IA</h2>
          <p className="text-muted-foreground">Use inteligência artificial para criar e revisar relatórios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={limparChat} size="sm">
            Limpar Chat
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              localStorage.removeItem("openai_api_key");
              setIsConfigured(false);
              setApiKey("");
            }}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Reconfigurar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ferramentas de IA */}
        <div className="space-y-6">
          {/* Gerar Relatório */}
          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Gerar Relatório Completo
              </CardTitle>
              <CardDescription>
                Crie um relatório completo automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecionar Aluno</Label>
                <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id}>
                        {aluno.nome} - {aluno.turma} ({aluno.idade} anos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGerarRelatorio}
                disabled={isLoading || !alunoSelecionado}
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          {/* Revisar Relatório */}
          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                Revisar Relatório
              </CardTitle>
              <CardDescription>
                Cole um relatório existente para revisão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Texto do Relatório</Label>
                <Textarea
                  placeholder="Cole aqui o texto do relatório que você quer revisar..."
                  value={relatorioTexto}
                  onChange={(e) => setRelatorioTexto(e.target.value)}
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleRevisarRelatorio}
                disabled={isLoading || !relatorioTexto.trim()}
                className="w-full bg-gradient-accent hover:opacity-90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Revisar com IA
              </Button>
            </CardContent>
          </Card>

          {/* Sugestões de Atividades */}
          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-success" />
                Sugestões de Atividades
              </CardTitle>
              <CardDescription>
                Receba ideias de atividades personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSugestaoAtividades}
                disabled={isLoading || !alunoSelecionado}
                className="w-full bg-gradient-success hover:opacity-90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar Atividades
              </Button>
            </CardContent>
          </Card>

          {/* Chat Livre */}
          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-secondary" />
                Perguntas Livres
              </CardTitle>
              <CardDescription>
                Faça perguntas sobre educação infantil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sua Pergunta</Label>
                <Textarea
                  placeholder="Ex: Como lidar com uma criança tímida? Atividades para desenvolver coordenação motora..."
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  rows={3}
                />
              </div>
              <Button 
                onClick={handlePerguntaLivre}
                disabled={isLoading || !pergunta.trim()}
                className="w-full bg-gradient-secondary hover:opacity-90 text-secondary-foreground"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Pergunta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat/Resultados */}
        <div className="space-y-4">
          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversa com IA
              </CardTitle>
              <CardDescription>
                Histórico de suas interações com o assistente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 bg-muted/30 p-4 rounded-lg">
                {mensagens.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conversa ainda.</p>
                    <p className="text-sm">Use as ferramentas ao lado para começar!</p>
                  </div>
                ) : (
                  mensagens.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.tipo === "usuario" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          msg.tipo === "usuario"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white border shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.tipo === "assistente" && <Brain className="h-4 w-4 text-accent" />}
                          <span className="font-medium text-xs opacity-70">
                            {msg.tipo === "usuario" ? "Você" : "Assistente IA"}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.conteudo}</div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        <span className="text-sm text-muted-foreground">
                          Assistente IA está pensando...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}