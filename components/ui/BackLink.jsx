import Link from 'next/link'
import { ChevronLeftIcon } from './icons'

export default function BackLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
      <ChevronLeftIcon size={16} />
      {children}
    </Link>
  )
}
