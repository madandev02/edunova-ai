import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLElement> {
  className?: string
}

export const Card = ({ className, children, ...props }: CardProps) => {
  return (
    <section
      {...props}
      className={cn(
        'neo-card card-shell p-5 md:p-6',
        className,
      )}
    >
      {children}
    </section>
  )
}
