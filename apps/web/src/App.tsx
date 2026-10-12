import { useEffect, useState } from 'react';

import { RoomDashboard } from './features/room/components/RoomDashboard';
import { useRoomPreview } from './features/room/useRoomPreview';
import type { RoomSnapshot } from './features/room/types';

function LoadingRoom(): React.JSX.Element {
  return <main className="grid min-h-dvh place-items-center bg-[#07120f] text-sm text-stone-300">Preparing Kindred…</main>;
}

export function App(): React.JSX.Element {
  const [preview, setPreview] = useState<RoomSnapshot | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    let isCurrent = true;
    void import('./features/room/mocks/room').then(({ createMockRoomSnapshot }) => {
      if (isCurrent) {
        setPreview(createMockRoomSnapshot());
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (!preview) {
    return <LoadingRoom />;
  }

  return <RoomPreview initialRoom={preview} />;
}

function RoomPreview({ initialRoom }: { initialRoom: RoomSnapshot }): React.JSX.Element {
  const [room, dispatch] = useRoomPreview(initialRoom);

  return <RoomDashboard room={room} dispatch={dispatch} />;
}
