import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, ArrowUpDown, Search, Download, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ordersApi } from '../lib/api';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp, StaggerList, StaggerItem } from '../components/ui/PageTransition';
import { StatCardSkeleton } from '../components/ui/PageSkeleton';
import { cn, formatNumber } from '../lib/utils';
import { formatGHS } from '../utils/currency';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending:          'warning',
  open:             'default',
  filled:           'success',
  partially_filled: 'warning',
  cancelled:        'destructive',
  rejected:         'destructive',
};

type SortField     = 'createdAt' | 'symbol' | 'quantity' | 'totalValue';
type SortDirection = 'asc' | 'desc';

export default function OrdersPage() {
  const [statusFilter,   setStatusFilter]   = useState<string>('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [sortField,      setSortField]      = useState<SortField>('createdAt');
  const [sortDirection,  setSortDirection]  = useState<SortDirection>('desc');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery(
    ['orders', statusFilter === 'all' ? undefined : statusFilter],
    () => ordersApi.getAll(statusFilter === 'all' ? undefined : statusFilter).then((r) => r.data),
    { refetchInterval: 10000 },
  );

  const cancelMutation = useMutation(
    (id: string) => ordersApi.cancel(id),
    {
      onSuccess: () => {
        toast.success('Order cancelled');
        queryClient.invalidateQueries('orders');
        queryClient.invalidateQueries('wallet');
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel order'),
    },
  );

  const filteredAndSortedOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = searchQuery
      ? orders.filter((o: any) => o.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
      : orders;
    return [...filtered].sort((a: any, b: any) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'createdAt') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      return sortDirection === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [orders, searchQuery, sortField, sortDirection]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, open: 0, filled: 0, cancelled: 0 };
    return {
      total:     orders.length,
      open:      orders.filter((o: any) => o.status === 'open').length,
      filled:    orders.filter((o: any) => o.status === 'filled').length,
      cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
    };
  }, [orders]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const filters = [
    { value: 'all',       label: 'All',       count: stats.total     },
    { value: 'open',      label: 'Open',      count: stats.open      },
    { value: 'filled',    label: 'Filled',    count: stats.filled    },
    { value: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    { value: 'pending',   label: 'Pending',   count: 0               },
  ];

  return (
    <div className="space-y-5 md:space-y-6 relative px-4 md:px-0 bg-background">

      {/* Header */}
      <FadeUp>
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="p-2.5 rounded-xl african-card">
            <ClipboardList size={22} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground">Track and manage your trading orders</p>
          </div>
        </div>
      </FadeUp>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)
        ) : (
          [
            { label: 'Total Orders', value: stats.total,     color: 'text-[#D4AF37]' },
            { label: 'Open Orders',  value: stats.open,      color: 'text-[#D4AF37]' },
            { label: 'Filled',       value: stats.filled,    color: 'price-up'        },
            { label: 'Cancelled',    value: stats.cancelled, color: 'text-muted-foreground' },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <div className="african-card p-4 md:p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{s.label}</p>
                <p className={`text-2xl md:text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
            </StaggerItem>
          ))
        )}
      </StaggerList>

      {/* Filters + search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="african-card p-4 md:p-5"
      >
        <div className="flex flex-col gap-3">
          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize whitespace-nowrap flex-shrink-0',
                  statusFilter === f.value
                    ? 'text-[#1a1200] shadow-gold-sm'
                    : 'border border-border hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/6 text-muted-foreground',
                )}
                style={statusFilter === f.value ? { background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' } : {}}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded text-xs',
                    statusFilter === f.value ? 'bg-black/15' : 'bg-[#D4AF37]/12 text-[#D4AF37]',
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + export */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
              />
            </div>
            <Button size="sm" variant="outline" className="flex-shrink-0 border-[#D4AF37]/30 hover:bg-[#D4AF37]/8 hover:border-[#D4AF37]/50">
              <Download className="h-4 w-4 sm:mr-2 text-[#D4AF37]" />
              <span className="hidden sm:inline text-[#D4AF37]">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Orders table */}
      <ErrorBoundary inline section="Orders Table">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="african-card overflow-hidden"
        >
          <div className="p-4 md:p-5 border-b border-border/40 flex items-center gap-2">
            <ClipboardList size={16} className="text-[#D4AF37]" />
            <h3 className="font-semibold text-foreground">Order History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border/40">
                  {[
                    { label: 'Symbol',  field: 'symbol'     as SortField },
                    { label: 'Side',    field: null },
                    { label: 'Type',    field: null },
                    { label: 'Qty',     field: 'quantity'   as SortField },
                    { label: 'Price',   field: null },
                    { label: 'Total',   field: 'totalValue' as SortField },
                    { label: 'Status',  field: null },
                    { label: 'Date',    field: 'createdAt'  as SortField },
                    { label: '',        field: null },
                  ].map((col) => (
                    <th key={col.label} className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {col.field ? (
                        <button
                          onClick={() => handleSort(col.field!)}
                          className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
                        >
                          {col.label} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#D4AF37]/8 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredAndSortedOrders.length > 0 ? (
                  filteredAndSortedOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-[#D4AF37]/4 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#D4AF37]">{order.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-bold uppercase',
                          order.side === 'buy'
                            ? 'bg-[#228B22]/12 text-[#228B22] border border-[#228B22]/20'
                            : 'bg-[#DC143C]/12 text-[#DC143C] border border-[#DC143C]/20',
                        )}>
                          {order.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{order.type}</td>
                      <td className="px-4 py-3 font-mono text-sm">{formatNumber(order.quantity, 0)}</td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground">
                        {order.limitPrice ? formatGHS(order.limitPrice) : 'Market'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#D4AF37]">
                        {order.totalValue > 0 ? formatGHS(order.totalValue) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[order.status]} className="capitalize text-xs whitespace-nowrap">
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(order.createdAt), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'open' && (
                          <button
                            onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isLoading}
                            className="p-1.5 rounded-lg text-[#DC143C] hover:bg-[#DC143C]/10 transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-muted-foreground">
                      <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </ErrorBoundary>
    </div>
  );
}
