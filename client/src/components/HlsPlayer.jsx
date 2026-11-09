import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function HlsPlayer({ src }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return undefined;
    if (src.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    video.src = src;
    return undefined;
  }, [src]);

  return (
    <div className="player">
      <video ref={ref} controls playsInline />
    </div>
  );
}
