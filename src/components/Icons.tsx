const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const FeedIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
)

export const MapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)
