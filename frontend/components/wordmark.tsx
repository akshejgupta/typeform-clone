export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <rect width="24" height="24" rx="6" fill="#191919" />
        <path d="M7 16V8h2.1l2.9 5.1L14.9 8H17v8h-1.8V11l-2.7 4.4h-.9L8.8 11V16H7Z" fill="#fff" />
      </svg>
      typeform
    </span>
  );
}
