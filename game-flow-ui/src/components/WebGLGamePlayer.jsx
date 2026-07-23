import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './WebGLGamePlayer.css';

const DEFAULT_ASPECT_RATIOS = {
  portrait: '9 / 16',
  landscape: '16 / 9',
};

function resolveClientAssetUrl(url) {
  if (!url || !url.startsWith('/')) return url;
  if (!/^\/(games|3dAssets)\//.test(url)) return url;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${url}`;
}

function getViewportState() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobileLike: window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
  };
}

function parseAspectRatio(aspectRatio) {
  if (typeof aspectRatio === 'number' && aspectRatio > 0) {
    return aspectRatio;
  }

  if (typeof aspectRatio !== 'string') {
    return null;
  }

  const parts = aspectRatio.split(/[:/]/).map((value) => Number(value.trim()));

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return parts[0] / parts[1];
}

function getDefaultLoadingScreenUrl(gameUrl) {
  if (typeof gameUrl !== 'string' || !gameUrl.endsWith('/index.html')) {
    return '';
  }

  return `${gameUrl.slice(0, -'/index.html'.length)}/loading_screen.png`;
}

function WebGLGamePlayer({
  gameUrl,
  title = "WebGL Game",
  mode = "landscape",
  thumbnailMode,
  aspectRatio,
  loadingScreenUrl,
  isActive = true,
  stopSignal = 0,
  onPlaybackChange,
  onFullscreenChange,
  onError,
}) {
  const containerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const isMobileLikeRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => getViewportState());
  const isPortraitViewport = viewportSize.height > viewportSize.width;
  const resolvedPreviewAspectRatio =
    DEFAULT_ASPECT_RATIOS[thumbnailMode ?? mode] ?? DEFAULT_ASPECT_RATIOS.landscape;
  const resolvedGameplayAspectRatio = aspectRatio ?? DEFAULT_ASPECT_RATIOS[mode] ?? DEFAULT_ASPECT_RATIOS.landscape;
  const aspectRatioValue = parseAspectRatio(resolvedGameplayAspectRatio) ?? (mode === 'portrait' ? 9 / 16 : 16 / 9);
  const shouldRotateFullscreen = isFullscreen && isPortraitViewport && mode === 'landscape';
  const resolvedGameUrl = resolveClientAssetUrl(gameUrl);
  const resolvedLoadingScreenUrl = resolveClientAssetUrl(loadingScreenUrl ?? getDefaultLoadingScreenUrl(gameUrl));
  const frameStyle = {};

  if (isFullscreen) {
    const viewportWidth = viewportSize.width;
    const viewportHeight = viewportSize.height;

    if (mode === 'portrait') {
      const fittedWidth = viewportWidth;
      const fittedHeight = Math.min(viewportHeight, fittedWidth / aspectRatioValue);
      frameStyle.width = `${fittedWidth}px`;
      frameStyle.height = `${fittedHeight}px`;
    } else if (shouldRotateFullscreen) {
      const fittedHeight = Math.min(viewportWidth, viewportHeight / aspectRatioValue);
      frameStyle.width = `${fittedHeight * aspectRatioValue}px`;
      frameStyle.height = `${fittedHeight}px`;
    } else {
      const fittedHeight = viewportHeight;
      const fittedWidth = Math.min(viewportWidth, fittedHeight * aspectRatioValue);
      frameStyle.width = `${fittedWidth}px`;
      frameStyle.height = `${fittedHeight}px`;
    }
  }

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    isMobileLikeRef.current = viewportSize.isMobileLike;
  }, [viewportSize.isMobileLike]);

  const stopGame = useCallback(() => {
    const wasStarted = hasStartedRef.current;
    hasStartedRef.current = false;
    setHasStarted(false);
    setIsFullscreen(false);
    if (wasStarted) {
      onPlaybackChange?.(false);
      onFullscreenChange?.(false);
    }
  }, [onFullscreenChange, onPlaybackChange]);

  useEffect(() => {
    if (!isActive) {
      queueMicrotask(stopGame);
    }
  }, [isActive, stopGame]);

  useEffect(() => {
    if (stopSignal > 0) queueMicrotask(stopGame);
  }, [stopGame, stopSignal]);

  useEffect(() => {
    const container = containerRef.current;
    function updateViewportOrientation() {
      setViewportSize(getViewportState());
    }

    function handleFullscreenChange() {
      const isContainerFullscreen = document.fullscreenElement === container;
      setIsFullscreen(isContainerFullscreen);
      onFullscreenChange?.(isContainerFullscreen);

      if (!isContainerFullscreen) {
        window.screen.orientation?.unlock?.();

        if (isMobileLikeRef.current && hasStartedRef.current) {
          stopGame();
        }
      }
    }

    window.addEventListener('resize', updateViewportOrientation);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', updateViewportOrientation);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.screen.orientation?.unlock?.();
      if (document.fullscreenElement === container) document.exitFullscreen?.()?.catch?.(() => {});
      if (hasStartedRef.current) {
        hasStartedRef.current = false;
        onPlaybackChange?.(false);
      }
    };
  }, [onFullscreenChange, onPlaybackChange, stopGame]);

  function startGame() {
    hasStartedRef.current = true;
    setHasStarted(true);
    setIsFullscreen(true);
    onPlaybackChange?.(true);
    onFullscreenChange?.(true);
  }

  useEffect(() => {
    if (!hasStarted) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') stopGame();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [hasStarted, stopGame]);

  return (
    <section
      ref={containerRef}
      className={`webgl-game-player${isFullscreen ? ' webgl-game-player--fullscreen' : ''}${shouldRotateFullscreen ? ' webgl-game-player--rotated' : ''}`}
      style={{
        '--webgl-game-aspect-ratio': isFullscreen ? resolvedGameplayAspectRatio : resolvedPreviewAspectRatio,
        '--webgl-game-background-image': !hasStarted && resolvedLoadingScreenUrl
          ? `linear-gradient(rgba(10, 10, 12, 0.22), rgba(10, 10, 12, 0.42)), url("${resolvedLoadingScreenUrl}")`
          : 'none',
      }}
    >
      {!hasStarted && (
        <button
          type="button"
          className="webgl-game-player__fullscreen-toggle"
          onClick={startGame}
          aria-label={`Play ${title} in fullscreen`}
        >
          <span className="webgl-game-player__fullscreen-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="webgl-game-player__fullscreen-label">Play Now</span>
        </button>
      )}
      {hasStarted && createPortal(
        <div className="webgl-game-modal" role="dialog" aria-modal="true" aria-label={`${title} game player`}>
          <header className="webgl-game-modal__header">
            <strong>{title}</strong>
            <button type="button" className="webgl-game-modal__exit" onClick={stopGame} aria-label={`Exit ${title}`}>
              <span aria-hidden="true">&times;</span> Exit
            </button>
          </header>
          <div className={`webgl-game-modal__stage webgl-game-modal__stage--${mode}`}>
            <iframe
              className="webgl-game-modal__frame"
              src={resolvedGameUrl}
              title={title}
              scrolling="no"
              allowFullScreen
              onError={() => onError?.(new Error('Playable preview failed to load.'))}
            />
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

export default WebGLGamePlayer;
