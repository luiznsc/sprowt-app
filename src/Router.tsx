import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { AppProvider } from "@/context/AppContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { TurmasManager } from "@/components/turmas/TurmasManager";
import { AlunosManager } from "@/components/alunos/AlunosManager";
import { RelatoriosManager } from "@/components/relatorios/RelatoriosManager";
import { AssistenteIA } from "@/components/ia/AssistenteIA";
import { ObservacoesManager } from "@/components/alunos/ObservacaoAluno/ObservacoesManager";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/signup",
    element: <SignUpForm />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppProvider>
          <DashboardLayout />
        </AppProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <DashboardHome />,
      },
      {
        path: "turmas",
        element: (
          <ProtectedRoute>
            <TurmasManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "alunos",
        element: (
          <ProtectedRoute>
            <AlunosManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "observacoes",
        element: (
          <ProtectedRoute>
            <ObservacoesManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "relatorios",
        element: (
          <ProtectedRoute>
            <RelatoriosManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "ia",
        element: (
          <ProtectedRoute>
            <AssistenteIA />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
