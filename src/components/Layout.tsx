import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  FileText, 
  Map, 
  Settings,
  Menu,
  Moon,
  Sun,
  Download,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onPrint: () => void;
  notificationCenter?: ReactNode;
}

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "cadastro", label: "Cadastro de Visita", icon: Users },
  { key: "followup", label: "Follow-up", icon: MessageSquare },
  { key: "relatorios", label: "Relatórios", icon: FileText },
  { key: "mapa", label: "Mapa", icon: Map },
  { key: "config", label: "Configurações", icon: Settings },
];

export default function Layout({ 
  children, 
  activeView, 
  onViewChange, 
  onExportCSV, 
  onExportXLSX, 
  onPrint,
  notificationCenter
}: LayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    toast({
      title: `Tema ${!isDark ? 'escuro' : 'claro'} ativado`,
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-muted/30">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-80 glass m-4 animate-fade-in">
          {/* Logo */}
          <div className="p-6 border-b border-glass-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
                <img 
                  src="/src/assets/visita360-logo.png" 
                  alt="Visita360" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const sibling = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (sibling) sibling.style.display = 'block';
                  }}
                />
                <span style={{ display: 'none' }}>V</span>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                  Visita360
                </h1>
                <p className="text-sm text-muted-foreground">Gestão Inteligente de Visitas</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;
              return (
                <Button
                  key={item.key}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 transition-all duration-300 ${
                    isActive 
                      ? "bg-brand-500 hover:bg-brand-600 text-white shadow-lg" 
                      : "hover:bg-brand-50 hover:text-brand-700"
                  }`}
                  onClick={() => onViewChange(item.key)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Export Actions */}
          <div className="p-4 space-y-2 border-t border-glass-border">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-3 btn-glass"
              onClick={onExportCSV}
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-3 btn-glass"
              onClick={onExportXLSX}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-3 btn-glass"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4" />
              Imprimir PDF
            </Button>
            <Button 
              className="w-full btn-brand gap-3"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Alternar Tema
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="lg:hidden glass m-4 mb-0 p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold">
                V
              </div>
              <div>
                <h1 className="font-display font-bold text-brand-600">Visita360</h1>
                <p className="text-xs text-muted-foreground">Gestão de visitas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationCenter}
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <Card className="lg:hidden m-4 mt-2 p-4 animate-slide-up">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.key;
                  return (
                    <Button
                      key={item.key}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`justify-start gap-2 ${
                        isActive ? "bg-brand-500 hover:bg-brand-600 text-white" : ""
                      }`}
                      onClick={() => {
                        onViewChange(item.key);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Content */}
          <div className="flex-1 p-4 pt-0 lg:pt-4">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}