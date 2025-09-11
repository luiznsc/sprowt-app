import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BookOpen, Heart, Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(formData.email, formData.password);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error: unknown) {
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2 mb-6">
              <img 
                src="https://owrqmsvokuwywzzdmnlk.supabase.co/storage/v1/object/public/assets/sprowt-logo2.png" 
                alt="Sprowt Logo" 
                className="h-10 w-10 object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
            <h1 className="text-3xl font-bold text-[#2E4E0D]">SPROWT</h1>
          </div>
          <div className="flex justify-center gap-4 text-[#2E4E0D]">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Cuidado</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">Qualidade</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Educação</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-8" />
      <Card className="w-full max-w-md bg-gray-50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Bem-vinda, Professora!
          </CardTitle>
          <CardDescription>
            Acesse seu sistema de relatórios
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@escola.com"
                className="bg-gray-200"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                className="bg-gray-200"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-[#2E4E0D] hover:bg-[#4A7A16] text-white font-semibold h-11 transition-colors"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Não tem uma conta?{" "}
              <Link to="/signup" className="text-[#2E4E0D] hover:text-[#4A7A16] hover:underline font-medium transition-colors">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
