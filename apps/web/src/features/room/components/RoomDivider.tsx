import { useRef } from 'react';

export function clampSidebarWidth(width: number, containerWidth: number): number {
  return Math.max(220, Math.min(width, Math.max(220, Math.min(600, containerWidth * 0.5))));
}

interface RoomDividerProps {
  width: number;
  onResize: (width: number) => void;
}

export function RoomDivider({ width, onResize }: RoomDividerProps): React.JSX.Element {
  const drag = useRef<{ x: number; width: number } | null>(null);
  return <div
    className="room-divider" role="separator" tabIndex={0}
    aria-label="Resize movie and participants" aria-orientation="vertical"
    aria-valuemin={220} aria-valuemax={600} aria-valuenow={Math.round(width)}
    title="Drag to resize · arrow keys to adjust · double-click to reset"
    onPointerDown={event => {
      if (event.button !== 0) return;
      drag.current = { x: event.clientX, width };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    }}
    onPointerMove={event => {
      if (!drag.current) return;
      const containerWidth = event.currentTarget.parentElement?.clientWidth || 1000;
      onResize(clampSidebarWidth(drag.current.width + drag.current.x - event.clientX, containerWidth));
    }}
    onPointerUp={event => { drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
    onLostPointerCapture={() => { drag.current = null; }}
    onPointerCancel={() => { drag.current = null; }}
    onDoubleClick={() => onResize(280)}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
      event.preventDefault();
      const containerWidth = event.currentTarget.parentElement?.clientWidth || 1000;
      onResize(event.key === 'Home' ? 280 : clampSidebarWidth(width + (event.key === 'ArrowLeft' ? 20 : -20), containerWidth));
    }}
  ><span /></div>;
}
