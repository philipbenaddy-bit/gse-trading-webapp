import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingDown, Calculator, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { useLivePrice } from '../../hooks/useLivePrice';
import toast from 'react-hot-toast';

interface TradeFormProps {
  symbol: string;
  currentPrice: number;
  availableBalance?: number;
}

type OrderType = 'market' | 'limit';
type OrderSide = 'buy' | 'sell';

export function TradeForm({ symbol, currentPrice: initialPrice, availableBalance = 10000 }: TradeFormProps) {
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // Use live price updates
  const { price: livePrice, isConnected } = useLivePrice(symbol);
  const currentPrice = livePrice ?? initialPrice;

  // Update limit price suggestion when switching to limit orders
  useEffect(() => {
    if (orderType === 'limit' && !limitPrice) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [orderType, currentPrice, limitPrice]);

  const price = orderType === 'market' ? currentPrice : parseFloat(limitPrice) || 0;
  const qty = parseFloat(quantity) || 0;
  const total = price * qty;

  // Calculate estimated fees (0.5% commission)
  const commission = total * 0.005;
  const totalWithFees = total + commission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (orderType === 'limit' && price <= 0) {
      toast.error('Please enter a valid limit price');
      return;
    }

    if (orderSide === 'buy' && totalWithFees > availableBalance) {
      toast.error('Insufficient balance (including fees)');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast.success(
        `${orderSide === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`
      );
      setQuantity('');
      if (orderType === 'limit') {
        setLimitPrice('');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Place Order</CardTitle>
          {isConnected && (
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 bg-accent rounded-full mr-1.5 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buy/Sell Tabs */}
          <Tabs value={orderSide} onValueChange={(v) => setOrderSide(v as OrderSide)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                <TrendingDown className="h-4 w-4 mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Current Price Display */}
          <div className="rounded-lg bg-muted p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="font-mono font-bold text-lg">{formatCurrency(currentPrice)}</span>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Order Type</label>
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="limit">Limit</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground mt-2">
              {orderType === 'market' 
                ? 'Execute immediately at current market price' 
                : 'Execute only when price reaches your specified limit'}
            </p>
          </div>

          {/* Limit Price (only for limit orders) */}
          {orderType === 'limit' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Limit Price (GHS)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Order will execute when price {orderSide === 'buy' ? 'drops to or below' : 'rises to or above'} this amount
              </p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quantity (Shares)</label>
            <Input
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {orderSide === 'buy' && availableBalance > 0 && price > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Max affordable: {formatNumber(Math.floor(availableBalance / (price * 1.005)), 0)} shares
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Order Summary</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per share</span>
              <span className="font-mono font-semibold">{formatCurrency(price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono font-semibold">{formatNumber(qty, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commission (0.5%)</span>
              <span className="font-mono font-semibold">{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-mono font-bold">{formatCurrency(totalWithFees)}</span>
            </div>
            {orderSide === 'buy' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Balance</span>
                <span className={`font-mono font-semibold ${totalWithFees <= availableBalance ? 'text-accent' : 'text-destructive'}`}>
                  {formatCurrency(availableBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Warning for insufficient balance */}
          {orderSide === 'buy' && totalWithFees > availableBalance && qty > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Insufficient balance</p>
                <p className="text-xs mt-1">
                  You need {formatCurrency(totalWithFees - availableBalance)} more to complete this order.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            variant={orderSide === 'buy' ? 'primary' : 'danger'}
            disabled={loading || (orderSide === 'buy' && totalWithFees > availableBalance) || qty <= 0}
            isLoading={loading}
          >
            {loading ? 'Placing Order...' : orderSide === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
