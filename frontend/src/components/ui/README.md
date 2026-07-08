# UI Component Library

A comprehensive, accessible, and theme-aware UI component library for the GSE Trading Platform.

## Components

### Button

A versatile button component with multiple variants and sizes.

**Variants:**
- `default` - Primary blue button
- `destructive` - Red button for destructive actions
- `outline` - Outlined button
- `secondary` - Secondary gray button
- `ghost` - Transparent button
- `link` - Link-styled button
- `success` - Green button for success actions

**Sizes:**
- `default` - Standard height (40px)
- `sm` - Small (32px)
- `lg` - Large (48px)
- `icon` - Square icon button (40x40px)

**Props:**
- `loading?: boolean` - Shows loading spinner
- `asChild?: boolean` - Renders as child component (Radix Slot)

**Example:**
```tsx
import { Button } from '@/components/ui';

<Button variant="default" size="lg">
  Place Order
</Button>

<Button variant="destructive" loading>
  Canceling...
</Button>
```

---

### Card

A container component with header, content, and footer sections.

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Example:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Portfolio Value</CardTitle>
    <CardDescription>Your total holdings</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">GHS 45,230.50</p>
  </CardContent>
</Card>
```

---

### Input

A text input component with error state support.

**Props:**
- `error?: string` - Error message to display below input
- All standard HTML input attributes

**Example:**
```tsx
import { Input } from '@/components/ui';

<Input
  type="number"
  placeholder="Enter quantity"
  error={errors.quantity?.message}
/>
```

---

### Modal

A dialog/modal component built on Radix UI Dialog.

**Sub-components:**
- `Modal` - Root component
- `ModalTrigger` - Trigger button
- `ModalContent` - Modal content container
- `ModalHeader` - Header section
- `ModalTitle` - Title text
- `ModalDescription` - Description text
- `ModalFooter` - Footer section
- `ModalClose` - Close button

**Example:**
```tsx
import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui';
import { Button } from '@/components/ui';

<Modal>
  <ModalTrigger asChild>
    <Button>Open Modal</Button>
  </ModalTrigger>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Confirm Order</ModalTitle>
      <ModalDescription>
        Are you sure you want to place this order?
      </ModalDescription>
    </ModalHeader>
    <ModalFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

---

### Badge

A small label component for status indicators.

**Variants:**
- `default` - Primary blue badge
- `secondary` - Gray badge
- `destructive` - Red badge
- `outline` - Outlined badge
- `success` - Green badge
- `warning` - Yellow/orange badge

**Example:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="warning">Pending</Badge>
```

---

### Avatar

A user avatar component with image and fallback support.

**Sub-components:**
- `Avatar` - Root container
- `AvatarImage` - Image element
- `AvatarFallback` - Fallback content (shown if image fails to load)

**Example:**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';

<Avatar>
  <AvatarImage src="/avatars/user.jpg" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### Skeleton

A loading placeholder component with pulse animation.

**Example:**
```tsx
import { Skeleton } from '@/components/ui';

<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-8 w-1/2" />
</div>
```

---

### Tabs

A tabbed interface component built on Radix UI Tabs.

**Sub-components:**
- `Tabs` - Root component
- `TabsList` - Container for tab triggers
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content panel for each tab

**Example:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="holdings">Holdings</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <p>Portfolio overview content</p>
  </TabsContent>
  <TabsContent value="holdings">
    <p>Holdings table</p>
  </TabsContent>
  <TabsContent value="history">
    <p>Transaction history</p>
  </TabsContent>
</Tabs>
```

---

### ThemeToggle

A button component for switching between dark and light themes.

**Example:**
```tsx
import { ThemeToggle } from '@/components/ui';

<ThemeToggle />
```

---

## Design Principles

### Accessibility
All components are built with accessibility in mind:
- Keyboard navigation support
- ARIA attributes
- Focus management
- Screen reader support

### Theme Support
Components automatically adapt to dark/light themes using CSS custom properties defined in `index.css`.

### Type Safety
All components are fully typed with TypeScript for better developer experience and fewer runtime errors.

### Composability
Components are designed to be composed together to build complex UIs:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Stock Details</CardTitle>
        <CardDescription>Real-time market data</CardDescription>
      </div>
      <Badge variant="success">Live</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="chart">
      <TabsList>
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent value="chart">
        {/* Chart component */}
      </TabsContent>
      <TabsContent value="stats">
        {/* Stats component */}
      </TabsContent>
    </Tabs>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Trade Now</Button>
  </CardFooter>
</Card>
```

## Styling

Components use Tailwind CSS utility classes and can be customized via the `className` prop:

```tsx
<Button className="w-full mt-4">
  Full Width Button
</Button>

<Card className="border-primary">
  Highlighted Card
</Card>
```

## Utilities

The `cn()` utility function (from `@/lib/utils`) is used throughout for merging Tailwind classes:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

## Dependencies

- **@radix-ui/react-*** - Accessible component primitives
- **class-variance-authority** - Variant management
- **clsx** - Class name utility
- **tailwind-merge** - Tailwind class merging
- **lucide-react** - Icon library

## Best Practices

1. **Import from barrel file:**
   ```tsx
   import { Button, Card, Input } from '@/components/ui';
   ```

2. **Use semantic variants:**
   ```tsx
   <Button variant="destructive">Delete</Button>
   <Badge variant="success">Completed</Badge>
   ```

3. **Provide accessible labels:**
   ```tsx
   <Input aria-label="Stock quantity" placeholder="Quantity" />
   ```

4. **Handle loading states:**
   ```tsx
   <Button loading={isSubmitting}>Submit Order</Button>
   ```

5. **Show error feedback:**
   ```tsx
   <Input error={errors.price?.message} />
   ```
