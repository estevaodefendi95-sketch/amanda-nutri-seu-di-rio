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
      avaliacoes: {
        Row: {
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
