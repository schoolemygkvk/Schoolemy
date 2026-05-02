import React, { useState, useRef, useEffect } from "react";
import { Box, Skeleton } from "@mui/material";
import { getOptimalImageUrl } from "../../Utils/responsiveImage";


const ResponsiveImage = ({
  src,
  alt = "",
  sizes = "(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",
  lazy = true,
  fallback = "/images/placeholder.png",
  sx = {},
  objectFit = "cover",
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  // Determine image source
  const getImageSrc = () => {
    if (hasError) return fallback;
    if (typeof src === "string") return src;
    if (typeof src === "object") {
      return getOptimalImageUrl(src);
    }
    return fallback;
  };

  // Generate srcSet if src is an object with multiple sizes
  const getSrcSet = () => {
    if (typeof src !== "object" || hasError) return undefined;

    const widths = {
      thumbnail: "150w",
      small: "400w",
      medium: "800w",
      large: "1200w",
    };

    return Object.entries(src)
      .filter(([size]) => size !== "original" && widths[size])
      .map(([size, url]) => `${url} ${widths[size]}`)
      .join(", ");
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        position: "relative",
        overflow: "hidden",
        ...sx,
      }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={getImageSrc()}
          srcSet={getSrcSet()}
          sizes={sizes}
          alt={alt}
          loading={lazy ? "lazy" : "eager"}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
          {...props}
        />
      )}
    </Box>
  );
};


export const ResponsivePicture = ({
  src,
  alt = "",
  fallback = "/images/placeholder.png",
  sx = {},
  objectFit = "cover",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (typeof src !== "object" || hasError) {
    return (
      <ResponsiveImage
        src={hasError ? fallback : src}
        alt={alt}
        sx={sx}
        objectFit={objectFit}
        {...props}
      />
    );
  }

  return (
    <Box sx={{ position: "relative", overflow: "hidden", ...sx }}>
      <picture>
        {/* WebP sources for modern browsers */}
        {src.small && (
          <source
            media="(max-width: 480px)"
            srcSet={src.small}
            type="image/webp"
          />
        )}
        {src.medium && (
          <source
            media="(max-width: 768px)"
            srcSet={src.medium}
            type="image/webp"
          />
        )}
        {src.large && (
          <source
            media="(max-width: 1200px)"
            srcSet={src.large}
            type="image/webp"
          />
        )}

        {/* Fallback image */}
        <img
          src={src.original || src.large || src.medium || fallback}
          alt={alt}
          loading="lazy"
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
          }}
          {...props}
        />
      </picture>
    </Box>
  );
};


export const ResponsiveBackgroundImage = ({
  src,
  children,
  sx = {},
  overlay = false,
  overlayColor = "rgba(0, 0, 0, 0.5)",
  ...props
}) => {
  const [backgroundUrl, setBackgroundUrl] = useState("");

  useEffect(() => {
    if (typeof src === "string") {
      setBackgroundUrl(src);
    } else if (typeof src === "object") {
      setBackgroundUrl(getOptimalImageUrl(src));
    }
  }, [src]);

  // Update on resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof src === "object") {
        setBackgroundUrl(getOptimalImageUrl(src));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [src]);

  return (
    <Box
      sx={{
        position: "relative",
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        ...sx,
      }}
      {...props}
    >
      {overlay && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: overlayColor,
          }}
        />
      )}
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
};

export default ResponsiveImage;
