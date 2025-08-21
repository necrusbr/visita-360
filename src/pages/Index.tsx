import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import CadastroVisita from "@/components/CadastroVisita";
import FollowUpManager from "@/components/FollowUpManager";
import Relatorios from "@/components/Relatorios";
import MapaVisitas from "@/components/MapaVisitas";
import Configuracoes from "@/components/Configuracoes";
import NotificationCenter from "@/components/NotificationCenter";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [filters, setFilters] = useState({});
  const { 
    data, 
    loading,
    addVisita, 
    updateVisita, 
    deleteVisita, 
    addFollowUp, 
    updateConfig, 
    resetData 
  } = useSupabaseData();
  
  const { toast } = useToast();

  // Configuração de notificações
  const {
    notifications,
    stats: notificationStats,
    requestPermission,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll: clearAllNotifications
  } = useNotifications(data.visitas, data.followups, {
    followUpPrazo: data.cfg.prazo || 3,
    enableBrowserNotifications: true,
    enableSound: false
  });

  // Load saved logo and theme on mount
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('visita360_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Apply saved brand color
    const savedColor = localStorage.getItem('visita360_color');
    if (savedColor) {
      document.documentElement.style.setProperty('--brand-color', savedColor);
    }

    // Apply compact mode
    if (data.cfg.compact) {
      document.body.classList.add('compact');
    }

    // Solicitar permissão para notificações
    requestPermission();
  }, [data.cfg, requestPermission]);

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'ID', 'Data', 'Endereço', 'Lat', 'Lng', 'Empresa', 
      'Segmento', 'Responsável', 'Estágio', 'Concorrência', 
      'Classificação', 'Contato', 'Observações', 'Vendedor'
    ];

    const rows = data.visitas.map(visita => [
      visita.id,
      visita.data,
      visita.endereco,
      visita.lat || '',
      visita.lng || '',
      visita.empresa,
      visita.segmento,
      visita.responsavel,
      visita.estagio,
      visita.concorrencia,
      visita.classificacao,
      visita.contato,
      visita.obs,
      visita.vendedor
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visitas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    toast({
      title: "CSV exportado!",
      description: "O arquivo foi baixado com sucesso",
    });
  };

  const exportToXLSX = async () => {
    try {
      // Check if XLSX is available globally (loaded via CDN)
      if (typeof window !== 'undefined' && (window as any).XLSX) {
        const XLSX = (window as any).XLSX;
        
        const workbook = XLSX.utils.book_new();
        
        // Visitas sheet
        const visitasData = [
          ['ID', 'Data', 'Endereço', 'Lat', 'Lng', 'Empresa', 'Segmento', 'Responsável', 'Estágio', 'Concorrência', 'Classificação', 'Contato', 'Observações', 'Vendedor'],
          ...data.visitas.map(visita => [
            visita.id, visita.data, visita.endereco, visita.lat || '', visita.lng || '', 
            visita.empresa, visita.segmento, visita.responsavel, visita.estagio, 
            visita.concorrencia, visita.classificacao, visita.contato, visita.obs, visita.vendedor
          ])
        ];
        
        const visitasSheet = XLSX.utils.aoa_to_sheet(visitasData);
        XLSX.utils.book_append_sheet(workbook, visitasSheet, 'Visitas');
        
        // Follow-ups sheet
        const followupsData = [
          ['ID Visita', 'Data', 'Status', 'Valor', 'Motivo Perda'],
          ...data.followups.map(fu => [
            fu.visitaId, fu.data, fu.status, fu.valor || '', fu.motivoPerda || ''
          ])
        ];
        
        const followupsSheet = XLSX.utils.aoa_to_sheet(followupsData);
        XLSX.utils.book_append_sheet(workbook, followupsSheet, 'Follow-ups');
        
        // Export file
        XLSX.writeFile(workbook, `visitas_completo_${new Date().toISOString().slice(0, 10)}.xlsx`);

        toast({
          title: "Excel exportado!",
          description: "O arquivo foi baixado com sucesso",
        });
      } else {
        // Load XLSX library dynamically if not available
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
        script.onload = () => {
          // Retry export after library is loaded
          setTimeout(() => exportToXLSX(), 100);
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o arquivo Excel",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    window.print();
    toast({
      title: "Função de impressão ativada",
      description: "Use Ctrl+P ou Cmd+P para imprimir/salvar como PDF",
    });
  };

  const renderCurrentView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard 
            visitas={data.visitas} 
            followups={data.followups}
            onFiltersChange={setFilters}
          />
        );
      
      case "cadastro":
        return (
          <CadastroVisita 
            visitas={data.visitas}
            onAddVisita={addVisita}
            onUpdateVisita={updateVisita}
            onDeleteVisita={deleteVisita}
            vendedor={data.cfg.vendedor}
          />
        );
      
      case "followup":
        return (
          <FollowUpManager 
            visitas={data.visitas}
            followups={data.followups}
            onAddFollowUp={addFollowUp}
          />
        );
      
      case "relatorios":
        return (
          <Relatorios 
            visitas={data.visitas}
            followups={data.followups}
            onExportCSV={exportToCSV}
            onExportXLSX={exportToXLSX}
          />
        );
      
      case "mapa":
        return <MapaVisitas visitas={data.visitas} />;
      
      case "config":
        return (
          <Configuracoes 
            config={data.cfg}
            onUpdateConfig={updateConfig}
            onResetData={resetData}
          />
        );
      
      default:
        return (
          <Dashboard 
            visitas={data.visitas} 
            followups={data.followups}
            onFiltersChange={setFilters}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout
        activeView={activeView}
        onViewChange={setActiveView}
        onExportCSV={exportToCSV}
        onExportXLSX={exportToXLSX}
        onPrint={exportToPDF}
        notificationCenter={
          <NotificationCenter
            notifications={notifications}
            stats={notificationStats}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDismiss={dismissNotification}
            onClearAll={clearAllNotifications}
            onNavigateToFollowUp={() => setActiveView('followup')}
            onNavigateToDashboard={() => setActiveView('dashboard')}
          />
        }
      >
        {renderCurrentView()}
      </Layout>
    </>
  );
};

export default Index;
