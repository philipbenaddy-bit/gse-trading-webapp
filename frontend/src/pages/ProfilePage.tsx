import { useQuery } from 'react-query';
import { User, Shield, CheckCircle, Clock, XCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { usersApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp, StaggerList, StaggerItem } from '../components/ui/PageTransition';
import { CardSkeleton } from '../components/ui/PageSkeleton';

const kycStatusConfig: Record<string, { label: string; colorClass: string; bg: string; border: string; icon: any }> = {
  pending:   { label: 'Not Submitted', colorClass: 'text-muted-foreground', bg: 'bg-muted/40',          border: 'border-border',           icon: Clock        },
  submitted: { label: 'Under Review',  colorClass: 'text-amber-500',        bg: 'bg-amber-500/6',       border: 'border-amber-500/30',     icon: Clock        },
  approved:  { label: 'Verified',      colorClass: 'price-up',              bg: 'bg-[#228B22]/6',       border: 'border-[#228B22]/30',     icon: CheckCircle  },
  rejected:  { label: 'Rejected',      colorClass: 'price-down',            bg: 'bg-[#DC143C]/6',       border: 'border-[#DC143C]/30',     icon: XCircle      },
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useQuery(
    'profile',
    () => usersApi.getProfile().then((r) => r.data),
  );

  const kyc    = kycStatusConfig[profile?.kycStatus || 'pending'];
  const KycIcon = kyc?.icon || Clock;

  return (
    <div className="max-w-2xl space-y-5 md:space-y-6 px-4 md:px-0 bg-background">

      {/* Header */}
      <FadeUp>
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="p-2.5 rounded-xl african-card">
            <User size={22} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Your account details and verification status</p>
          </div>
        </div>
      </FadeUp>

      {isLoading ? (
        <StaggerList className="space-y-5">
          <StaggerItem><CardSkeleton lines={4} /></StaggerItem>
          <StaggerItem><CardSkeleton lines={3} /></StaggerItem>
          <StaggerItem><CardSkeleton lines={2} /></StaggerItem>
        </StaggerList>
      ) : (
        <>
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="african-card p-5 md:p-6"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="relative flex-shrink-0">
                {/* Avatar with Ghana flag gradient */}
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-gold-sm"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                {profile?.kycStatus === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#228B22] rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle size={10} className="text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-bold text-[#D4AF37] truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
                {user?.phone && <p className="text-muted-foreground text-xs mt-0.5">{user.phone}</p>}
              </div>

              <span className="px-3 py-1.5 rounded-lg african-card text-[#D4AF37] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                <Star size={10} />
                {profile?.role || 'Investor'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border border-border/60 rounded-xl p-3 md:p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Account Type</p>
                <p className="text-sm font-semibold capitalize">{profile?.role || 'User'}</p>
              </div>
              <div className="bg-background border border-border/60 rounded-xl p-3 md:p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-semibold">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* KYC Status */}
          <ErrorBoundary inline section="KYC">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="african-card p-5 md:p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <Shield size={18} className="text-[#D4AF37]" />
                </div>
                <h3 className="font-semibold text-foreground">Identity Verification (KYC)</h3>
              </div>

              <div className={clsx('flex items-center gap-4 p-4 rounded-xl border', kyc?.bg, kyc?.border)}>
                <div className={clsx('p-2.5 rounded-lg flex-shrink-0', kyc?.bg)}>
                  <KycIcon size={20} className={kyc?.colorClass} />
                </div>
                <div className="min-w-0">
                  <p className={clsx('font-semibold', kyc?.colorClass)}>{kyc?.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile?.kycStatus === 'pending'   && 'Submit your Ghana Card to unlock full trading features'}
                    {profile?.kycStatus === 'submitted' && 'Your documents are being reviewed (1–2 business days)'}
                    {profile?.kycStatus === 'approved'  && 'Your identity has been verified. You have full access.'}
                    {profile?.kycStatus === 'rejected'  && 'Documents rejected. Please resubmit with clearer images.'}
                  </p>
                </div>
              </div>

              {(profile?.kycStatus === 'pending' || profile?.kycStatus === 'rejected') && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-foreground font-medium">Required documents:</p>
                  <ul className="space-y-1.5">
                    {['Ghana Card number', 'Clear photo of Ghana Card (front)', 'Selfie photo'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    KYC submission via document upload coming soon. Contact support to complete verification.
                  </p>
                </div>
              )}
            </motion.div>
          </ErrorBoundary>

          {/* Account details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="african-card p-5 md:p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Account Details</h3>
            <div className="space-y-0">
              {[
                { label: 'Email', value: profile?.email, verified: profile?.isEmailVerified },
                { label: 'Phone', value: profile?.phone, verified: profile?.isPhoneVerified },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-border/40 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium truncate">{item.value || '—'}</p>
                  </div>
                  <span className={clsx(
                    'text-xs font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 ml-3',
                    item.verified
                      ? 'price-up bg-[#228B22]/8 border-[#228B22]/20'
                      : 'text-amber-500 bg-amber-500/8 border-amber-500/20',
                  )}>
                    {item.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
