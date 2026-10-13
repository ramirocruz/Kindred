// Serialized into a supported frame by executeScript; no debugger or arbitrary page evaluation.
export async function mediaOperation(command, targetId) {
  try {
    const registry = globalThis.__kindredQuietMedia || (globalThis.__kindredQuietMedia = new Map());
    const scan = (root) => {
      const videos = [...root.querySelectorAll('video')];
      for (const element of root.querySelectorAll('*')) if (element.shadowRoot) videos.push(...scan(element.shadowRoot));
      return videos;
    };
    if (command.action === 'discover') {
      for (const [id, video] of registry) if (!video.isConnected) registry.delete(id);
      return scan(document).filter((video) => {
        const rect = video.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && video.readyState >= 1;
      }).map((video) => {
        let id = [...registry].find(([, value]) => value === video)?.[0];
        if (!id) { id = crypto.randomUUID(); registry.set(id, video); }
        return { id };
      });
    }
    const video = registry.get(targetId);
    if (!video?.isConnected) throw new Error('The player changed. Stop sharing and link it again.');
    if (!['state', 'play', 'pause', 'seek'].includes(command.action)) throw new Error('Unsupported media command.');
    if (command.action === 'play') {
      let timer;
      try {
        await Promise.race([video.play(), new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Start the video on Drive once, then try again.')), 5000);
        })]);
      } finally { clearTimeout(timer); }
    }
    if (command.action === 'pause') video.pause();
    if (command.action === 'seek') {
      if (!Number.isFinite(command.time) || command.time < 0) throw new Error('Invalid seek time.');
      if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('This media has no seekable timeline.');
      const target = Math.min(command.time, Math.max(0, video.duration - 0.05));
      if (![...Array(video.seekable.length).keys()].some((index) => target >= video.seekable.start(index) && target <= video.seekable.end(index))) {
        throw new Error('That point is not currently seekable.');
      }
      await new Promise((resolve, reject) => {
        const done = () => { clearTimeout(timer); video.removeEventListener('seeked', done); resolve(); };
        const timer = setTimeout(() => { video.removeEventListener('seeked', done); reject(new Error('The player did not finish seeking.')); }, 5000);
        video.addEventListener('seeked', done); video.currentTime = target;
        if (!video.seeking) done();
      });
    }
    return { time: video.currentTime, duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null, paused: video.paused };
  } catch (error) { return { failure: error.message || 'The source player rejected playback.' }; }
}
