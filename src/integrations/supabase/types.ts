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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alimentos: {
        Row: {
          carbo: number
          created_at: string
          fibra: number
          fonte: string
          gordura: number
          id: string
          kcal: number
          nome: string
          proteina: number
        }
        Insert: {
          carbo?: number
          created_at?: string
          fibra?: number
          fonte?: string
          gordura?: number
          id?: string
          kcal?: number
          nome: string
          proteina?: number
        }
        Update: {
          carbo?: number
          created_at?: string
          fibra?: number
          fonte?: string
          gordura?: number
          id?: string
          kcal?: number
          nome?: string
          proteina?: number
        }
        Relationships: []
      }
      anamneses: {
        Row: {
          atualizada_em: string
          created_at: string
          id: string
          paciente_id: string
          respostas: Json
        }
        Insert: {
          atualizada_em?: string
          created_at?: string
          id?: string
          paciente_id: string
          respostas?: Json
        }
        Update: {
          atualizada_em?: string
          created_at?: string
          id?: string
          paciente_id?: string
          respostas?: Json
        }
        Relationships: []
      }
      consultas: {
        Row: {
          anotacoes: string | null
          created_at: string
          fim: string | null
          google_event_id: string | null
          id: string
          inicio: string
          link_online: string | null
          paciente_id: string
          status: string
          tipo: string
        }
        Insert: {
          anotacoes?: string | null
          created_at?: string
          fim?: string | null
          google_event_id?: string | null
          id?: string
          inicio: string
          link_online?: string | null
          paciente_id: string
          status?: string
          tipo?: string
        }
        Update: {
          anotacoes?: string | null
          created_at?: string
          fim?: string | null
          google_event_id?: string | null
          id?: string
          inicio?: string
          link_online?: string | null
          paciente_id?: string
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          consulta_id: string | null
          created_at: string
          descricao: string
          forma: string | null
          id: string
          pago_em: string | null
          paciente_id: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          consulta_id?: string | null
          created_at?: string
          descricao: string
          forma?: string | null
          id?: string
          pago_em?: string | null
          paciente_id?: string | null
          valor: number
          vencimento?: string
        }
        Update: {
          consulta_id?: string | null
          created_at?: string
          descricao?: string
          forma?: string | null
          id?: string
          pago_em?: string | null
          paciente_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          created_at: string
          descricao: string
          id: string
          paciente_id: string
          prazo: string | null
          status: string
          unidade: string | null
          valor_alvo: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          paciente_id: string
          prazo?: string | null
          status?: string
          unidade?: string | null
          valor_alvo?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          paciente_id?: string
          prazo?: string | null
          status?: string
          unidade?: string | null
          valor_alvo?: number | null
        }
        Relationships: []
      }
      exames: {
        Row: {
          arquivo_path: string | null
          created_at: string
          data: string
          id: string
          liberado: boolean
          nome: string
          observacoes: string | null
          paciente_id: string
          unidade: string | null
          valor: string | null
        }
        Insert: {
          arquivo_path?: string | null
          created_at?: string
          data?: string
          id?: string
          liberado?: boolean
          nome: string
          observacoes?: string | null
          paciente_id: string
          unidade?: string | null
          valor?: string | null
        }
        Update: {
          arquivo_path?: string | null
          created_at?: string
          data?: string
          id?: string
          liberado?: boolean
          nome?: string
          observacoes?: string | null
          paciente_id?: string
          unidade?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          lida_em: string | null
          paciente_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          lida_em?: string | null
          paciente_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          lida_em?: string | null
          paciente_id?: string
          texto?: string
        }
        Relationships: []
      }
      consentimentos: {
        Row: {
          aceito_em: string
          id: string
          user_id: string
          versao: string
        }
        Insert: {
          aceito_em?: string
          id?: string
          user_id: string
          versao: string
        }
        Update: {
          aceito_em?: string
          id?: string
          user_id?: string
          versao?: string
        }
        Relationships: []
      }
      itens_refeicao: {
        Row: {
          alimento_id: string | null
          created_at: string
          descricao: string | null
          id: string
          medida_caseira: string | null
          ordem: number
          quantidade_g: number | null
          refeicao_id: string
          substituicoes: string | null
        }
        Insert: {
          alimento_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          medida_caseira?: string | null
          ordem?: number
          quantidade_g?: number | null
          refeicao_id: string
          substituicoes?: string | null
        }
        Update: {
          alimento_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          medida_caseira?: string | null
          ordem?: number
          quantidade_g?: number | null
          refeicao_id?: string
          substituicoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_refeicao_alimento_id_fkey"
            columns: ["alimento_id"]
            isOneToOne: false
            referencedRelation: "alimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_refeicao_refeicao_id_fkey"
            columns: ["refeicao_id"]
            isOneToOne: false
            referencedRelation: "refeicoes_dieta"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          dobras: Json
          altura: number | null
          circunferencias: Json
          created_at: string
          data: string
          id: string
          massa_magra: number | null
          observacoes: string | null
          paciente_id: string
          percentual_gordura: number | null
          peso: number | null
        }
        Insert: {
          dobras?: Json
          altura?: number | null
          circunferencias?: Json
          created_at?: string
          data?: string
          id?: string
          massa_magra?: number | null
          observacoes?: string | null
          paciente_id: string
          percentual_gordura?: number | null
          peso?: number | null
        }
        Update: {
          dobras?: Json
          altura?: number | null
          circunferencias?: Json
          created_at?: string
          data?: string
          id?: string
          massa_magra?: number | null
          observacoes?: string | null
          paciente_id?: string
          percentual_gordura?: number | null
          peso?: number | null
        }
        Relationships: []
      }
      diario_alimentar: {
        Row: {
          revisado_em: string | null
          comentario_nutricionista: string | null
          created_at: string
          data: string
          descricao: string | null
          foto_url: string | null
          id: string
          paciente_id: string
          refeicao: string
        }
        Insert: {
          revisado_em?: string | null
          comentario_nutricionista?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          foto_url?: string | null
          id?: string
          paciente_id: string
          refeicao: string
        }
        Update: {
          revisado_em?: string | null
          comentario_nutricionista?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          foto_url?: string | null
          id?: string
          paciente_id?: string
          refeicao?: string
        }
        Relationships: []
      }
      dietas: {
        Row: {
          meta_carbo_g: number | null
          meta_gordura_g: number | null
          meta_kcal: number | null
          meta_proteina_g: number | null
          publicada_em: string | null
          status: string
          ativa: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          paciente_id: string
          titulo: string
        }
        Insert: {
          meta_carbo_g?: number | null
          meta_gordura_g?: number | null
          meta_kcal?: number | null
          meta_proteina_g?: number | null
          publicada_em?: string | null
          status?: string
          ativa?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          paciente_id: string
          titulo: string
        }
        Update: {
          meta_carbo_g?: number | null
          meta_gordura_g?: number | null
          meta_kcal?: number | null
          meta_proteina_g?: number | null
          publicada_em?: string | null
          status?: string
          ativa?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          paciente_id?: string
          titulo?: string
        }
        Relationships: []
      }
      fotos_evolucao: {
        Row: {
          avaliacao_id: string | null
          created_at: string
          foto_url: string
          id: string
          paciente_id: string
          tipo: string
        }
        Insert: {
          avaliacao_id?: string | null
          created_at?: string
          foto_url: string
          id?: string
          paciente_id: string
          tipo: string
        }
        Update: {
          avaliacao_id?: string | null
          created_at?: string
          foto_url?: string
          id?: string
          paciente_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_evolucao_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          altura_cm: number | null
          nivel_atividade: string | null
          paciente_ve_calorias: boolean
          status: string
          created_at: string
          data_nascimento: string | null
          id: string
          nome: string
          objetivo: string | null
          observacoes: string | null
          sexo: string | null
          telefone: string | null
        }
        Insert: {
          altura_cm?: number | null
          nivel_atividade?: string | null
          paciente_ve_calorias?: boolean
          status?: string
          created_at?: string
          data_nascimento?: string | null
          id: string
          nome?: string
          objetivo?: string | null
          observacoes?: string | null
          sexo?: string | null
          telefone?: string | null
        }
        Update: {
          altura_cm?: number | null
          nivel_atividade?: string | null
          paciente_ve_calorias?: boolean
          status?: string
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
          objetivo?: string | null
          observacoes?: string | null
          sexo?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      refeicoes_dieta: {
        Row: {
          alimentos: string | null
          created_at: string
          dieta_id: string
          horario: string | null
          id: string
          nome: string
          observacoes: string | null
          ordem: number
        }
        Insert: {
          alimentos?: string | null
          created_at?: string
          dieta_id: string
          horario?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          ordem?: number
        }
        Update: {
          alimentos?: string | null
          created_at?: string
          dieta_id?: string
          horario?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "refeicoes_dieta_dieta_id_fkey"
            columns: ["dieta_id"]
            isOneToOne: false
            referencedRelation: "dietas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "nutricionista" | "paciente"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["nutricionista", "paciente"],
    },
  },
} as const
