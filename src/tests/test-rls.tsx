import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase, database } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export function TestRLS() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const runRLSTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    try {
      // Teste 1: Verificar se RLS está habilitado
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('is_rls_enabled', { table_name: 'observacoes_aluno' })
        .single();

      if (rlsError) {
        testResults.push({
          test: "RLS Status",
          status: 'error',
          message: `Erro ao verificar RLS: ${rlsError.message}`
        });
      } else {
        testResults.push({
          test: "RLS Status",
          status: rlsStatus ? 'success' : 'error',
          message: rlsStatus ? 'RLS está habilitado' : 'RLS NÃO está habilitado'
        });
      }

      // Teste 2: Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        testResults.push({
          test: "Autenticação",
          status: 'error',
          message: 'Usuário não autenticado'
        });
      } else {
        testResults.push({
          test: "Autenticação",
          status: 'success',
          message: `Usuário autenticado: ${user.email}`
        });
      }

      // Teste 3: Tentar ler observações (deve funcionar se autenticado)
      try {
        const observacoes = await database.getAllObservacoes();
        testResults.push({
          test: "Leitura de Observações",
          status: 'success',
          message: `✅ Consegue ler ${observacoes.length} observações`
        });
      } catch (error: any) {
        testResults.push({
          test: "Leitura de Observações",
          status: 'error',
          message: `❌ Erro ao ler: ${error.message}`
        });
      }

      // Teste 4: Tentar inserir observação de teste
      if (user) {
        try {
          // Primeiro, pegue um aluno existente
          const alunos = await database.getAlunos();
          
          if (alunos.length > 0) {
            const testObservacao = {
              id_aluno: alunos.id,
              tipo_obs: 'comportamental' as const,
              range_avaliacao: 5,
              obs: 'Teste RLS - pode deletar'
            };

            const novaObs = await database.createObservacao(testObservacao);
            
            // Limpar teste - deletar a observação criada
            await database.deleteObservacao(novaObs.id);
            
            testResults.push({
              test: "Inserção/Deleção",
              status: 'success',
              message: '✅ Consegue inserir e deletar observações'
            });
          } else {
            testResults.push({
              test: "Inserção/Deleção",
              status: 'warning',
              message: '⚠️ Sem alunos para testar inserção'
            });
          }
        } catch (error: any) {
          testResults.push({
            test: "Inserção/Deleção",
            status: 'error',
            message: `❌ Erro ao inserir: ${error.message}`
          });
        }
      }

      // Teste 5: Verificar policies existentes
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'observacoes_aluno');

      if (policiesError) {
        testResults.push({
          test: "Políticas RLS",
          status: 'error',
          message: `Erro ao verificar políticas: ${policiesError.message}`
        });
      } else {
        testResults.push({
          test: "Políticas RLS",
          status: policies.length > 0 ? 'success' : 'warning',
          message: `${policies.length} política(s) encontrada(s)`
        });
      }

    } catch (error: any) {
      testResults.push({
        test: "Erro Geral",
        status: 'error',
        message: `Erro nos testes: ${error.message}`
      });
    }

    setResults(testResults);
    setTesting(false);

    // Mostrar resumo
    const successCount = testResults.filter(r => r.status === 'success').length;
    const totalTests = testResults.length;
    
    toast({
      title: `Testes RLS Concluídos`,
      description: `${successCount}/${totalTests} testes passaram`,
      variant: successCount === totalTests ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Teste de Segurança RLS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verifica se as políticas de Row Level Security estão funcionando corretamente
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runRLSTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Executando Testes...' : 'Executar Testes RLS'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Resultados dos Testes:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.test}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h5 className="font-semibold mb-2">Mensagens Detalhadas:</h5>
              {results.map((result, index) => (
                <div key={index} className="text-sm mb-1">
                  <strong>{result.test}:</strong> {result.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
