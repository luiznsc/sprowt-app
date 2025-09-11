export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: ("admin" | "professor")[];
}

export interface UserNavProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

export interface DashboardHomeProps {
  turmasCount: number;
  alunosCount: number;
  relatoriosCount: number;
}
