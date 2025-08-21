import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Camera, 
  Plus, 
  Trash2, 
  Edit3, 
  Navigation,
  Building2,
  Save,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Visita } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useGeocode } from "@/hooks/useGeocode";
import { useFormValidation, commonValidationRules } from "@/hooks/useFormValidation";

interface CadastroVisitaProps {
  visitas: Visita[];
  onAddVisita: (visita: Omit<Visita, 'id'>) => void;
  onUpdateVisita: (id: number, updates: Partial<Visita>) => void;
  onDeleteVisita: (id: number) => void;
  vendedor: string;
}

export default function CadastroVisita({ 
  visitas, 
  onAddVisita, 
  onUpdateVisita, 
  onDeleteVisita, 
  vendedor 
}: CadastroVisitaProps) {
  const { toast } = useToast();
  const { geocode, reverseGeocode, validateCoordinates, isLoading: isGeocoding, error: geocodeError } = useGeocode();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Configuração da validação
  const validationRules = {
    data: { required: true },
    empresa: { required: true, minLength: 2, maxLength: 100 },
    endereco: { required: true, minLength: 5, maxLength: 200 },
    lat: commonValidationRules.latitude,
    lng: commonValidationRules.longitude,
    contato: {
      custom: (value: string) => {
        if (value && value.length > 0) {
          // Se preenchido, validar formato de telefone ou email
          const isPhone = /^\(?([0-9]{2})\)?[-.\s]?([0-9]{4,5})[-.\s]?([0-9]{4})$/.test(value);
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          if (!isPhone && !isEmail) {
            return 'Deve ser um telefone ou email válido';
          }
        }
        return null;
      }
    }
  };

  const {
    data: formData,
    errors,
    hasErrors,
    validateAll,
    updateField,
    reset: resetForm,
    getFieldError,
    hasFieldError,
    touchField
  } = useFormValidation({
    data: new Date().toISOString().slice(0, 10),
    endereco: '',
    lat: '',
    lng: '',
    empresa: '',
    segmento: 'Empreiteiras' as Visita['segmento'],
    responsavel: 'Eng Civil' as Visita['responsavel'], 
    estagio: 'Inicial' as Visita['estagio'],
    concorrencia: '',
    classificacao: 'Médio' as Visita['classificacao'],
    contato: '',
    obs: ''
  }, validationRules);

  // Debounce para geocodificação automática
  const [geocodeTimeout, setGeocodeTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (field: string, value: string) => {
    updateField(field as keyof typeof formData, value);
    
    // Geocodificação automática quando o endereço muda
    if (field === 'endereco' && value.length > 10) {
      if (geocodeTimeout) {
        clearTimeout(geocodeTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleGeocode(value);
      }, 1500); // 1.5 segundos de delay
      
      setGeocodeTimeout(timeout);
    }
  };

  // Geocodificar endereço automaticamente
  const handleGeocode = useCallback(async (address: string) => {
    if (!address.trim()) return;
    
    setGeocodeStatus('idle');
    const result = await geocode(address);
    
    if (result) {
      updateField('lat', result.lat.toFixed(6));
      updateField('lng', result.lng.toFixed(6));
      setGeocodeStatus('success');
      
      toast({
        title: "Localização encontrada!",
        description: "Coordenadas preenchidas automaticamente",
      });
    } else {
      setGeocodeStatus('error');
    }
  }, [geocode, updateField, toast]);

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (geocodeTimeout) {
        clearTimeout(geocodeTimeout);
      }
    };
  }, [geocodeTimeout]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 6);
    const previews: string[] = [];
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          previews.push(e.target.result as string);
          setFotoPreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não suportada pelo navegador",
        variant: "destructive",
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      
      updateField('lat', lat);
      updateField('lng', lng);
      
      // Buscar endereço das coordenadas (reverse geocoding)
      if (!formData.endereco) {
        const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (address) {
          updateField('endereco', address);
        }
      }
      
      toast({
        title: "Localização obtida!",
        description: "Coordenadas e endereço preenchidos automaticamente",
      });
    } catch (error) {
      toast({
        title: "Erro de localização",
        description: "Não foi possível obter sua localização. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    
    // Validar todos os campos
    if (!validateAll()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    // Validar coordenadas se preenchidas
    if ((formData.lat || formData.lng) && !validateCoordinates(formData.lat, formData.lng)) {
      toast({
        title: "Coordenadas inválidas",
        description: "Por favor, verifique a latitude e longitude",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const visitaData = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        fotos: fotoPreviews,
        vendedor
      };

      if (editingId) {
        onUpdateVisita(editingId, visitaData);
        setEditingId(null);
        toast({
          title: "Visita atualizada!",
          description: "Os dados foram salvos com sucesso",
        });
      } else {
        onAddVisita(visitaData);
        toast({
          title: "Visita cadastrada!",
          description: "Nova visita adicionada ao sistema",
        });
      }

      handleResetForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a visita. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    resetForm({
      data: new Date().toISOString().slice(0, 10),
      endereco: '',
      lat: '',
      lng: '',
      empresa: '',
      segmento: 'Empreiteiras',
      responsavel: 'Eng Civil',
      estagio: 'Inicial',
      concorrencia: '',
      classificacao: 'Médio',
      contato: '',
      obs: ''
    });
    setFotoPreviews([]);
    setEditingId(null);
    setGeocodeStatus('idle');
    setSubmittedOnce(false);
    if (geocodeTimeout) {
      clearTimeout(geocodeTimeout);
      setGeocodeTimeout(null);
    }
  };

  const handleEdit = (visita: Visita) => {
    resetForm({
      data: visita.data,
      endereco: visita.endereco,
      lat: visita.lat?.toString() || '',
      lng: visita.lng?.toString() || '',
      empresa: visita.empresa,
      segmento: visita.segmento as any,
      responsavel: visita.responsavel as any,
      estagio: visita.estagio as any,
      concorrencia: visita.concorrencia,
      classificacao: visita.classificacao as any,
      contato: visita.contato,
      obs: visita.obs
    });
    setFotoPreviews(visita.fotos || []);
    setEditingId(visita.id);
    setGeocodeStatus('idle');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta visita?')) {
      onDeleteVisita(id);
      toast({
        title: "Visita excluída",
        description: "A visita foi removida do sistema",
      });
    }
  };

  const empresasUnicas = [...new Set(visitas.map(v => v.empresa))].filter(Boolean);
  const enderecosUnicos = [...new Set(visitas.map(v => v.endereco))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Formulário de Cadastro */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {editingId ? 'Editar Visita' : 'Cadastro de Nova Visita'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Data</label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Empresa *</label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => handleInputChange('empresa', e.target.value)}
                  onBlur={() => touchField('empresa')}
                  list="empresas"
                  placeholder="Nome da empresa"
                  className={hasFieldError('empresa') ? 'border-destructive' : ''}
                  required
                />
                {hasFieldError('empresa') && (
                  <p className="text-sm text-destructive">{getFieldError('empresa')}</p>
                )}
                <datalist id="empresas">
                  {empresasUnicas.map(empresa => (
                    <option key={empresa} value={empresa} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium mb-1 block">
                Endereço *
                {isGeocoding && (
                  <Loader2 className="w-4 h-4 animate-spin inline ml-2" />
                )}
                {geocodeStatus === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-success inline ml-2" />
                )}
                {geocodeStatus === 'error' && (
                  <AlertCircle className="w-4 h-4 text-destructive inline ml-2" />
                )}
              </label>
              <Input
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                onBlur={() => touchField('endereco')}
                list="enderecos"
                placeholder="Rua, número, bairro, cidade"
                className={hasFieldError('endereco') ? 'border-destructive' : ''}
                required
              />
              {hasFieldError('endereco') && (
                <p className="text-sm text-destructive">{getFieldError('endereco')}</p>
              )}
              <datalist id="enderecos">
                {enderecosUnicos.map(endereco => (
                  <option key={endereco} value={endereco} />
                ))}
              </datalist>
              
              {geocodeError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {geocodeError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2 items-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={getCurrentLocation}
                  disabled={isGeocoding}
                  className="flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Usar minha localização
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGeocode(formData.endereco)}
                  disabled={!formData.endereco || isGeocoding}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Buscar coordenadas
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    placeholder="Latitude"
                    value={formData.lat}
                    onChange={(e) => handleInputChange('lat', e.target.value)}
                    onBlur={() => touchField('lat')}
                    className={hasFieldError('lat') ? 'border-destructive' : ''}
                  />
                  {hasFieldError('lat') && (
                    <p className="text-xs text-destructive mt-1">{getFieldError('lat')}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Longitude"
                    value={formData.lng}
                    onChange={(e) => handleInputChange('lng', e.target.value)}
                    onBlur={() => touchField('lng')}
                    className={hasFieldError('lng') ? 'border-destructive' : ''}
                  />
                  {hasFieldError('lng') && (
                    <p className="text-xs text-destructive mt-1">{getFieldError('lng')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Segmento</label>
                <Select value={formData.segmento} onValueChange={(value: any) => handleInputChange('segmento', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Empreiteiras">Empreiteiras</SelectItem>
                    <SelectItem value="Engenharias">Engenharias</SelectItem>
                    <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                    <SelectItem value="Particular">Particular</SelectItem>
                    <SelectItem value="Condomínio">Condomínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Responsável</label>
                <Select value={formData.responsavel} onValueChange={(value: any) => handleInputChange('responsavel', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eng Civil">Eng Civil</SelectItem>
                    <SelectItem value="Mestre de Obras">Mestre de Obras</SelectItem>
                    <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                    {formData.segmento === 'Condomínio' && (
                      <>
                        <SelectItem value="Síndico">Síndico</SelectItem>
                        <SelectItem value="Zelador">Zelador</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Estágio</label>
                <Select value={formData.estagio} onValueChange={(value: any) => handleInputChange('estagio', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inicial">Inicial</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                    <SelectItem value="Reforma">Reforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Classificação</label>
                <Select value={formData.classificacao} onValueChange={(value: any) => handleInputChange('classificacao', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Forte">Forte</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Fraco">Fraco</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Concorrência</label>
                <Input
                  value={formData.concorrencia}
                  onChange={(e) => handleInputChange('concorrencia', e.target.value)}
                  placeholder="Concorrentes identificados"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Contato</label>
                <Input
                  value={formData.contato}
                  onChange={(e) => handleInputChange('contato', e.target.value)}
                  onBlur={() => touchField('contato')}
                  placeholder="Telefone ou email"
                  className={hasFieldError('contato') ? 'border-destructive' : ''}
                />
                {hasFieldError('contato') && (
                  <p className="text-sm text-destructive">{getFieldError('contato')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Observações</label>
              <Textarea
                value={formData.obs}
                onChange={(e) => handleInputChange('obs', e.target.value)}
                rows={3}
                placeholder="Detalhes importantes da visita"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Fotos</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="mb-2"
              />
              {fotoPreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {fotoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => setFotoPreviews(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="btn-brand flex items-center gap-2"
                disabled={isSubmitting || hasErrors}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Atualizar Visita' : 'Salvar Visita'}
              </Button>
              <Button type="button" variant="outline" onClick={handleResetForm}>
                Limpar
              </Button>
            </div>
            
            {submittedOnce && hasErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Por favor, corrija os erros no formulário antes de enviar.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Lista de Visitas Cadastradas */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Visitas Cadastradas ({visitas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Empresa</th>
                  <th className="text-left p-3">Endereço</th>
                  <th className="text-left p-3">Segmento</th>
                  <th className="text-left p-3">Estágio</th>
                  <th className="text-left p-3">Classificação</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visitas.slice().reverse().map((visita) => (
                  <tr key={visita.id} className="border-b border-glass-border hover:bg-brand-50/30 transition-colors">
                    <td className="p-3">
                      {new Date(visita.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 font-medium">{visita.empresa}</td>
                    <td className="p-3 max-w-xs truncate" title={visita.endereco}>
                      {visita.endereco}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{visita.segmento}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={
                          visita.estagio === 'Final' ? 'default' :
                          visita.estagio === 'Intermediário' ? 'secondary' : 'outline'
                        }
                      >
                        {visita.estagio}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={
                          visita.classificacao === 'Forte' ? 'default' :
                          visita.classificacao === 'Médio' ? 'secondary' : 'outline'
                        }
                      >
                        {visita.classificacao}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(visita)}
                          className="flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(visita.id)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}