export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.5";
    };
    public: {
        Tables: {
            orders: {
                Row: {
                    cancel_reason: string | null;
                    created_at: string | null;
                    fees: number | null;
                    filled_price: number | null;
                    filled_quantity: number | null;
                    id: string;
                    limit_price: number | null;
                    quantity: number;
                    side: Database["public"]["Enums"]["order_side"];
                    status: Database["public"]["Enums"]["order_status"] | null;
                    symbol: string;
                    total_value: number | null;
                    type: Database["public"]["Enums"]["order_type"];
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    cancel_reason?: string | null;
                    created_at?: string | null;
                    fees?: number | null;
                    filled_price?: number | null;
                    filled_quantity?: number | null;
                    id?: string;
                    limit_price?: number | null;
                    quantity: number;
                    side: Database["public"]["Enums"]["order_side"];
                    status?: Database["public"]["Enums"]["order_status"] | null;
                    symbol: string;
                    total_value?: number | null;
                    type: Database["public"]["Enums"]["order_type"];
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    cancel_reason?: string | null;
                    created_at?: string | null;
                    fees?: number | null;
                    filled_price?: number | null;
                    filled_quantity?: number | null;
                    id?: string;
                    limit_price?: number | null;
                    quantity?: number;
                    side?: Database["public"]["Enums"]["order_side"];
                    status?: Database["public"]["Enums"]["order_status"] | null;
                    symbol?: string;
                    total_value?: number | null;
                    type?: Database["public"]["Enums"]["order_type"];
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "orders_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            portfolio: {
                Row: {
                    average_cost: number | null;
                    created_at: string | null;
                    id: string;
                    quantity: number | null;
                    symbol: string;
                    total_cost: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    average_cost?: number | null;
                    created_at?: string | null;
                    id?: string;
                    quantity?: number | null;
                    symbol: string;
                    total_cost?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    average_cost?: number | null;
                    created_at?: string | null;
                    id?: string;
                    quantity?: number | null;
                    symbol?: string;
                    total_cost?: number | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "portfolio_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            transactions: {
                Row: {
                    amount: number;
                    created_at: string | null;
                    description: string | null;
                    id: string;
                    metadata: Json | null;
                    reference: string | null;
                    status: Database["public"]["Enums"]["transaction_status"] | null;
                    type: Database["public"]["Enums"]["transaction_type"];
                    wallet_id: string;
                };
                Insert: {
                    amount: number;
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    reference?: string | null;
                    status?: Database["public"]["Enums"]["transaction_status"] | null;
                    type: Database["public"]["Enums"]["transaction_type"];
                    wallet_id: string;
                };
                Update: {
                    amount?: number;
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    reference?: string | null;
                    status?: Database["public"]["Enums"]["transaction_status"] | null;
                    type?: Database["public"]["Enums"]["transaction_type"];
                    wallet_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "transactions_wallet_id_fkey";
                        columns: ["wallet_id"];
                        isOneToOne: false;
                        referencedRelation: "wallets";
                        referencedColumns: ["id"];
                    }
                ];
            };
            users: {
                Row: {
                    created_at: string | null;
                    email: string;
                    first_name: string;
                    ghana_card_image_url: string | null;
                    ghana_card_number: string | null;
                    id: string;
                    is_email_verified: boolean | null;
                    is_phone_verified: boolean | null;
                    kyc_status: Database["public"]["Enums"]["kyc_status"] | null;
                    last_name: string;
                    password: string;
                    phone: string;
                    refresh_token: string | null;
                    role: Database["public"]["Enums"]["user_role"] | null;
                    selfie_image_url: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    email: string;
                    first_name: string;
                    ghana_card_image_url?: string | null;
                    ghana_card_number?: string | null;
                    id?: string;
                    is_email_verified?: boolean | null;
                    is_phone_verified?: boolean | null;
                    kyc_status?: Database["public"]["Enums"]["kyc_status"] | null;
                    last_name: string;
                    password: string;
                    phone: string;
                    refresh_token?: string | null;
                    role?: Database["public"]["Enums"]["user_role"] | null;
                    selfie_image_url?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    email?: string;
                    first_name?: string;
                    ghana_card_image_url?: string | null;
                    ghana_card_number?: string | null;
                    id?: string;
                    is_email_verified?: boolean | null;
                    is_phone_verified?: boolean | null;
                    kyc_status?: Database["public"]["Enums"]["kyc_status"] | null;
                    last_name?: string;
                    password?: string;
                    phone?: string;
                    refresh_token?: string | null;
                    role?: Database["public"]["Enums"]["user_role"] | null;
                    selfie_image_url?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            wallets: {
                Row: {
                    balance: number | null;
                    created_at: string | null;
                    id: string;
                    locked_balance: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    balance?: number | null;
                    created_at?: string | null;
                    id?: string;
                    locked_balance?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    balance?: number | null;
                    created_at?: string | null;
                    id?: string;
                    locked_balance?: number | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "wallets_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: true;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            kyc_status: "pending" | "submitted" | "approved" | "rejected";
            order_side: "buy" | "sell";
            order_status: "pending" | "open" | "filled" | "partially_filled" | "cancelled" | "rejected";
            order_type: "market" | "limit";
            transaction_status: "pending" | "completed" | "failed";
            transaction_type: "deposit" | "withdrawal" | "buy_order" | "sell_order" | "order_refund";
            user_role: "user" | "admin";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export declare const Constants: {
    readonly public: {
        readonly Enums: {
            readonly kyc_status: readonly ["pending", "submitted", "approved", "rejected"];
            readonly order_side: readonly ["buy", "sell"];
            readonly order_status: readonly ["pending", "open", "filled", "partially_filled", "cancelled", "rejected"];
            readonly order_type: readonly ["market", "limit"];
            readonly transaction_status: readonly ["pending", "completed", "failed"];
            readonly transaction_type: readonly ["deposit", "withdrawal", "buy_order", "sell_order", "order_refund"];
            readonly user_role: readonly ["user", "admin"];
        };
    };
};
export {};
