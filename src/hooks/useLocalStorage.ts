import { useState, useEffect } from 'react';
import { AppData, Visita, FollowUp, AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  vendedor: 'Jhone',
  prazo: 3,
  compact: false,
  brandColor: '#2563eb'
};

const SAMPLE_DATA: AppData = {
  visitas: [
    {
      id: 1,
      data: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endereco: 'Rua Pedrália, 417 - São Paulo',
      lat: -23.592,
      lng: -46.629,
      empresa: 'Construtora Alpha',
      segmento: 'Empreiteiras',
      responsavel: 'Eng Civil',
      estagio: 'Inicial',
      concorrencia: 'Telha Norte',
      classificacao: 'Forte',
      contato: '(11)90000-0001',
      obs: 'Obra vertical',
      fotos: [],
      vendedor: 'Jhone'
    },
    {
      id: 2,
      data: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endereco: 'Av. Atlântica, 1200 - Rio de Janeiro',
      lat: -22.971,
      lng: -43.186,
      empresa: 'Engenharia Beta',
      segmento: 'Engenharias',
      responsavel: 'Arquiteto',
      estagio: 'Intermediário',
      concorrencia: 'Nicom',
      classificacao: 'Médio',
      contato: '(21)90000-0002',
      obs: 'Prazo apertado',
      fotos: [],
      vendedor: 'Jhone'
    },
    {
      id: 3,
      data: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endereco: 'Rua das Flores, 90 - Campinas',
      lat: -22.905,
      lng: -47.06,
      empresa: 'Particular João',
      segmento: 'Particular',
      responsavel: 'Outros',
      estagio: 'Final',
      concorrencia: '',
      classificacao: 'Fraco',
      contato: '(19)90000-0003',
      obs: 'Casa térrea',
      fotos: [],
      vendedor: 'Aline'
    }
  ],
  followups: [
    {
      visitaId: 1,
      data: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Orçamento',
      valor: 25000,
      motivoPerda: ''
    },
    {
      visitaId: 1,
      data: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Fechou pedido',
      valor: 18000,
      motivoPerda: ''
    },
    {
      visitaId: 2,
      data: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Consulta preço',
      valor: 12000,
      motivoPerda: ''
    },
    {
      visitaId: 3,
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Sem retorno',
      valor: 5000,
      motivoPerda: 'Sem retorno'
    }
  ],
  cfg: DEFAULT_CONFIG
};

export function useLocalStorage() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem('visita360');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          visitas: parsed.visitas || [],
          followups: parsed.followups || [],
          cfg: { ...DEFAULT_CONFIG, ...parsed.cfg }
        };
      }
      return SAMPLE_DATA;
    } catch {
      return SAMPLE_DATA;
    }
  });

  const saveData = (newData: AppData) => {
    setData(newData);
    localStorage.setItem('visita360', JSON.stringify(newData));
  };

  const addVisita = (visita: Omit<Visita, 'id'>) => {
    const newVisita: Visita = {
      ...visita,
      id: Math.max(0, ...data.visitas.map(v => v.id)) + 1
    };
    
    const newData = {
      ...data,
      visitas: [...data.visitas, newVisita]
    };
    saveData(newData);
    return newVisita;
  };

  const updateVisita = (id: number, updates: Partial<Visita>) => {
    const newData = {
      ...data,
      visitas: data.visitas.map(v => v.id === id ? { ...v, ...updates } : v)
    };
    saveData(newData);
  };

  const deleteVisita = (id: number) => {
    const newData = {
      ...data,
      visitas: data.visitas.filter(v => v.id !== id),
      followups: data.followups.filter(fu => fu.visitaId !== id)
    };
    saveData(newData);
  };

  const addFollowUp = (followup: FollowUp) => {
    const newData = {
      ...data,
      followups: [...data.followups, followup]
    };
    saveData(newData);
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newData = {
      ...data,
      cfg: { ...data.cfg, ...updates }
    };
    saveData(newData);
  };

  const resetData = () => {
    localStorage.removeItem('visita360');
    setData(SAMPLE_DATA);
  };

  // Initialize with sample data if empty
  useEffect(() => {
    if (data.visitas.length === 0) {
      saveData(SAMPLE_DATA);
    }
  }, []);

  return {
    data,
    addVisita,
    updateVisita,
    deleteVisita,
    addFollowUp,
    updateConfig,
    resetData,
    saveData
  };
}