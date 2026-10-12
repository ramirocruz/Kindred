const paths = {
  speaker: 'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  camera: 'M3 6h12v12H3V6Zm12 4 6-4v12l-6-4',
  microphone: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1m-6 7v4m-4 0h8',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
};

export function MediaIcon({ name, muted = false }: { name: keyof typeof paths; muted?: boolean }): React.JSX.Element {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} />{muted && <path d="M2 2 22 22" />}</svg>;
}
