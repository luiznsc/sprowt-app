import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sparkles, MessageSquare, FileText, Send, Loader2, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/use-app";

interface ChatMessage {
  id: string;
  tipo: "usuario" | "assistente";
  conteudo: string;
  timestamp: string;
  metadata?: {
    aluno?: string;
    tipo?: string;
  };
}

export function AssistenteIA() {
  const { alunos, supabase, user } = useApp();
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [tipoAjuda, setTipoAjuda] = useState<string>("");
  const [pergunta, setPergunta] = useState("");
  const [relatorioTexto, setRelatorioTexto] = useState("");
  const [contextoExtra, setContextoExtra] = useState("");
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const { toast } = useToast();

  const tiposDeAjuda = [
    { value: "gerar_relatorio", label: "🎯 Gerar relatório completo" },
    { value: "revisar_relatorio", label: "✨ Revisar relatório existente" },
    { value: "sugestoes_atividades", label: "🎨 Sugestões de atividades" },
    { value: "conversa_livre", label: "💬 Conversa livre" }
  ];


  // Se está debugando, mostra o estado
  if (isDebugging) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 DEBUG - Estado do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>User:</strong> 
              <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Supabase disponível:</strong> {supabase ? '✅ Sim' : '❌ Não'}
            </div>
            <div>
              <strong>Alunos carregados:</strong> {alunos?.length || 0}
            </div>
            <div>
              <strong>User é null?:</strong> {user === null ? '❌ SIM (Por isso não funciona)' : '✅ NÃO'}
            </div>
            <div>
              <strong>User é undefined?:</strong> {user === undefined ? '❌ SIM (Por isso não funciona)' : '✅ NÃO'}
            </div>
            <Button onClick={() => setIsDebugging(false)} className="w-full">
              Continuar para IA (mesmo com problemas)
            </Button>
            <Button 
              onClick={() => {
                console.log('🔄 Tentando pegar sessão diretamente:');
                supabase?.auth.getSession().then(result => {
                  console.log('📋 Resultado getSession:', result);
                });
              }} 
              variant="outline"
              className="w-full"
            >
              Testar getSession no Console
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Brain className="h-12 w-12 text-yellow-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-yellow-800">Login Necessário</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  Você precisa estar logado para usar o Assistente IA.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Debug: user = {String(user)} | supabase = {supabase ? 'OK' : 'ERRO'}
                </p>
              </div>
              <Button onClick={() => setIsDebugging(true)} variant="outline" size="sm">
                🔍 Ver Debug
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função simplificada para chamar a Edge Function
  const chamarAssistenteIA = async (prompt: string, alunoNome?: string, tipo?: string, contexto?: string) => {
    try {
      // Pegar o token JWT da sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Token de acesso não encontrado. Faça login novamente.');
      }

      // Tentar primeiro com supabase.functions.invoke
      try {
        const { data, error } = await supabase.functions.invoke('gemini-ai', {
          body: {
            prompt, // Apenas o prompt do usuário
            alunoNome: alunoNome || null,
            tipo: tipo || 'conversa_livre',
            contexto: contexto || null
          }
        });
        
        if (error) {
          throw new Error(error.message || 'Erro na chamada da função');
        }
        
        if (!data) {
          throw new Error('Nenhum dado retornado da função');
        }

        if (!data.success) {
          throw new Error(data.error || 'Erro desconhecido na função');
        }
        
        return {
          resposta: data.resposta,
          metadata: data.metadata
        };
      } catch (corsError) {
        console.log('🔄 Tentando com fetch direto devido a CORS...');
        
        // Fallback: usar fetch direto com headers corretos
        const response = await fetch('https://owrqmsvokuwywzzdmnlk.supabase.co/functions/v1/gemini-ai', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            prompt, // Apenas o prompt do usuário
            alunoNome: alunoNome || null,
            tipo: tipo || 'conversa_livre',
            contexto: contexto || null
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Erro desconhecido na função');
        }
        
        return {
          resposta: data.resposta,
          metadata: data.metadata
        };
      }
    } catch (error) {
      throw error;
    }
  };

  const adicionarMensagem = (tipo: "usuario" | "assistente", conteudo: string, metadata?: any) => {
    const novaMensagem: ChatMessage = {
      id: Date.now().toString(),
      tipo,
      conteudo,
      timestamp: new Date().toISOString(),
      metadata
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
    adicionarMensagem("usuario", `Gerar relatório completo para ${aluno.nome}`, { aluno: aluno.nome });

    try {
      // Prompt simples - o Supabase vai adicionar o system prompt
      const prompt = `Gere um relatório pedagógico completo para ${aluno.nome}`;

      const contexto = `Aluno: ${aluno.nome}, Idade: ${aluno.idade} anos, Turma: ${aluno.turma}${aluno.observacoes ? `, Observações: ${aluno.observacoes}` : ''}${contextoExtra ? `, ${contextoExtra}` : ''}`;
      
      const resultado = await chamarAssistenteIA(prompt, aluno.nome, 'gerar_relatorio', contexto);
      
      adicionarMensagem("assistente", resultado.resposta, resultado.metadata);

      toast({
        title: "✅ Relatório gerado!",
        description: "Relatório completo criado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao gerar relatório",
        description: error.message || "Erro ao conectar com o assistente IA",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
      const alunoInfo = alunoSelecionado ? alunos.find(a => a.id === alunoSelecionado) : null;
      
      // Enviar apenas a pergunta do usuário + contexto básico
      const resultado = await chamarAssistenteIA(
        pergunta, // Apenas a pergunta do usuário
        alunoInfo?.nome,
        tipoAjuda || 'conversa_livre',
        contextoExtra || (alunoInfo ? `Aluno: ${alunoInfo.nome}, Turma: ${alunoInfo.turma}, Idade: ${alunoInfo.idade}` : undefined)
      );
      
      adicionarMensagem("assistente", resultado.resposta, resultado.metadata);
      setPergunta("");
      
    } catch (error: any) {
      toast({
        title: "❌ Erro no Assistente IA",
        description: error.message || "Erro ao processar pergunta",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      toast({
        title: "📋 Texto copiado!",
        description: "Conteúdo copiado para a área de transferência"
      });
    });
  };

  const limparChat = () => {
    setMensagens([]);
    toast({
      title: "🧹 Chat limpo",
      description: "Histórico removido"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assistente IA</h2>
          <p className="text-muted-foreground">
            🔐 Powered by Gemini AI - Conexão segura com autenticação
          </p>
          <p className="text-xs text-green-600">
            ✅ Usuário autenticado: {user?.email || user?.id || 'ID não encontrado'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDebugging(true)} size="sm">
            🔍 Debug
          </Button>
          <Button variant="outline" onClick={limparChat} size="sm" disabled={mensagens.length === 0}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Chat
          </Button>
        </div>
      </div>

      {/* Configurações */}
      <Card className="bg-white shadow-soft">
        <CardHeader>
          <CardTitle>⚙️ Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label>Aluno (Opcional)</Label>
              <Select 
                value={alunoSelecionado || ""} 
                onValueChange={(value) => setAlunoSelecionado(value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-none">Nenhum aluno específico</SelectItem>
                  {(alunos || []).map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id || ""}>
                      {aluno.nome} - {aluno.turma} ({aluno.idade} anos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tipo de Ajuda</Label>
              <Select 
                value={tipoAjuda || ""} 
                onValueChange={(value) => setTipoAjuda(value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-none">Escolha uma opção</SelectItem>
                  {tiposDeAjuda.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value || "default"}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Contexto Adicional (Opcional)</Label>
            <Textarea
              placeholder="Informações extras sobre o aluno ou situação específica..."
              value={contextoExtra}
              onChange={(e) => setContextoExtra(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ferramentas */}
        <div className="space-y-4">
          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Gerar Relatório
              </CardTitle>
              <CardDescription>
                Crie um relatório pedagógico completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGerarRelatorio}
                disabled={isLoading || !alunoSelecionado}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Perguntas Livres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Como desenvolver autonomia em crianças de 4 anos?"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handlePerguntaLivre}
                disabled={isLoading || !pergunta.trim()}
                variant="outline"
                className="w-full"
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

        {/* Chat */}
        <Card className="bg-white shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversa com IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-y-auto space-y-4 bg-slate-50 p-4 rounded-lg">
              {mensagens.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Nenhuma conversa ainda</h3>
                  <p className="text-sm">Use as ferramentas ao lado!</p>
                </div>
              ) : (
                mensagens.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.tipo === "usuario" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-lg text-sm relative group ${
                        msg.tipo === "usuario"
                          ? "bg-blue-600 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {msg.tipo === "assistente" && <Brain className="h-4 w-4 text-blue-600" />}
                        <span className="font-medium text-xs opacity-70">
                          {msg.tipo === "usuario" ? "Você" : "IA"}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.conteudo}</div>
                      
                      {msg.tipo === "assistente" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copiarTexto(msg.conteudo)}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm">🔐 Processando de forma segura...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
