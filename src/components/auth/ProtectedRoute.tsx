import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserProfile } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: ("admin" | "professor")[];
}

export function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Enquanto verifica autenticação, mostra loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não tiver perfil, algo está errado
  if (!profile) {
    return <Navigate to="/error" replace />;
  }

  // Se houver tipos permitidos definidos, verifica se o usuário tem permissão
  if (allowedTypes && !allowedTypes.includes(profile.tipo)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderiza o conteúdo protegido
  return <>{children}</>;
}
