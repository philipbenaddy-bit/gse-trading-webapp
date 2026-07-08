"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
exports.Constants = {
    public: {
        Enums: {
            kyc_status: ["pending", "submitted", "approved", "rejected"],
            order_side: ["buy", "sell"],
            order_status: [
                "pending",
                "open",
                "filled",
                "partially_filled",
                "cancelled",
                "rejected",
            ],
            order_type: ["market", "limit"],
            transaction_status: ["pending", "completed", "failed"],
            transaction_type: [
                "deposit",
                "withdrawal",
                "buy_order",
                "sell_order",
                "order_refund",
            ],
            user_role: ["user", "admin"],
        },
    },
};
//# sourceMappingURL=supabase.js.map