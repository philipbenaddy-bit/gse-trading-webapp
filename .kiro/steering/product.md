# Product Overview

## GSE Trade — Ghana Stock Exchange Trading Platform

A full-stack web application for trading Ghana Stock Exchange (GSE) listed stocks.

### Core Features

- **Real-time Market Data** — Live stock prices from GSE API, broadcast via WebSockets
- **Trading** — Market and limit orders (buy & sell)
- **Portfolio Management** — Holdings tracking with live P&L calculations
- **Wallet System** — Fund deposits via Paystack (MTN MoMo, Vodafone Cash, AirtelTigo), bank withdrawals
- **KYC Verification** — Ghana Card verification flow for compliance
- **Order Management** — Full order history, cancel open orders

### External Integrations

- **GSE API** (kwayisi.org) — Market data source for live stock prices and equity information
- **Paystack** — Payment processing for deposits and withdrawals
- **Cloudinary** — KYC document uploads and storage
- **Supabase** — PostgreSQL database hosting with real-time capabilities

### Architecture Philosophy

The platform uses a **hybrid API architecture**:
- **NestJS Backend** handles complex business logic (authentication, trading operations, payment processing, KYC verification)
- **Supabase Direct API** handles simple CRUD operations and real-time features (portfolio views, transaction history, order history)

This split optimizes performance by reducing backend load for read operations while maintaining security through Row Level Security (RLS) policies.
