import { Calendar, MapPin, Phone, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CardVariant = 'compact' | 'expanded';

export interface AppointmentCardData {
  date?: string;
  service?: string;
  address?: string;
  confirmationNumber?: string;
}

export interface QuoteCardData {
  price?: string;
  service?: string;
}

interface CardVariantClasses {
  container: string;
  subtitle: string;
  title: string;
  badge: string;
  description: string;
  icon: string;
  detailsGrid: string;
  detailsLabel: string;
  detailsValue: string;
  actionsGrid: string;
  actionButton: string;
}

const variantClasses: Record<CardVariant, CardVariantClasses> = {
  compact: {
    container: 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md p-3 mt-2',
    subtitle: 'text-xs',
    title: 'mt-0.5 text-sm',
    badge: 'text-xs',
    description: 'text-xs',
    icon: 'size-3',
    detailsGrid: 'mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs',
    detailsLabel: 'gap-1 text-slate-500 dark:text-slate-400',
    detailsValue: 'text-right',
    actionsGrid: 'mt-3 grid gap-2 border-t border-slate-200 dark:border-slate-700 pt-3 grid-cols-2',
    actionButton: 'text-xs h-8',
  },
  expanded: {
    container: 'max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-4 mt-3',
    subtitle: 'text-sm',
    title: 'mt-1 text-lg',
    badge: '',
    description: 'text-sm',
    icon: 'size-4',
    detailsGrid: 'mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm',
    detailsLabel: 'gap-1.5 text-slate-500 dark:text-slate-400',
    detailsValue: 'text-right',
    actionsGrid: 'mt-4 grid gap-3 border-t border-slate-200 dark:border-slate-700 pt-4 sm:grid-cols-2',
    actionButton: '',
  },
};

export function AppointmentCard({
  data,
  variant = 'compact',
}: {
  data?: AppointmentCardData | null;
  variant?: CardVariant;
}) {
  const styles = variantClasses[variant];
  return (
    <div className={cn('w-full', styles.container)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn('text-slate-500 dark:text-slate-400', styles.subtitle)}>Appointment Confirmed</p>
          <h2 className={cn('font-semibold text-slate-900 dark:text-white', styles.title)}>Johnson Bros. Plumbing</h2>
        </div>
        <Badge className={cn('bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', styles.badge)}>
          Confirmed
        </Badge>
      </div>
      <dl className={styles.detailsGrid}>
        <dt className={cn('flex items-center font-medium', styles.detailsLabel)}>
          <Calendar className={styles.icon} />
          Date
        </dt>
        <dd className={cn('text-slate-900 dark:text-white', styles.detailsValue)}>
          {data?.date || 'Tomorrow · 9:00 AM'}
        </dd>
        <dt className={cn('flex items-center font-medium', styles.detailsLabel)}>
          <Wrench className={styles.icon} />
          Service
        </dt>
        <dd className={cn('text-slate-900 dark:text-white', styles.detailsValue)}>
          {data?.service || 'General Plumbing'}
        </dd>
        <dt className={cn('flex items-center font-medium', styles.detailsLabel)}>
          <MapPin className={styles.icon} />
          Address
        </dt>
        <dd className={cn('text-slate-900 dark:text-white truncate', styles.detailsValue)}>
          {data?.address || 'Your address'}
        </dd>
      </dl>
      <div className={styles.actionsGrid}>
        <a href="tel:6174799911" className="block">
          <Button variant={variant === 'expanded' ? 'brand-outline' : 'outline'} size={variant === 'expanded' ? undefined : 'sm'} className={cn('w-full', styles.actionButton)}>
            <Phone className={cn('mr-1', styles.icon)} />
            Call
          </Button>
        </a>
        <Button
          size={variant === 'expanded' ? undefined : 'sm'}
          variant={variant === 'expanded' ? 'brand-primary' : undefined}
          className={cn('w-full', variant === 'expanded' ? '' : 'bg-blue-600 hover:bg-blue-700', styles.actionButton)}
        >
          <MapPin className={cn('mr-1', styles.icon)} />
          Directions
        </Button>
      </div>
    </div>
  );
}

export function QuoteCard({
  data,
  onBookNow,
  variant = 'compact',
}: {
  data?: QuoteCardData | null;
  onBookNow?: () => void;
  variant?: CardVariant;
}) {
  const styles = variantClasses[variant];
  return (
    <div className={cn('w-full', styles.container)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn('text-slate-500 dark:text-slate-400', styles.subtitle)}>Service Quote</p>
          <h2 className={cn('font-semibold text-slate-900 dark:text-white', styles.title)}>
            {data?.service || 'Plumbing Service'}
          </h2>
        </div>
        <Badge className={cn('bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', styles.badge)}>
          Estimate
        </Badge>
      </div>
      <div className={cn('mt-2 text-center py-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg', variant === 'expanded' && 'mt-4 py-4 rounded-xl')}>
        <p className={cn('font-bold text-blue-600 dark:text-blue-400', variant === 'expanded' ? 'text-3xl' : 'text-2xl')}>
          ${data?.price || '99'}
        </p>
        <p className={cn('text-slate-500 dark:text-slate-400', styles.description)}>Service Call Fee</p>
      </div>
      <p className={cn('mt-2 text-slate-500 dark:text-slate-400 text-center', styles.description)}>
        Final price after on-site diagnosis. No hidden fees.
      </p>
      <div className={cn('mt-3 border-t border-slate-200 dark:border-slate-700 pt-3', variant === 'expanded' && 'mt-4 pt-4')}>
        <Button
          size={variant === 'expanded' ? undefined : 'sm'}
          className={cn('w-full', variant === 'expanded' ? '' : 'bg-blue-600 hover:bg-blue-700', styles.actionButton)}
          variant={variant === 'expanded' ? 'brand-primary' : undefined}
          onClick={onBookNow}
        >
          <Calendar className={cn('mr-1', styles.icon)} />
          Book Now
        </Button>
      </div>
    </div>
  );
}

export function EmergencyCard({ variant = 'compact' }: { variant?: CardVariant }) {
  const styles = variantClasses[variant];
  return (
    <div className={cn('w-full border-2 border-red-500 bg-red-50 dark:bg-red-950/30 shadow-md mt-2', variant === 'expanded' ? 'rounded-2xl p-4' : 'rounded-xl p-3')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn('text-red-600 dark:text-red-400 font-medium', styles.subtitle)}>Emergency? Call Us Now</p>
          <h2 className={cn('font-semibold text-red-700 dark:text-red-300', styles.title)}>We're Here 24/7</h2>
        </div>
        <Badge className={cn('bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', styles.badge)}>Urgent</Badge>
      </div>
      <div className={cn('mt-2 space-y-1.5 text-red-700 dark:text-red-300', styles.description)}>
        <p>
          For emergencies, please call us directly at (617) 479-9911 - you can tap the Call button below. For
          life-threatening emergencies (like gas leaks or flooding causing electrical hazards), please call 911 first.
        </p>
      </div>
      <div className={cn('mt-3 border-t border-red-300 dark:border-red-800 pt-3', variant === 'expanded' && 'mt-4 pt-4')}>
        <a href="tel:6174799911" className="block">
          <Button
            size={variant === 'expanded' ? undefined : 'sm'}
            className={cn('w-full', variant === 'expanded' ? '' : 'bg-red-600 hover:bg-red-700', styles.actionButton)}
            variant={variant === 'expanded' ? 'brand-urgent' : undefined}
          >
            <Phone className={cn('mr-1', styles.icon)} />
            Call (617) 479-9911 Now
          </Button>
        </a>
      </div>
    </div>
  );
}
