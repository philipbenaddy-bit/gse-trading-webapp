/**
 * Component Showcase
 * 
 * This file demonstrates all UI components in the library.
 * Useful for testing, documentation, and visual regression testing.
 */

import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Modal,
  Badge,
  Avatar,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './index';

export function ComponentShowcase() {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value && value.length < 3) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2">UI Component Library</h1>
        <p className="text-muted-foreground">
          A showcase of all available components in the GSE Trading Platform
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🚀</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button isLoading={loading} onClick={handleLoadingDemo}>
            {loading ? 'Loading...' : 'Click to Load'}
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>A basic card with header and content</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the card content area.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Value</CardTitle>
              <CardDescription>Total holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono">GHS 45,230.50</p>
              <p className="text-sm text-accent">+12.5% today</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">View Details</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Market Status</CardTitle>
                  <CardDescription>GSE Trading</CardDescription>
                </div>
                <Badge variant="success">Open</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-mono">1.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trades</span>
                  <span className="font-mono">3,456</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Input placeholder="Default input" />
          <Input type="email" placeholder="Email input" />
          <Input type="number" placeholder="Number input" />
          <Input
            placeholder="Input with error"
            value={inputValue}
            onChange={handleInputChange}
            error={inputError}
          />
          <Input placeholder="Disabled input" disabled />
          <Input type="password" placeholder="Password input" />
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
        <div className="flex flex-wrap gap-4">
          <Badge variant="success">✓ Completed</Badge>
          <Badge variant="warning">⏳ Pending</Badge>
          <Badge variant="destructive">✗ Failed</Badge>
          <Badge variant="default">📈 Bullish</Badge>
        </div>
      </section>

      {/* Avatars */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Avatars</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Avatar src="https://github.com/shadcn.png" fallback="CN" />
          <Avatar fallback="JD" />
          <Avatar fallback="AB" size="lg" />
          <Avatar fallback="XY" size="xl" />
        </div>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Skeletons</h2>
        <Card className="max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tabs</h2>
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <h3 className="text-lg font-semibold">Overview</h3>
                <p className="text-muted-foreground">
                  View your portfolio overview and recent activity.
                </p>
              </TabsContent>
              <TabsContent value="analytics" className="space-y-4">
                <h3 className="text-lg font-semibold">Analytics</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and performance metrics.
                </p>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4">
                <h3 className="text-lg font-semibold">Settings</h3>
                <p className="text-muted-foreground">
                  Configure your preferences and account settings.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Modal */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Modal</h2>
        <Modal>
          <ModalTrigger asChild>
            <Button>Open Modal</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Confirm Trade</ModalTitle>
              <ModalDescription>
                Review your order details before confirming.
              </ModalDescription>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock</span>
                <span className="font-semibold">MTNGH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-semibold">100 shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold font-mono">GHS 1.25</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold font-mono">GHS 125.00</span>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="success">Confirm Order</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Combined Example</h2>
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar fallback="MT" />
              <div className="flex-1">
                <CardTitle>MTN Ghana (MTNGH)</CardTitle>
                <p className="text-sm text-gray-500">Telecommunications</p>
              </div>
              <Badge variant="success">+2.5%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trade">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trade">Trade</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>
              <TabsContent value="trade" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" placeholder="Enter quantity" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price</label>
                  <Input type="number" placeholder="Enter price" />
                </div>
                <div className="flex gap-2">
                  <Button variant="success" className="flex-1">
                    Buy
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Sell
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="info" className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-mono">GHS 5.2B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-mono">1.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span className="font-mono">15.3</span>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
