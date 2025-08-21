import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Save, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Visita, FollowUp } from "../types";
import { useToast } from "@/hooks/use-toast";

interface FollowUpManagerProps {
  visitas: Visita[];
  followups: FollowUp[];
  onAddFollowUp: (followup: FollowUp) => void;
}

export default function FollowUpManager({ visitas, followups, onAddFollowUp }: FollowUpManagerProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    visitaId: 0,
    data: new Date().toISOString().slice(0, 10),
    status: 'Retornou' as const,
    valor: '',
    motivoPerda: ''
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.visitaId) {
      toast({
        title: "Erro",
        description: "Selecione uma visita para registrar o follow-up",
        variant: "destructive",
      });
      return;
    }

    const followup: FollowUp = {
      visitaId: formData.visitaId,
      data: formData.data,
      status: formData.status,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      motivoPerda: formData.motivoPerda === "none" ? "" : formData.motivoPerda as any
    };

    onAddFollowUp(followup);
    
    toast({
      title: "Follow-up registrado!",
      description: "O acompanhamento foi salvo com sucesso",
    });

    setFormData({
      visitaId: 0,
      data: new Date().toISOString().slice(0, 10),
      status: 'Retornou',
      valor: '',
      motivoPerda: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Fechou pedido':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'Sem retorno':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'Orçamento':
      case 'Consulta preço':
        return <DollarSign className="w-4 h-4 text-brand-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Fechou pedido':
        return 'default';
      case 'Sem retorno':
        return 'destructive';
      case 'Orçamento':
      case 'Consulta preço':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const visitasComInfo = visitas.map(visita => {
    const fuCount = followups.filter(fu => fu.visitaId === visita.id).length;
    const ultimoFU = followups
      .filter(fu => fu.visitaId === visita.id)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
    
    return {
      ...visita,
      followupCount: fuCount,
      ultimoStatus: ultimoFU?.status,
      ultimaData: ultimoFU?.data
    };
  });

  return (
    <div className="space-y-6">
      {/* Formulário de Follow-up */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Registrar Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Visita</label>
                <Select 
                  value={formData.visitaId.toString()} 
                  onValueChange={(value) => handleInputChange('visitaId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma visita" />
                  </SelectTrigger>
                  <SelectContent>
                    {visitasComInfo.map((visita) => (
                      <SelectItem key={visita.id} value={visita.id.toString()}>
                        #{visita.id} - {visita.empresa} ({new Date(visita.data).toLocaleDateString('pt-BR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retornou">Retornou</SelectItem>
                    <SelectItem value="Fechou pedido">Fechou pedido</SelectItem>
                    <SelectItem value="Orçamento">Orçamento</SelectItem>
                    <SelectItem value="Consulta preço">Consulta preço</SelectItem>
                    <SelectItem value="Sem retorno">Sem retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Motivo da Perda</label>
                <Select 
                  value={formData.motivoPerda} 
                  onValueChange={(value) => handleInputChange('motivoPerda', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar se aplicável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="Preço menor">Preço menor</SelectItem>
                    <SelectItem value="Sem retorno">Sem retorno</SelectItem>
                    <SelectItem value="Produto em falta">Produto em falta</SelectItem>
                    <SelectItem value="Entrega">Entrega</SelectItem>
                    <SelectItem value="Edu não cobriu">Edu não cobriu</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="btn-brand flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar Follow-up
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormData({
                  visitaId: 0,
                  data: new Date().toISOString().slice(0, 10),
                  status: 'Retornou',
                  valor: '',
                  motivoPerda: ''
                })}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Visão Geral das Visitas */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Status das Visitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {visitasComInfo.slice(0, 10).map((visita) => (
              <div key={visita.id} className="flex items-center justify-between p-4 rounded-lg border border-glass-border hover:bg-brand-50/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">#{visita.id} - {visita.empresa}</span>
                    <Badge variant="outline" className="text-xs">
                      {visita.followupCount} follow-ups
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {visita.endereco} • {new Date(visita.data).toLocaleDateString('pt-BR')}
                  </div>
                  {visita.ultimaData && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Último contato: {new Date(visita.ultimaData).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {visita.ultimoStatus && (
                    <Badge variant={getStatusVariant(visita.ultimoStatus)} className="flex items-center gap-1">
                      {getStatusIcon(visita.ultimoStatus)}
                      {visita.ultimoStatus}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('visitaId', visita.id)}
                  >
                    Novo Follow-up
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Follow-ups */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Histórico de Follow-ups ({followups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Visita</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Valor</th>
                  <th className="text-left p-3">Motivo Perda</th>
                </tr>
              </thead>
              <tbody>
                {followups.slice().reverse().map((followup, index) => {
                  const visita = visitas.find(v => v.id === followup.visitaId);
                  return (
                    <tr key={index} className="border-b border-glass-border hover:bg-brand-50/30 transition-colors">
                      <td className="p-3">
                        {new Date(followup.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        {visita ? (
                          <div>
                            <div className="font-medium">#{followup.visitaId} - {visita.empresa}</div>
                            <div className="text-xs text-muted-foreground">{visita.endereco}</div>
                          </div>
                        ) : (
                          `#${followup.visitaId}`
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={getStatusVariant(followup.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(followup.status)}
                          {followup.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {followup.valor ? (
                          <span className="font-medium text-success">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(followup.valor)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3">
                        {followup.motivoPerda ? (
                          <Badge variant="outline" className="text-xs">
                            {followup.motivoPerda}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}