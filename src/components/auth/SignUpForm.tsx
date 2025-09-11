import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Heart, Star, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";

export function SignUpForm() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    tipo: "professor" as const
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.nome);
      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para a página de login.",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: unknown) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
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
            Criar sua Conta
          </CardTitle>
          <CardDescription>
            Preencha os dados para criar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Digite seu nome completo"
                className="bg-gray-200"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className="bg-gray-200 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de usuário</Label>
              <Input
                id="tipo"
                value="Professor"
                disabled
                className="bg-gray-300 text-gray-600"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-[#2E4E0D] hover:bg-[#4A7A16] text-white font-semibold h-11 transition-colors"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-[#2E4E0D] hover:text-[#4A7A16] hover:underline font-medium transition-colors">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
