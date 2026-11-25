/** JSON válido, como lo almacena Postgres en `jsonb`. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Tipos del esquema `public`. Escritos a mano para no depender de la CLI de
 * Supabase en el build; se pueden regenerar con `supabase gen types`.
 */
export interface Database {
  public: {
    Tables: {
      themes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          data: Json;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          data: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          data?: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
