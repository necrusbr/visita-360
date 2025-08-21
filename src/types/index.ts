export interface Visita {
  id: number;
  data: string;
  endereco: string;
  lat?: number;
  lng?: number;
  empresa: string;
  segmento: 'Empreiteiras' | 'Engenharias' | 'Arquitetura' | 'Particular' | 'Condomínio';
  responsavel: 'Eng Civil' | 'Mestre de Obras' | 'Arquiteto' | 'Outros' | 'Síndico' | 'Zelador';
  estagio: 'Inicial' | 'Intermediário' | 'Final' | 'Reforma';
  concorrencia: string;
  classificacao: 'Forte' | 'Médio' | 'Fraco';
  contato: string;
  obs: string;
  fotos: string[];
  vendedor: string;
  created_at?: string;
  updated_at?: string;
}

export interface FollowUp {
  id?: number;
  visitaId: number;
  data: string;
  status: 'Retornou' | 'Fechou pedido' | 'Orçamento' | 'Consulta preço' | 'Sem retorno';
  valor?: number;
  motivoPerda?: 'Preço menor' | 'Sem retorno' | 'Produto em falta' | 'Entrega' | 'Edu não cobriu' | 'Outros' | '';
  created_at?: string;
  updated_at?: string;
}

export interface AppConfig {
  vendedor: string;
  prazo: number;
  compact: boolean;
  brandColor: string;
  logo?: string;
}

export interface AppData {
  visitas: Visita[];
  followups: FollowUp[];
  cfg: AppConfig;
}