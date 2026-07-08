import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { walletApi } from '../lib/api';
import { formatGHS, formatGhanaTime } from '../utils/currency';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp, StaggerList, StaggerItem } from '../components/ui/PageTransition';
import { StatCardSkeleton } from '../components/ui/PageSkeleton';

const depositSchema = z.object({ amount: z.number().min(10, 'Minimum GH₵ 10') });
const withdrawSchema = z.object({
  amount: z.number().min(10, 'Minimum GH₵ 10'),
  bankCode: z.string().min(1, 'Required'),
  accountNumber: z.string().min(10, 'Valid account number required'),
  accountName: z.string().min(2, 'Required'),
});

const txTypeColors: Record<string, string> = {
  deposit:      'price-up',
  withdrawal:   'price-down',
  buy_order:    'price-down',
  sell_order:   'price-up',
  order_refund: 'price-up',
};

const txTypeLabels: Record<string, string> = {
  deposit:      'Deposit',
  withdrawal:   'Withdrawal',
  buy_order:    'Buy Order',
  sell_order:   'Sell Order',
  order_refund: 'Order Refund',
};

export default function WalletPage() {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: loadingWallet } = useQuery(
    'wallet',
    () => walletApi.get().then((r) => r.data),
  );
  const { data: txData, isLoading: loadingTx } = useQuery(
    'transactions',
    () => walletApi.getTransactions().then((r) => r.data),
  );

  const depositForm  = useForm({ resolver: zodResolver(depositSchema),  defaultValues: { amount: 100 } });
  const withdrawForm = useForm({ resolver: zodResolver(withdrawSchema) });

  const depositMutation = useMutation(
    (data: any) => walletApi.deposit(data.amount),
    {
      onSuccess: (res) => {
        window.open(res.data.authorizationUrl, '_blank');
        toast.success('Redirecting to payment…');
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Deposit failed'),
    },
  );

  const withdrawMutation = useMutation(
    (data: any) => walletApi.withdraw(data),
    {
      onSuccess: () => {
        toast.success('Withdrawal initiated!');
        queryClient.invalidateQueries('wallet');
        withdrawForm.reset();
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Withdrawal failed'),
    },
  );

  const available = Number(wallet?.balance || 0) - Number(wallet?.lockedBalance || 0);

  /* ── shared input class ── */
  const inputCls =
    'w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground ' +
    'focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all';

  return (
    <div className="space-y-5 md:space-y-6 relative px-4 md:px-0 bg-background">

      {/* Header */}
      <FadeUp>
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="p-2.5 rounded-xl african-card">
            <Wallet size={22} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Wallet</h1>
            <p className="text-sm text-muted-foreground">Manage your funds and transactions</p>
          </div>
        </div>
      </FadeUp>

      {/* Balance cards */}
      <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {loadingWallet ? (
          [...Array(3)].map((_, i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)
        ) : (
          <>
            <StaggerItem>
              <div className="african-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                    <Wallet size={16} className="text-[#D4AF37]" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Balance</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-[#D4AF37] font-mono">
                  {formatGHS(Number(wallet?.balance || 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">All funds in account</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="african-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[#228B22]/10">
                    <ArrowDownLeft size={16} className="text-[#228B22]" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Available</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold price-up font-mono">{formatGHS(available)}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Ready to trade</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="african-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Locked</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-amber-500 font-mono">
                  {formatGHS(Number(wallet?.lockedBalance || 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">Reserved for open orders</p>
              </div>
            </StaggerItem>
          </>
        )}
      </StaggerList>

      {/* Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Deposit / Withdraw */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="african-card p-5 md:p-6"
        >
          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden border border-border mb-5">
            <button
              onClick={() => setTab('deposit')}
              className={clsx(
                'flex-1 py-3 text-sm font-semibold transition-all',
                tab === 'deposit'
                  ? 'text-[#1a1200] shadow-gold-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[#D4AF37]/6',
              )}
              style={tab === 'deposit' ? { background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' } : {}}
            >
              Deposit
            </button>
            <button
              onClick={() => setTab('withdraw')}
              className={clsx(
                'flex-1 py-3 text-sm font-semibold transition-all',
                tab === 'withdraw'
                  ? 'bg-[#DC143C] text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[#DC143C]/6',
              )}
            >
              Withdraw
            </button>
          </div>

          {tab === 'deposit' ? (
            <form onSubmit={depositForm.handleSubmit((d) => depositMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Amount (GH₵)</label>
                <input
                  {...depositForm.register('amount', { valueAsNumber: true })}
                  type="number"
                  min={10}
                  className={inputCls}
                  placeholder="500"
                />
                {depositForm.formState.errors.amount && (
                  <p className="price-down text-xs mt-1">{depositForm.formState.errors.amount.message}</p>
                )}
              </div>

              {/* MoMo provider pills */}
              <div className="flex gap-2 flex-wrap">
                {['MTN MoMo', 'Vodafone Cash', 'AirtelTigo'].map((p) => (
                  <span key={p} className="px-3 py-1 rounded-full text-xs font-medium border border-[#D4AF37]/25 bg-[#D4AF37]/8 text-[#D4AF37]">
                    {p}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                You'll be redirected to Paystack to complete payment via your preferred mobile money provider.
              </p>

              <button
                type="submit"
                disabled={depositMutation.isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-[#1a1200] shadow-gold-sm hover:shadow-gold-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
              >
                {depositMutation.isLoading ? 'Processing…' : 'Deposit via Mobile Money'}
              </button>
            </form>
          ) : (
            <form onSubmit={withdrawForm.handleSubmit((d) => withdrawMutation.mutate(d))} className="space-y-4">
              {[
                { name: 'amount',        label: 'Amount (GH₵)',              placeholder: '200',          type: 'number' },
                { name: 'bankCode',      label: 'Bank Code',                 placeholder: '030100 (GCB)', type: 'text'   },
                { name: 'accountNumber', label: 'Account / Mobile Number',   placeholder: '0241234567',   type: 'text'   },
                { name: 'accountName',   label: 'Account Name',              placeholder: 'Kofi Mensah',  type: 'text'   },
              ].map(({ name, label, placeholder, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                  <input
                    {...withdrawForm.register(name as any, name === 'amount' ? { valueAsNumber: true } : {})}
                    type={type}
                    className={inputCls}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={withdrawMutation.isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[#DC143C] hover:bg-[#CE1126] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {withdrawMutation.isLoading ? 'Processing…' : 'Withdraw Funds'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Transaction history */}
        <ErrorBoundary inline section="Transactions">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="african-card overflow-hidden"
          >
            <div className="p-5 border-b border-border/40 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#D4AF37]" />
              <h3 className="font-semibold text-foreground">Transaction History</h3>
            </div>
            <div className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
              {loadingTx ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between p-4 animate-pulse">
                    <div className="h-4 bg-[#D4AF37]/10 rounded w-32" />
                    <div className="h-4 bg-[#D4AF37]/10 rounded w-20" />
                  </div>
                ))
              ) : txData?.length > 0 ? (
                txData.map((tx: any) => {
                  const isIncoming = ['deposit', 'sell_order', 'order_refund'].includes(tx.type);
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-[#D4AF37]/4 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={clsx('p-2 rounded-lg flex-shrink-0', isIncoming ? 'bg-[#228B22]/10' : 'bg-[#DC143C]/10')}>
                          {isIncoming
                            ? <ArrowDownLeft size={15} className="text-[#228B22]" />
                            : <ArrowUpRight  size={15} className="text-[#DC143C]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{txTypeLabels[tx.type] || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{formatGhanaTime(new Date(tx.createdAt))}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className={clsx('font-semibold text-sm font-mono', txTypeColors[tx.type])}>
                          {isIncoming ? '+' : '-'}{formatGHS(Number(tx.amount), { showSymbol: false })}
                        </p>
                        <p className={clsx('text-xs capitalize',
                          tx.status === 'completed' ? 'price-up' : tx.status === 'failed' ? 'price-down' : 'text-amber-500',
                        )}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                  No transactions yet
                </div>
              )}
            </div>
          </motion.div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
