import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  BarChart3,
  Users,
  TrendingUp
} from "lucide-react";
import { Visita, FollowUp } from "../types";

interface RelatoriosProps {
  visitas: Visita[];
  followups: FollowUp[];
  onExportCSV: () => void;
  onExportXLSX: () => void;
}

export default function Relatorios({ visitas, followups, onExportCSV, onExportXLSX }: RelatoriosProps) {
  
  // Análises por vendedor
  const vendedorStats = visitas.reduce((acc, visita) => {
    const vendedor = visita.vendedor || 'Sem vendedor';
    if (!acc[vendedor]) {
      acc[vendedor] = {
        visitas: 0,
        fechados: 0,
        valorTotal: 0
      };
    }
    acc[vendedor].visitas += 1;
    
    const visitaFollowups = followups.filter(fu => fu.visitaId === visita.id);
    const fechou = visitaFollowups.some(fu => fu.status === 'Fechou pedido');
    
    if (fechou) {
      acc[vendedor].fechados += 1;
      const valor = visitaFollowups
        .filter(fu => fu.status === 'Fechou pedido')
        .reduce((sum, fu) => sum + (fu.valor || 0), 0);
      acc[vendedor].valorTotal += valor;
    }
    
    return acc;
  }, {} as Record<string, { visitas: number; fechados: number; valorTotal: number }>);

  // Análises por segmento
  const segmentoStats = visitas.reduce((acc, visita) => {
    if (!acc[visita.segmento]) {
      acc[visita.segmento] = {
        visitas: 0,
        fechados: 0,
        valorTotal: 0
      };
    }
    acc[visita.segmento].visitas += 1;
    
    const visitaFollowups = followups.filter(fu => fu.visitaId === visita.id);
    const fechou = visitaFollowups.some(fu => fu.status === 'Fechou pedido');
    
    if (fechou) {
      acc[visita.segmento].fechados += 1;
      const valor = visitaFollowups
        .filter(fu => fu.status === 'Fechou pedido')
        .reduce((sum, fu) => sum + (fu.valor || 0), 0);
      acc[visita.segmento].valorTotal += valor;
    }
    
    return acc;
  }, {} as Record<string, { visitas: number; fechados: number; valorTotal: number }>);

  // Análises por mês
  const visitasPorMes = visitas.reduce((acc, visita) => {
    const mes = visita.data.slice(0, 7); // YYYY-MM
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vendasPorMes = followups
    .filter(fu => fu.status === 'Fechou pedido' && fu.valor)
    .reduce((acc, fu) => {
      const mes = fu.data.slice(0, 7);
      acc[mes] = (acc[mes] || 0) + (fu.valor || 0);
      return acc;
    }, {} as Record<string, number>);

  const exportRelatorioVendedor = () => {
    const data = Object.entries(vendedorStats).map(([vendedor, stats]) => ({
      vendedor,
      visitas: stats.visitas,
      fechados: stats.fechados,
      conversao: stats.visitas > 0 ? Math.round((stats.fechados / stats.visitas) * 100) : 0,
      valorTotal: stats.valorTotal
    }));

    const csvContent = [
      ['Vendedor', 'Visitas', 'Fechados', 'Conversão (%)', 'Valor Total (R$)'],
      ...data.map(row => [
        row.vendedor,
        row.visitas,
        row.fechados,
        row.conversao,
        row.valorTotal
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_vendedores.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatórios e Análises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onExportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV (Visitas)
            </Button>
            <Button onClick={onExportXLSX} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Excel (Visitas)
            </Button>
            <Button onClick={exportRelatorioVendedor} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Relatório por Vendedor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatório por Vendedor */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Performance por Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left p-3">Vendedor</th>
                  <th className="text-left p-3">Visitas</th>
                  <th className="text-left p-3">Fechados</th>
                  <th className="text-left p-3">Taxa Conversão</th>
                  <th className="text-left p-3">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(vendedorStats)
                  .sort(([,a], [,b]) => b.valorTotal - a.valorTotal)
                  .map(([vendedor, stats]) => {
                    const conversao = stats.visitas > 0 ? Math.round((stats.fechados / stats.visitas) * 100) : 0;
                    return (
                      <tr key={vendedor} className="border-b border-glass-border hover:bg-brand-50/30 transition-colors">
                        <td className="p-3 font-medium">{vendedor}</td>
                        <td className="p-3">{stats.visitas}</td>
                        <td className="p-3">{stats.fechados}</td>
                        <td className="p-3">
                          <Badge variant={conversao >= 30 ? 'default' : conversao >= 15 ? 'secondary' : 'outline'}>
                            {conversao}%
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-success">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(stats.valorTotal)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Relatório por Segmento */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance por Segmento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left p-3">Segmento</th>
                  <th className="text-left p-3">Visitas</th>
                  <th className="text-left p-3">Fechados</th>
                  <th className="text-left p-3">Taxa Conversão</th>
                  <th className="text-left p-3">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(segmentoStats)
                  .sort(([,a], [,b]) => b.valorTotal - a.valorTotal)
                  .map(([segmento, stats]) => {
                    const conversao = stats.visitas > 0 ? Math.round((stats.fechados / stats.visitas) * 100) : 0;
                    return (
                      <tr key={segmento} className="border-b border-glass-border hover:bg-brand-50/30 transition-colors">
                        <td className="p-3 font-medium">{segmento}</td>
                        <td className="p-3">{stats.visitas}</td>
                        <td className="p-3">{stats.fechados}</td>
                        <td className="p-3">
                          <Badge variant={conversao >= 30 ? 'default' : conversao >= 15 ? 'secondary' : 'outline'}>
                            {conversao}%
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-success">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(stats.valorTotal)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Evolução Mensal */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Visitas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(visitasPorMes)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([mes, quantidade]) => (
                  <div key={mes} className="flex items-center justify-between p-3 rounded-lg bg-brand-50/30">
                    <span className="font-medium">
                      {new Date(mes + '-01').toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <Badge variant="outline">{quantidade} visitas</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Vendas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(vendasPorMes)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([mes, valor]) => (
                  <div key={mes} className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <span className="font-medium">
                      {new Date(mes + '-01').toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <span className="font-bold text-success">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(valor)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Estatístico */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-brand-50">
              <div className="text-2xl font-bold text-brand-600">{visitas.length}</div>
              <div className="text-sm text-muted-foreground">Total de Visitas</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-success/10">
              <div className="text-2xl font-bold text-success">
                {followups.filter(fu => fu.status === 'Fechou pedido').length}
              </div>
              <div className="text-sm text-muted-foreground">Vendas Fechadas</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-warning/10">
              <div className="text-2xl font-bold text-warning">
                {Object.keys(vendedorStats).length}
              </div>
              <div className="text-sm text-muted-foreground">Vendedores Ativos</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/20">
              <div className="text-2xl font-bold text-muted-foreground">
                {Object.keys(segmentoStats).length}
              </div>
              <div className="text-sm text-muted-foreground">Segmentos Atendidos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}