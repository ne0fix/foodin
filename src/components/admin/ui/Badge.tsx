import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gray-200 text-gray-900',
        categoria:
          'border-transparent bg-blue-100 text-blue-800',
        tag:
          'border-transparent bg-yellow-100 text-yellow-800',
        success:
          'border-transparent bg-green-100 text-green-800',
        danger:
          'border-transparent bg-red-100 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
        label: string;
    }

function Badge({ className, variant, label, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
        {label}
    </div>
  );
}

export { Badge, badgeVariants };

export default Badge;
