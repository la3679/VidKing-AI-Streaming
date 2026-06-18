import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/** Friendly empty-state placeholder for lists with no content. */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center py-16 ${className}`}>
    {Icon && (
      <div className="w-20 h-20 bg-panel rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-muted" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">{title}</h3>
    {description && (
      <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">{description}</p>
    )}
    {action && (
      <button onClick={action.onClick} className="btn-primary mt-8 px-10">
        {action.label}
      </button>
    )}
  </div>
);
