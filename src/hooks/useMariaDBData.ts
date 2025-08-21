import { useState, useEffect } from 'react';
import { AppData, Visita, FollowUp, AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  vendedor: 'Jhone',
  prazo: 3,
  compact: false,
  brandColor: '#2563eb'
};

const API_BASE_URL = 'http://localhost:8000/api';

export function useMariaDBData() {
  const [data, setData] = useState<AppData>({
    visitas: [],
    followups: [],
    cfg: DEFAULT_CONFIG
  });
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load visitas
      const visitasResponse = await fetch(`${API_BASE_URL}/visitas`);
      if (!visitasResponse.ok) throw new Error('Erro ao carregar visitas');
      const visitasData = await visitasResponse.json();

      // Load followups
      const followupsResponse = await fetch(`${API_BASE_URL}/followups`);
      if (!followupsResponse.ok) throw new Error('Erro ao carregar followups');
      const followupsData = await followupsResponse.json();

      // Convert database format to app format
      const visitas: Visita[] = (visitasData || []).map((v: any) => ({
        id: v.id,
        data: v.data,
        endereco: v.endereco,
        lat: v.lat,
        lng: v.lng,
        empresa: v.empresa,
        segmento: v.segmento_nome,
        responsavel: v.responsavel_nome,
        estagio: v.estagio_nome,
        concorrencia: v.concorrencia || '',
        classificacao: v.classificacao_nome,
        contato: v.contato || '',
        obs: v.obs || '',
        fotos: v.fotos ? JSON.parse(v.fotos) : [],
        vendedor: v.vendedor,
        created_at: v.created_at,
        updated_at: v.updated_at
      }));

      const followups: FollowUp[] = (followupsData || []).map((f: any) => ({
        id: f.id,
        visitaId: f.visita_id,
        data: f.data,
        status: f.status_nome,
        valor: f.valor,
        motivoPerda: f.motivo_perda_nome || '',
        created_at: f.created_at,
        updated_at: f.updated_at
      }));

      // Load config from localStorage (keep this local for now)
      const savedConfig = localStorage.getItem('visita360_config');
      const config = savedConfig ? { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) } : DEFAULT_CONFIG;

      setData({
        visitas,
        followups,
        cfg: config
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVisita = async (visitaData: Omit<Visita, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: visitaData.data,
          endereco: visitaData.endereco,
          lat: visitaData.lat,
          lng: visitaData.lng,
          empresa: visitaData.empresa,
          segmento: visitaData.segmento,
          responsavel: visitaData.responsavel,
          estagio: visitaData.estagio,
          concorrencia: visitaData.concorrencia || '',
          classificacao: visitaData.classificacao,
          contato: visitaData.contato || '',
          obs: visitaData.obs || '',
          fotos: visitaData.fotos || [],
          vendedor: visitaData.vendedor
        })
      });

      if (!response.ok) throw new Error('Erro ao criar visita');
      
      const result = await response.json();
      
      const visitaFormatted: Visita = {
        id: result.id,
        data: visitaData.data,
        endereco: visitaData.endereco,
        lat: visitaData.lat,
        lng: visitaData.lng,
        empresa: visitaData.empresa,
        segmento: visitaData.segmento,
        responsavel: visitaData.responsavel,
        estagio: visitaData.estagio,
        concorrencia: visitaData.concorrencia || '',
        classificacao: visitaData.classificacao,
        contato: visitaData.contato || '',
        obs: visitaData.obs || '',
        fotos: visitaData.fotos || [],
        vendedor: visitaData.vendedor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setData(prev => ({
        ...prev,
        visitas: [visitaFormatted, ...prev.visitas]
      }));

      return visitaFormatted;
    } catch (error) {
      console.error('Error adding visita:', error);
      throw error;
    }
  };

  const updateVisita = async (id: number, updates: Partial<Visita>) => {
    try {
      // Para simplificar, vamos recarregar todos os dados
      // Em uma implementação completa, você implementaria o endpoint PUT
      await loadData();
    } catch (error) {
      console.error('Error updating visita:', error);
      throw error;
    }
  };

  const deleteVisita = async (id: number) => {
    try {
      // Para simplificar, vamos recarregar todos os dados
      // Em uma implementação completa, você implementaria o endpoint DELETE
      await loadData();
    } catch (error) {
      console.error('Error deleting visita:', error);
      throw error;
    }
  };

  const addFollowUp = async (followupData: FollowUp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/followups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visita_id: followupData.visitaId,
          data: followupData.data,
          status: followupData.status,
          valor: followupData.valor,
          motivo_perda: followupData.motivoPerda || null
        })
      });

      if (!response.ok) throw new Error('Erro ao criar followup');
      
      const result = await response.json();
      
      const followupFormatted: FollowUp = {
        id: result.id,
        visitaId: followupData.visitaId,
        data: followupData.data,
        status: followupData.status,
        valor: followupData.valor,
        motivoPerda: followupData.motivoPerda || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setData(prev => ({
        ...prev,
        followups: [followupFormatted, ...prev.followups]
      }));
    } catch (error) {
      console.error('Error adding followup:', error);
      throw error;
    }
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...data.cfg, ...updates };
    localStorage.setItem('visita360_config', JSON.stringify(newConfig));
    setData(prev => ({
      ...prev,
      cfg: newConfig
    }));
  };

  const resetData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Erro ao resetar dados');
      
      // Reset local config
      localStorage.removeItem('visita360_config');
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  };

  return {
    data,
    loading,
    addVisita,
    updateVisita,
    deleteVisita,
    addFollowUp,
    updateConfig,
    resetData,
    saveData: () => {}, // Not needed for MariaDB, kept for compatibility
    loadData
  };
}
