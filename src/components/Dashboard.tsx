import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  Filter,
  RotateCcw
} from "lucide-react";
import { Visita, FollowUp } from "../types";

interface DashboardProps {
  visitas: Visita[];
  followups: FollowUp[];
  onFiltersChange: (filters: any) => void;
}

// Chart.js será carregado via CDN
declare global {
  interface Window {
    Chart: any;
  }
}

export default function Dashboard({ visitas, followups, onFiltersChange }: DashboardProps) {
  const [filters, setFilters] = useState({
    dataIni: "",
    dataFim: "", 
    segmento: "all",
    estagio: "all"
  });

  // Chart refs
  const chartPerdasRef = useRef<HTMLCanvasElement>(null);
  const chartFunilRef = useRef<HTMLCanvasElement>(null);
  const chartSegmentoRef = useRef<HTMLCanvasElement>(null);
  const chartEstagioRef = useRef<HTMLCanvasElement>(null);
  const chartTopClientesRef = useRef<HTMLCanvasElement>(null);
  
  const chartsRef = useRef<{[key: string]: any}>({});

  // Filter data based on current filters
  const filteredVisitas = visitas.filter(visita => {
    if (filters.dataIni && visita.data < filters.dataIni) return false;
    if (filters.dataFim && visita.data > filters.dataFim) return false;
    if (filters.segmento && filters.segmento !== "all" && visita.segmento !== filters.segmento) return false;
    if (filters.estagio && filters.estagio !== "all" && visita.estagio !== filters.estagio) return false;
    return true;
  });

  const filteredFollowups = followups.filter(fu => 
    filteredVisitas.some(v => v.id === fu.visitaId)
  );

  // Calculate KPIs
  const totalVisitas = filteredVisitas.length;
  const fechados = filteredFollowups.filter(fu => fu.status === "Fechou pedido");
  const totalVendido = fechados.reduce((sum, fu) => sum + (fu.valor || 0), 0);
  const taxaConversao = totalVisitas > 0 ? Math.round((new Set(fechados.map(f => f.visitaId)).size / totalVisitas) * 100) : 0;
  
  const prazoFollowup = 3; // dias
  const pendentes = filteredVisitas.filter(visita => {
    const ultimoFU = filteredFollowups
      .filter(fu => fu.visitaId === visita.id)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
    
    const baseDate = ultimoFU ? new Date(ultimoFU.data) : new Date(visita.data);
    const diasPassados = (Date.now() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return diasPassados > prazoFollowup && (!ultimoFU || ultimoFU.status !== "Fechou pedido");
  }).length;

  const handleFilterSubmit = () => {
    onFiltersChange(filters);
    renderCharts();
  };

  const clearFilters = () => {
    const emptyFilters = { dataIni: "", dataFim: "", segmento: "all", estagio: "all" };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    renderCharts();
  };

  const renderCharts = () => {
    if (!window.Chart) return;

    // Destroy existing charts
    Object.values(chartsRef.current).forEach((chart: any) => { if (chart) chart.destroy(); });
    chartsRef.current = {};

    const brandColors = {
      primary: '#2563eb',
      secondary: '#60a5fa', 
      success: '#16a34a',
      warning: '#f59e0b',
      danger: '#dc2626'
    };

    // Using chartsRef to store instances per key

    // Chart: Motivo das Perdas
    if (chartPerdasRef.current) {
      const motivos = ['Preço menor', 'Sem retorno', 'Produto em falta', 'Entrega', 'Edu não cobriu', 'Outros'];
      const perdas = motivos.map(motivo => 
        filteredFollowups.filter(fu => fu.motivoPerda === motivo).length
      );

      window.Chart.getChart(chartPerdasRef.current)?.destroy();
      chartsRef.current.perdas = new window.Chart(chartPerdasRef.current, {
        type: 'bar',
        data: {
          labels: motivos,
          datasets: [{
            label: 'Perdas',
            data: perdas,
            backgroundColor: brandColors.primary,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true },
            y: { ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // Chart: Funil de Conversão
    if (chartFunilRef.current) {
      const visitados = filteredVisitas.length;
      const contatados = new Set(filteredFollowups.map(fu => fu.visitaId)).size;
      const orcamentos = new Set(
        filteredFollowups
          .filter(fu => ['Orçamento', 'Consulta preço'].includes(fu.status))
          .map(fu => fu.visitaId)
      ).size;
      const fechados_count = new Set(fechados.map(fu => fu.visitaId)).size;

      window.Chart.getChart(chartFunilRef.current)?.destroy();
      chartsRef.current.funil = new window.Chart(chartFunilRef.current, {
        type: 'bar',
        data: {
          labels: ['Visitados', 'Contatados', 'Orçamentos', 'Fechados'],
          datasets: [{
            data: [visitados, contatados, orcamentos, fechados_count],
            backgroundColor: [
              brandColors.secondary,
              brandColors.primary,
              brandColors.warning,
              brandColors.success
            ],
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Chart: Por Segmento
    if (chartSegmentoRef.current) {
      const segmentos = [...new Set(filteredVisitas.map(v => v.segmento))];
      const segmentoData = segmentos.map(seg => 
        filteredVisitas.filter(v => v.segmento === seg).length
      );

      window.Chart.getChart(chartSegmentoRef.current)?.destroy();
      chartsRef.current.segmento = new window.Chart(chartSegmentoRef.current, {
        type: 'doughnut',
        data: {
          labels: segmentos,
          datasets: [{
            data: segmentoData,
            backgroundColor: [
              brandColors.primary,
              brandColors.secondary,
              brandColors.success,
              brandColors.warning
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // Chart: Por Estágio
    if (chartEstagioRef.current) {
      const estagios = [...new Set(filteredVisitas.map(v => v.estagio))];
      const estagioData = estagios.map(est => 
        filteredVisitas.filter(v => v.estagio === est).length
      );

      window.Chart.getChart(chartEstagioRef.current)?.destroy();
      chartsRef.current.estagio = new window.Chart(chartEstagioRef.current, {
        type: 'pie',
        data: {
          labels: estagios,
          datasets: [{
            data: estagioData,
            backgroundColor: [brandColors.success, brandColors.warning, brandColors.danger]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // Chart: Top 10 Clientes
    if (chartTopClientesRef.current) {
      const valorPorCliente: {[key: string]: number} = {};
      fechados.forEach(fu => {
        const visita = visitas.find(v => v.id === fu.visitaId);
        const empresa = visita?.empresa || `#${fu.visitaId}`;
        valorPorCliente[empresa] = (valorPorCliente[empresa] || 0) + (fu.valor || 0);
      });

      const top10 = Object.entries(valorPorCliente)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      window.Chart.getChart(chartTopClientesRef.current)?.destroy();
      chartsRef.current.topClientes = new window.Chart(chartTopClientesRef.current, {
        type: 'bar',
        data: {
          labels: top10.map(([empresa]) => empresa),
          datasets: [{
            label: 'Valor (R$)',
            data: top10.map(([, valor]) => valor),
            backgroundColor: brandColors.success,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: {
                callback: (value: any) => 
                  new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(value)
              }
            }
          }
        }
      });
    }

    
  };

  useEffect(() => {
    // Load Chart.js if not available
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => {
        setTimeout(renderCharts, 100);
      };
      document.head.appendChild(script);
    } else {
      renderCharts();
    }

    return () => {
      Object.values(chartsRef.current).forEach((chart: any) => {
        if (chart) chart.destroy();
      });
      chartsRef.current = {};
    };
  }, [filteredVisitas, filteredFollowups]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">De</label>
              <Input
                type="date"
                value={filters.dataIni}
                onChange={(e) => setFilters(prev => ({...prev, dataIni: e.target.value}))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Até</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters(prev => ({...prev, dataFim: e.target.value}))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Segmento</label>
              <Select value={filters.segmento} onValueChange={(value) => setFilters(prev => ({...prev, segmento: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Empreiteiras">Empreiteiras</SelectItem>
                  <SelectItem value="Engenharias">Engenharias</SelectItem>
                  <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                  <SelectItem value="Particular">Particular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Estágio</label>
              <Select value={filters.estagio} onValueChange={(value) => setFilters(prev => ({...prev, estagio: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFilterSubmit} className="btn-brand mt-6">
              Aplicar
            </Button>
            <Button variant="outline" onClick={clearFilters} className="btn-glass mt-6">
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitas</p>
                <p className="text-3xl font-bold text-brand-600">{totalVisitas}</p>
              </div>
              <Users className="w-8 h-8 text-brand-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-success">{taxaConversao}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total Vendido</p>
                <p className="text-3xl font-bold text-brand-600">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(totalVendido)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-brand-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes Follow-up</p>
                <p className="text-3xl font-bold text-warning">{pendentes}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg">Motivo das Perdas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={chartPerdasRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={chartFunilRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg">Por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <canvas ref={chartSegmentoRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg">Por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <canvas ref={chartEstagioRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg">Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendentes > 0 && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  {pendentes} visitas precisam de follow-up
                </Badge>
              )}
              <Badge variant="outline" className="w-full justify-center py-2">
                {totalVisitas} visitas no período
              </Badge>
              <Badge variant="outline" className="w-full justify-center py-2">
                {taxaConversao}% de conversão
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes Chart */}
      <Card className="chart-container">
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Clientes por Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <canvas ref={chartTopClientesRef}></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}