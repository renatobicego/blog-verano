const RE = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/

export function parseSpotify(url: string): { kind: string; id: string } | null {
  const m = url.match(RE)
  return m ? { kind: m[1], id: m[2] } : null
}

export function spotifyEmbed(url: string): { src: string; height: number } | null {
  const p = parseSpotify(url)
  if (!p) return null
  return {
    src: `https://open.spotify.com/embed/${p.kind}/${p.id}?utm_source=generator`,
    height: p.kind === 'track' || p.kind === 'episode' ? 152 : 352,
  }
}
