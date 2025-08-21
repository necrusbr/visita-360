import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppData, Visita, FollowUp, AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  vendedor: 'Jhone',
  prazo: 3,
  compact: false,
  brandColor: '#2563eb'
};

export function useSupabaseData() {
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
      const { data: visitasData, error: visitasError } = await supabase
        .from('visitas')
        .select('*')
        .order('created_at', { ascending: false });

      if (visitasError) throw visitasError;

      // Load followups
      const { data: followupsData, error: followupsError } = await supabase
        .from('followups')
        .select('*')
        .order('created_at', { ascending: false });

      if (followupsError) throw followupsError;

      // Convert database format to app format
      const visitas: Visita[] = (visitasData || []).map(v => ({
        id: v.id,
        data: v.data,
        endereco: v.endereco,
        lat: v.lat,
        lng: v.lng,
        empresa: v.empresa,
        segmento: v.segmento,
        responsavel: v.responsavel,
        estagio: v.estagio,
        concorrencia: v.concorrencia || '',
        classificacao: v.classificacao,
        contato: v.contato || '',
        obs: v.obs || '',
        fotos: v.fotos || [],
        vendedor: v.vendedor,
        created_at: v.created_at,
        updated_at: v.updated_at
      }));

      const followups: FollowUp[] = (followupsData || []).map(f => ({
        id: f.id,
        visitaId: f.visita_id,
        data: f.data,
        status: f.status,
        valor: f.valor,
        motivoPerda: f.motivo_perda,
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
      const { data: newVisita, error } = await supabase
        .from('visitas')
        .insert([{
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
        }])
        .select()
        .single();

      if (error) throw error;

      const visitaFormatted: Visita = {
        id: newVisita.id,
        data: newVisita.data,
        endereco: newVisita.endereco,
        lat: newVisita.lat,
        lng: newVisita.lng,
        empresa: newVisita.empresa,
        segmento: newVisita.segmento,
        responsavel: newVisita.responsavel,
        estagio: newVisita.estagio,
        concorrencia: newVisita.concorrencia || '',
        classificacao: newVisita.classificacao,
        contato: newVisita.contato || '',
        obs: newVisita.obs || '',
        fotos: newVisita.fotos || [],
        vendedor: newVisita.vendedor,
        created_at: newVisita.created_at,
        updated_at: newVisita.updated_at
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
      const { error } = await supabase
        .from('visitas')
        .update({
          data: updates.data,
          endereco: updates.endereco,
          lat: updates.lat,
          lng: updates.lng,
          empresa: updates.empresa,
          segmento: updates.segmento,
          responsavel: updates.responsavel,
          estagio: updates.estagio,
          concorrencia: updates.concorrencia,
          classificacao: updates.classificacao,
          contato: updates.contato,
          obs: updates.obs,
          fotos: updates.fotos,
          vendedor: updates.vendedor
        })
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        visitas: prev.visitas.map(v => v.id === id ? { ...v, ...updates } : v)
      }));
    } catch (error) {
      console.error('Error updating visita:', error);
      throw error;
    }
  };

  const deleteVisita = async (id: number) => {
    try {
      const { error } = await supabase
        .from('visitas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        visitas: prev.visitas.filter(v => v.id !== id),
        followups: prev.followups.filter(f => f.visitaId !== id)
      }));
    } catch (error) {
      console.error('Error deleting visita:', error);
      throw error;
    }
  };

  const addFollowUp = async (followupData: FollowUp) => {
    try {
      const { data: newFollowup, error } = await supabase
        .from('followups')
        .insert({
          visita_id: followupData.visitaId,
          data: followupData.data,
          status: followupData.status,
          valor: followupData.valor,
          motivo_perda: (followupData.motivoPerda === '' || !followupData.motivoPerda) ? null : followupData.motivoPerda
        })
        .select()
        .single();

      if (error) throw error;

      const followupFormatted: FollowUp = {
        id: newFollowup.id,
        visitaId: newFollowup.visita_id,
        data: newFollowup.data,
        status: newFollowup.status,
        valor: newFollowup.valor,
        motivoPerda: newFollowup.motivo_perda,
        created_at: newFollowup.created_at,
        updated_at: newFollowup.updated_at
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
      // Clear all data from Supabase
      await supabase.from('followups').delete().neq('id', 0);
      await supabase.from('visitas').delete().neq('id', 0);
      
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
    saveData: () => {}, // Not needed for Supabase, kept for compatibility
    loadData
  };
}
