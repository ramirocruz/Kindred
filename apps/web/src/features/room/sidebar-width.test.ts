import { clampSidebarWidth } from './components/RoomDivider';

describe('sidebar resizing', () => {
  it('keeps a usable minimum and reserves half the room for the movie', () => {
    expect(clampSidebarWidth(50, 1000)).toBe(220);
    expect(clampSidebarWidth(900, 1000)).toBe(500);
    expect(clampSidebarWidth(900, 2000)).toBe(600);
  });
  it('preserves an allowed drag position', () => {
    expect(clampSidebarWidth(380, 1200)).toBe(380);
  });
});
