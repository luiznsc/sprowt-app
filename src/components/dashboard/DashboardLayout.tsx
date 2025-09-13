import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  Users, 
  FileText,
  Home,
  Brain,
  LogOut,
  Menu,
  MessageSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, Outlet } from "react-router-dom";
import type { DashboardLayoutProps } from "./types";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/turmas", label: "Turmas", icon: Users },
    { path: "/alunos", label: "Alunos", icon: BookOpen },
    { path: "/observacoes", label: "Alunos - Observações ", icon: MessageSquare },
    { path: "/relatorios", label: "Relatórios", icon: FileText },
    { path: "/ia", label: "Assistente IA", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-0">

              <div className="bg-transparent rounded-lg p-2">
                <img 
                  src="https://owrqmsvokuwywzzdmnlk.supabase.co/storage/v1/object/public/assets/sprowt-logo2.png" 
                  alt="Sprowt Logo" 
                  className="h-12 w-12 object-contain"
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>

              <div>
                <h1 className="text-xl font-bold text-foreground">Sprowt</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão para Professoras</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{profile?.nome}</span>
                <span className="mx-2">·</span>
                <span className="capitalize">{profile?.tipo}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:bg-[#2E4E0E] hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 space-y-2">
            <Card className="p-4 bg-white shadow-soft">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-smooth",
                        location.pathname === item.path
                          ? "bg-gradient-green-custom text-white hover:opacity-90"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}