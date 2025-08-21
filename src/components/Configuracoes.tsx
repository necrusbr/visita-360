import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  RotateCcw,
  Upload,
  Image,
  Palette,
  User,
  Clock,
  AlertTriangle
} from "lucide-react";
import { AppConfig } from "../types";
import { useToast } from "@/hooks/use-toast";

interface ConfiguracoesProps {
  config: AppConfig;
  onUpdateConfig: (updates: Partial<AppConfig>) => void;
  onResetData: () => void;
}

export default function Configuracoes({ config, onUpdateConfig, onResetData }: ConfiguracoesProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    vendedor: config.vendedor || '',
    prazo: config.prazo || 3,
    compact: config.compact || false,
    brandColor: config.brandColor || '#2563eb',
    logoURL: ''
  });

  const [logoPreview, setLogoPreview] = useState<string>(config.logo || '');

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      localStorage.setItem('visita360_logo', result);
      
      toast({
        title: "Logo carregado!",
        description: "A nova logo foi salva com sucesso",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLogoURL = () => {
    if (formData.logoURL) {
      setLogoPreview(formData.logoURL);
      localStorage.setItem('visita360_logo', formData.logoURL);
      setFormData(prev => ({ ...prev, logoURL: '' }));
      
      toast({
        title: "Logo atualizada!",
        description: "A logo foi carregada pela URL",
      });
    }
  };

  const handleColorChange = (color: string) => {
    handleInputChange('brandColor', color);
    
    // Aplicar cor imediatamente
    document.documentElement.style.setProperty('--brand-color', color);
    localStorage.setItem('visita360_color', color);
  };

  const handleSaveConfig = () => {
    const updates: Partial<AppConfig> = {
      vendedor: formData.vendedor,
      prazo: formData.prazo,
      compact: formData.compact,
      brandColor: formData.brandColor,
      logo: logoPreview
    };

    onUpdateConfig(updates);

    // Aplicar modo compacto
    document.body.classList.toggle('compact', formData.compact);
    
    toast({
      title: "Configurações salvas!",
      description: "Todas as alterações foram aplicadas",
    });
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.')) {
      onResetData();
      localStorage.removeItem('visita360_logo');
      localStorage.removeItem('visita360_color');
      setLogoPreview('');
      
      toast({
        title: "Dados resetados!",
        description: "Todos os dados foram removidos e o sistema foi reiniciado com dados de demonstração",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configurações Principais */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configurações de Usuário */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Vendedor Atual
                </label>
                <Input
                  value={formData.vendedor}
                  onChange={(e) => handleInputChange('vendedor', e.target.value)}
                  placeholder="Nome do vendedor"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome que aparecerá nas novas visitas cadastradas
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Prazo para Follow-up (dias)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.prazo}
                  onChange={(e) => handleInputChange('prazo', parseInt(e.target.value) || 3)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quantos dias após a última interação para alertar sobre follow-up pendente
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-glass-border">
                <div>
                  <div className="font-medium">Modo Compacto</div>
                  <div className="text-sm text-muted-foreground">
                    Reduz espaçamentos e tamanhos de fonte para mostrar mais informações
                  </div>
                </div>
                <Switch
                  checked={formData.compact}
                  onCheckedChange={(checked) => handleInputChange('compact', checked)}
                />
              </div>
            </div>

            {/* Personalização Visual */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Cor Primária
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-20 h-10"
                  />
                  <div className="flex-1">
                    <Input
                      value={formData.brandColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cor principal da interface (botões, destaques, etc.)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Logo da Empresa
                </label>
                
                {logoPreview && (
                  <div className="mb-3 p-3 rounded-lg border border-glass-border bg-brand-50/30">
                    <div className="flex items-center gap-3">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview"
                        className="w-12 h-12 object-contain rounded-lg bg-white"
                      />
                      <div>
                        <div className="text-sm font-medium">Logo atual</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogoPreview('');
                            localStorage.removeItem('visita360_logo');
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Carregar Arquivo de Logo
                  </Button>

                  <div className="flex gap-2">
                    <Input
                      value={formData.logoURL}
                      onChange={(e) => handleInputChange('logoURL', e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleLogoURL}
                      disabled={!formData.logoURL}
                    >
                      Aplicar URL
                    </Button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos suportados: JPG, PNG, SVG. Tamanho recomendado: 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-glass-border">
            <Button onClick={handleSaveConfig} className="btn-brand flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Configurações
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFormData({
                  vendedor: config.vendedor || '',
                  prazo: config.prazo || 3,
                  compact: config.compact || false,
                  brandColor: config.brandColor || '#2563eb',
                  logoURL: ''
                });
                setLogoPreview(config.logo || '');
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Cancelar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="glass border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <h3 className="font-medium text-destructive mb-2">Resetar Dados</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Remove todas as visitas, follow-ups e configurações. 
                Restaura o sistema com dados de demonstração.
                <strong className="text-destructive"> Esta ação não pode ser desfeita!</strong>
              </p>
              <Button 
                variant="destructive" 
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar Todos os Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-brand-50">
              <div className="text-lg font-bold text-brand-600">Visita360</div>
              <div className="text-sm text-muted-foreground">Sistema de Gestão de Visitas</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/20">
              <div className="text-lg font-bold">v2.0.0</div>
              <div className="text-sm text-muted-foreground">Versão Atual</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-success/10">
              <div className="text-lg font-bold text-success">Local</div>
              <div className="text-sm text-muted-foreground">Armazenamento</div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Os dados são armazenados localmente no seu navegador. 
            Para backup, use as funções de exportação disponíveis nos relatórios.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}