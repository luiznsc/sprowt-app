import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="text-center space-y-4">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão para acessar esta página. 
          Entre em contato com um administrador se acha que isso é um erro.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="bg-gradient-primary hover:opacity-90"
        >
          Voltar para o início
        </Button>
      </div>
    </div>
  );
}
