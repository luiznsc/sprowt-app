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
        <DashboardLayout />
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
          <ProtectedRoute allowedTypes={["admin", "professor"]}>
            <TurmasManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "alunos",
        element: (
          <ProtectedRoute allowedTypes={["admin", "professor"]}>
            <AlunosManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "relatorios",
        element: (
          <ProtectedRoute allowedTypes={["admin", "professor"]}>
            <RelatoriosManager />
          </ProtectedRoute>
        ),
      },
      {
        path: "ia",
        element: (
          <ProtectedRoute allowedTypes={["admin", "professor"]}>
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
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
