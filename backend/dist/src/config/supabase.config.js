"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseClient = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const createSupabaseClient = (config) => {
    const supabaseUrl = config.get('SUPABASE_URL');
    const supabaseKey = config.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
        },
    });
};
exports.createSupabaseClient = createSupabaseClient;
//# sourceMappingURL=supabase.config.js.map