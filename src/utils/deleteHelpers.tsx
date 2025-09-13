// @/utils/deleteHelpers.ts
import { database } from "@/lib/supabase";

interface DeleteResult {
  sucesso: boolean;
  usuario?: string;
  dadosRemovidos?: {
    alunos?: number;
    observacoes?: number;
    relatorios?: number;
  };
  [key: string]: any;
}

interface DeleteOptions {
  toast?: any;
  confirm?: (options: any) => Promise<boolean>; // NOVA OPÇÃO
  onSuccess?: () => void;
  onError?: (error: string) => void;
  confirmar?: boolean;
}

export class DeleteHelper {
  
  static async deleteAluno(
    alunoId: string, 
    alunoNome: string, 
    options: DeleteOptions = {}
  ): Promise<boolean> {
    const {
      toast,
      confirm,
      confirmar = true,
      onSuccess,
      onError
    } = options;

    try {
      // 1. Confirmação com componente customizado
      if (confirmar && confirm) {
        const confirmacao = await confirm({
          title: "Deletar Aluno",
          message: `Deseja realmente deletar o aluno "${alunoNome}"?\n\nEsta ação irá remover permanentemente:\n• Todas as observações pedagógicas\n• Todos os relatórios gerados\n• Todo o histórico no sistema\n\nEsta ação não pode ser desfeita.`,
          confirmText: "Deletar",
          cancelText: "Cancelar",
          variant: "destructive"
        });

        if (!confirmacao) return false;
      }

      // 2. Executar deleção
      const resultado: DeleteResult = await database.deleteAlunoWithValidation(alunoId);

      // 3. Feedback com toast
      if (toast) {
        toast({
          title: "✅ Aluno deletado com sucesso!",
          description: `${alunoNome} foi removido. Dados deletados: ${resultado.dadosRemovidos?.observacoes || 0} observações, ${resultado.dadosRemovidos?.relatorios || 0} relatórios.`,
          variant: "default"
        });
      }

      if (onSuccess) onSuccess();
      return true;

    } catch (error: any) {
      if (toast) {
        toast({
          title: "❌ Erro ao deletar aluno",
          description: error.message,
          variant: "destructive"
        });
      }
      
      console.error('Erro ao deletar aluno:', error);
      if (onError) onError(error.message);
      return false;
    }
  }

  static async deleteTurma(
    turmaId: string, 
    turmaNome: string, 
    options: DeleteOptions = {}
  ): Promise<boolean> {
    const {
      toast,
      confirm,
      confirmar = true,
      onSuccess,
      onError
    } = options;

    try {
      if (confirmar && confirm) {
        // Primeira confirmação
        const primeiraConfirmacao = await confirm({
          title: "Deletar Turma",
          message: `Deseja realmente deletar a turma "${turmaNome}"?\n\nEsta ação irá deletar a turma E TODOS OS ALUNOS vinculados!`,
          confirmText: "Continuar",
          cancelText: "Cancelar",
          variant: "destructive"
        });

        if (!primeiraConfirmacao) return false;

        // Segunda confirmação (dupla segurança)
        const segundaConfirmacao = await confirm({
          title: "⚠️ CONFIRMAÇÃO FINAL",
          message: `ATENÇÃO: Você está prestes a deletar a turma "${turmaNome}".\n\nTODOS os alunos, observações e relatórios serão PERDIDOS PARA SEMPRE!\n\nEsta é uma ação IRREVERSÍVEL.`,
          confirmText: "SIM, DELETAR TUDO",
          cancelText: "Cancelar",
          variant: "destructive"
        });

        if (!segundaConfirmacao) return false;
      }

      // Executar deleção
      const resultado: DeleteResult = await database.deleteTurmaWithValidation(turmaId);

      if (toast) {
        toast({
          title: "✅ Turma deletada com sucesso!",
          description: `${turmaNome} foi removida. Dados deletados: ${resultado.dadosRemovidos?.alunos || 0} alunos, ${resultado.dadosRemovidos?.observacoes || 0} observações, ${resultado.dadosRemovidos?.relatorios || 0} relatórios.`,
          variant: "default"
        });
      }

      if (onSuccess) onSuccess();
      return true;

    } catch (error: any) {
      if (toast) {
        toast({
          title: "❌ Erro ao deletar turma",
          description: error.message,
          variant: "destructive"
        });
      }
      
      console.error('Erro ao deletar turma:', error);
      if (onError) onError(error.message);
      return false;
    }
  }

  // Métodos similares para observação e relatório...
  static async deleteObservacao(
    observacaoId: number,
    options: DeleteOptions = {}
  ): Promise<boolean> {
    const { toast, confirm, confirmar = true, onSuccess, onError } = options;

    try {
      if (confirmar && confirm) {
        const confirmacao = await confirm({
          title: "Deletar Observação",
          message: "Deseja realmente deletar esta observação?",
          confirmText: "Deletar",
          cancelText: "Cancelar",
          variant: "destructive"
        });

        if (!confirmacao) return false;
      }

      await database.deleteObservacaoWithValidation(observacaoId);
      
      if (toast) {
        toast({
          title: "✅ Observação deletada",
          description: "A observação foi removida com sucesso.",
          variant: "default"
        });
      }
      
      if (onSuccess) onSuccess();
      return true;

    } catch (error: any) {
      if (toast) {
        toast({
          title: "❌ Erro ao deletar observação",
          description: error.message,
          variant: "destructive"
        });
      }
      
      console.error('Erro ao deletar observação:', error);
      if (onError) onError(error.message);
      return false;
    }
  }

  static async deleteRelatorio(
    relatorioId: string,
    relatorioTitulo: string,
    options: DeleteOptions = {}
  ): Promise<boolean> {
    const { toast, confirm, confirmar = true, onSuccess, onError } = options;

    try {
      if (confirmar && confirm) {
        const confirmacao = await confirm({
          title: "Deletar Relatório",
          message: `Deseja realmente deletar o relatório "${relatorioTitulo}"?`,
          confirmText: "Deletar",
          cancelText: "Cancelar",
          variant: "destructive"
        });

        if (!confirmacao) return false;
      }

      await database.deleteRelatorioWithValidation(relatorioId);
      
      if (toast) {
        toast({
          title: "✅ Relatório deletado",
          description: `"${relatorioTitulo}" foi removido com sucesso.`,
          variant: "default"
        });
      }
      
      if (onSuccess) onSuccess();
      return true;

    } catch (error: any) {
      if (toast) {
        toast({
          title: "❌ Erro ao deletar relatório",
          description: error.message,
          variant: "destructive"
        });
      }
      
      console.error('Erro ao deletar relatório:', error);
      if (onError) onError(error.message);
      return false;
    }
  }
}

export const deleteAluno = DeleteHelper.deleteAluno;
export const deleteTurma = DeleteHelper.deleteTurma;
export const deleteObservacao = DeleteHelper.deleteObservacao;
export const deleteRelatorio = DeleteHelper.deleteRelatorio;
