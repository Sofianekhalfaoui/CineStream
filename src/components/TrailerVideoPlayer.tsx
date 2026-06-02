import React, { useEffect, useRef } from 'react';

interface TrailerVideoPlayerProps {
  videoKey: string;
  isMuted: boolean;
  onEnded: () => void;
  onPlayerReady?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function TrailerVideoPlayer({ videoKey, isMuted, onEnded, onPlayerReady }: TrailerVideoPlayerProps) {
  const containerId = `yt-player-${videoKey}`;
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    // Load Youtube Iframe API if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    const initPlayer = () => {
      if (!active) return;
      
      // Destroy any existing player to prevent memory leaks or dual instances
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error(e);
        }
      }

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: videoKey,
          playerVars: {
            autoplay: 1,
            mute: isMuted ? 1 : 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            vq: 'hd1080', // request highest quality
            origin: window.location.origin,
            enablejsapi: 1
          },
          events: {
            onReady: (event: any) => {
              if (!active) return;
              event.target.playVideo();
              // In some browsers, autoplay requires muting to play
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              if (onPlayerReady) onPlayerReady();
            },
            onStateChange: (event: any) => {
              if (!active) return;
              // YT.PlayerState.ENDED is 0
              if (event.data === 0) {
                onEnded();
              }
            }
          }
        });
      } catch (err) {
        console.error('Failed to init YT player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Define or append callback
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    }

    return () => {
      active = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [videoKey, containerId]);

  // Sync mute state changes from outer controls
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.mute === 'function') {
      try {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
        }
      } catch (error) {
        console.warn('Error changing volume/mute state in YT player:', error);
      }
    }
  }, [isMuted]);

  return (
    <div id={`wrapper-${containerId}`} className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
      {/* Absolute overlay shield to block clicks and hover actions on the video */}
      <div id={`shield-${containerId}`} className="absolute inset-0 bg-transparent z-10 pointer-events-auto" />
      
      {/* Sizing container designed to cover the entire h-[72vh] view area across portrait/landscape and desktop/mobile platforms */}
      <div 
        className="absolute top-1/2 left-1/2 pointer-events-none transition-opacity duration-700"
        style={{
          width: '100vw',
          height: '56.25vw', /* 100 * 9 / 16 */
          minHeight: '72vh',
          minWidth: '128vh', /* 72 * 16 / 9 */
          transform: 'translate(-50%, -50%) scale(1.35)', /* Blow up scale to push title header and play/brand watermark off the screen bounds */
          transformOrigin: 'center center',
        }}
      >
        <div id={containerId} className="w-full h-full" />
      </div>
    </div>
  );
}
