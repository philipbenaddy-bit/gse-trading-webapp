import { motion } from 'framer-motion';

// ── Pulse shimmer base ────────────────────────────────────────────────────────
function Shimmer({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`rounded-lg bg-gradient-to-r from-[#D4AF37]/6 via-[#D4AF37]/12 to-[#D4AF37]/6 ${className}`}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      style={{ backgroundSize: '200% 100%', ...style }}
    />
  );
}

// ── Full-page route-change skeleton ──────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <div className="h-16 border-b border-border/40 px-6 flex items-center justify-between">
        <Shimmer className="h-8 w-32" />
        <div className="flex gap-3">
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-8 w-20" />
        </div>
        <Shimmer className="h-8 w-24" />
      </div>

      {/* Page content skeleton */}
      <div className="flex-1 container py-8 space-y-6">
        {/* Title row */}
        <div className="flex items-center gap-3">
          <Shimmer className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Shimmer className="h-7 w-48" />
            <Shimmer className="h-4 w-64" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="african-card p-5 space-y-3">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-8 w-32" />
              <Shimmer className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 african-card p-6 space-y-4">
            <Shimmer className="h-6 w-40" />
            <Shimmer className="h-64 w-full rounded-xl" />
          </div>
          <div className="african-card p-6 space-y-4">
            <Shimmer className="h-6 w-32" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="african-card p-5 space-y-3">
      <Shimmer className="h-5 w-2/3" />
      {[...Array(lines)].map((_, i) => (
        <Shimmer key={i} className={`h-4 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="african-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <Shimmer key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="p-4 border-b border-border/30 flex gap-4">
          {[...Array(cols)].map((_, c) => (
            <Shimmer key={c} className={`h-4 flex-1 ${c === 0 ? 'w-20' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── News card skeleton ────────────────────────────────────────────────────────
export function NewsCardSkeleton() {
  return (
    <div className="african-card overflow-hidden">
      <Shimmer className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Shimmer className="h-5 w-full" />
        <Shimmer className="h-5 w-4/5" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
        <div className="flex gap-3 pt-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Stat card skeleton ────────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="african-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-8 w-8 rounded-lg" />
        <Shimmer className="h-4 w-12" />
      </div>
      <Shimmer className="h-4 w-24" />
      <Shimmer className="h-8 w-32" />
    </div>
  );
}

// ── Chart skeleton ────────────────────────────────────────────────────────────
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="african-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-6 w-40" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Shimmer key={i} className="h-8 w-10 rounded-lg" />
          ))}
        </div>
      </div>
      <Shimmer className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}
