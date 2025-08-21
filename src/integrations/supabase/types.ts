export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      followups: {
        Row: {
          created_at: string
          data: string
          id: number
          motivo_perda: Database["public"]["Enums"]["motivo_perda"] | null
          status: Database["public"]["Enums"]["followup_status"]
          updated_at: string
          valor: number | null
          visita_id: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: number
          motivo_perda?: Database["public"]["Enums"]["motivo_perda"] | null
          status: Database["public"]["Enums"]["followup_status"]
          updated_at?: string
          valor?: number | null
          visita_id: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: number
          motivo_perda?: Database["public"]["Enums"]["motivo_perda"] | null
          status?: Database["public"]["Enums"]["followup_status"]
          updated_at?: string
          valor?: number | null
          visita_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "followups_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      visita_360: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      visitas: {
        Row: {
          classificacao: Database["public"]["Enums"]["classificacao"]
          concorrencia: string
          contato: string
          created_at: string
          data: string
          empresa: string
          endereco: string
          estagio: Database["public"]["Enums"]["estagio"]
          fotos: string[]
          id: number
          lat: number | null
          lng: number | null
          obs: string
          responsavel: Database["public"]["Enums"]["responsavel"]
          segmento: Database["public"]["Enums"]["segmento"]
          updated_at: string
          vendedor: string
        }
        Insert: {
          classificacao: Database["public"]["Enums"]["classificacao"]
          concorrencia?: string
          contato?: string
          created_at?: string
          data: string
          empresa: string
          endereco: string
          estagio: Database["public"]["Enums"]["estagio"]
          fotos?: string[]
          id?: number
          lat?: number | null
          lng?: number | null
          obs?: string
          responsavel: Database["public"]["Enums"]["responsavel"]
          segmento: Database["public"]["Enums"]["segmento"]
          updated_at?: string
          vendedor: string
        }
        Update: {
          classificacao?: Database["public"]["Enums"]["classificacao"]
          concorrencia?: string
          contato?: string
          created_at?: string
          data?: string
          empresa?: string
          endereco?: string
          estagio?: Database["public"]["Enums"]["estagio"]
          fotos?: string[]
          id?: number
          lat?: number | null
          lng?: number | null
          obs?: string
          responsavel?: Database["public"]["Enums"]["responsavel"]
          segmento?: Database["public"]["Enums"]["segmento"]
          updated_at?: string
          vendedor?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      classificacao: "Forte" | "Médio" | "Fraco"
      estagio: "Inicial" | "Intermediário" | "Final" | "Reforma"
      followup_status:
        | "Retornou"
        | "Fechou pedido"
        | "Orçamento"
        | "Consulta preço"
        | "Sem retorno"
      motivo_perda:
        | "Preço menor"
        | "Sem retorno"
        | "Produto em falta"
        | "Entrega"
        | "Edu não cobriu"
        | "Outros"
      responsavel:
        | "Eng Civil"
        | "Mestre de Obras"
        | "Arquiteto"
        | "Outros"
        | "Síndico"
        | "Zelador"
      segmento:
        | "Empreiteiras"
        | "Engenharias"
        | "Arquitetura"
        | "Particular"
        | "Condomínio"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      classificacao: ["Forte", "Médio", "Fraco"],
      estagio: ["Inicial", "Intermediário", "Final", "Reforma"],
      followup_status: [
        "Retornou",
        "Fechou pedido",
        "Orçamento",
        "Consulta preço",
        "Sem retorno",
      ],
      motivo_perda: [
        "Preço menor",
        "Sem retorno",
        "Produto em falta",
        "Entrega",
        "Edu não cobriu",
        "Outros",
      ],
      responsavel: [
        "Eng Civil",
        "Mestre de Obras",
        "Arquiteto",
        "Outros",
        "Síndico",
        "Zelador",
      ],
      segmento: [
        "Empreiteiras",
        "Engenharias",
        "Arquitetura",
        "Particular",
        "Condomínio",
      ],
    },
  },
} as const
