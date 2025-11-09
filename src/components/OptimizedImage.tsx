import { useState, useRef, useEffect, useCallback } from 'react';
import { lazyLoadImage, LazyLoader } from '@/utils/lazy-loading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  sizes?: string;
  srcSet?: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
}

export function OptimizedImage({
  src,
  alt,
  placeholder,
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  style,
  sizes,
  srcSet,
  priority = false,
  fetchPriority = 'auto',
  decoding = 'async',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setIsError(true);
    onError?.();
  }, [onError]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsIntersecting(true);
      return;
    }

    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority, loading]);

  // Load image when intersecting
  useEffect(() => {
    if (!isIntersecting || !imgRef.current) return;

    if (placeholder && !isLoaded) {
      imgRef.current.src = placeholder;
    }

    lazyLoadImage(imgRef.current, src, placeholder);
  }, [isIntersecting, src, placeholder, isLoaded, handleLoad, handleError]);

  // Generate responsive srcSet if not provided
  const responsiveSrcSet = srcSet || generateResponsiveSrcSet(src);

  return (
    <div
      className={`optimized-image-container ${className} hover-enhanced micro-interaction performance-optimized accessibility-enhanced`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width,
        height,
        ...style,
      }}
      role="img"
      aria-label={alt}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle image interaction if needed
        }
      }}
    >
      <img
        ref={imgRef}
        alt={alt}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'} ${isError ? 'error' : ''} focus-enhanced keyboard-enhanced`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out, transform 0.2s ease-in-out',
          opacity: isLoaded ? 1 : 0,
          cursor: 'pointer',
        }}
        sizes={sizes}
        srcSet={responsiveSrcSet}
        loading={priority ? 'eager' : loading}
        fetchPriority={priority ? 'high' : fetchPriority}
        decoding={decoding}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !isError && (
        <div
          className="image-placeholder loading-enhanced"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Error fallback */}
      {isError && (
        <div
          className="image-error-fallback error-enhanced"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            color: '#666',
            fontSize: '14px',
          }}
          role="alert"
          aria-live="polite"
        >
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Failed to load image</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Generate responsive srcSet for different screen sizes
function generateResponsiveSrcSet(src: string): string {
  // Simple implementation - in production, you'd use an image CDN
  const widths = [320, 640, 768, 1024, 1280, 1536];
  
  return widths
    .map(width => `${src}?w=${width} ${width}w`)
    .join(', ');
}

// Progressive image loading component
export function ProgressiveImage({
  src,
  alt,
  placeholder,
  className = '',
  width,
  height,
  onLoad,
  onError,
  style,
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Load low-quality placeholder first
    if (placeholder && currentSrc === placeholder) {
      const img = new Image();
      img.onload = () => {
        // Then load high-quality image
        setCurrentSrc(src);
      };
      img.src = placeholder;
    } else if (currentSrc === src) {
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        onError?.();
      };
      img.src = src;
    }
  }, [src, placeholder, currentSrc, onLoad, onError]);

  return (
    <div
      className={`progressive-image-container ${className} hover-enhanced micro-interaction performance-optimized accessibility-enhanced`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width,
        height,
        ...style,
      }}
      role="img"
      aria-label={alt}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle image interaction if needed
        }
      }}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`progressive-image ${isLoaded ? 'loaded' : 'loading'} focus-enhanced keyboard-enhanced`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.5s ease-in-out, filter 0.3s ease-in-out, transform 0.2s ease-in-out',
          filter: isLoaded ? 'none' : 'blur(2px)',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

// Lazy loaded background image component
export function LazyBackgroundImage({
  src,
  children,
  className = '',
  style,
  alt,
}: {
  src: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    LazyLoader.observe(containerRef.current, () => {
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
        if (containerRef.current) {
          containerRef.current.style.backgroundImage = `url(${src})`;
        }
      };
      img.src = src;
    });
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`lazy-background-image ${className} hover-enhanced micro-interaction performance-optimized accessibility-enhanced`}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : 'none',
        backgroundColor: '#f0f0f0',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s ease-in-out, transform 0.2s ease-in-out',
        ...style,
      }}
      role="img"
      aria-label={alt || 'Background image'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle background image interaction if needed
        }
      }}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 loading-enhanced"
          style={{
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Image preloading utility
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    urls.forEach(url => {
      if (loadedImages.has(url) || loadingImages.has(url)) return;

      setLoadingImages(prev => new Set(prev).add(url));

      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      };
      img.onerror = () => {
        setFailedImages(prev => new Set(prev).add(url));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      };
      img.src = url;
    });
  }, [urls]);

  return {
    loadedImages,
    loadingImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url),
    hasFailed: (url: string) => failedImages.has(url),
  };
}

// Responsive image component with art direction
export function ResponsiveImage({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  style,
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const updateImageSrc = () => {
      const width = window.innerWidth;
      let newSrc = src;

      // Simple responsive logic - in production, use more sophisticated breakpoints
      if (width <= 640) {
        newSrc = `${src}?w=640`;
      } else if (width <= 1024) {
        newSrc = `${src}?w=1024`;
      } else {
        newSrc = `${src}?w=1536`;
      }

      if (newSrc !== currentSrc) {
        setCurrentSrc(newSrc);
      }
    };

    updateImageSrc();
    window.addEventListener('resize', updateImageSrc);

    return () => {
      window.removeEventListener('resize', updateImageSrc);
    };
  }, [src, currentSrc]);

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      className={`responsive-image ${className} mobile-enhanced desktop-enhanced`}
      onLoad={onLoad}
      onError={onError}
      style={style}
    />
  );
}

export default OptimizedImage;