/**
 * Optimized Image Component
 * Provides lazy loading, WebP support, and performance optimizations
 */

import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Text,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { colors, spacing } from '../../styles/theme';
import { imageOptimizationService, OptimizedImageProps } from '../../services/imageOptimizationService';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { analyticsService } from '../../services/analyticsService';

interface OptimizedImageState {
  isLoading: boolean;
  hasError: boolean;
  isVisible: boolean;
  loadedUri?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps & {
  width?: number;
  height?: number;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  showLoadingIndicator?: boolean;
  showErrorMessage?: boolean;
  blurRadius?: number;
  progressive?: boolean;
}> = memo(({
  source,
  style,
  containerStyle,
  imageStyle,
  resizeMode = 'cover',
  placeholder,
  fallback,
  onLoad,
  onError,
  lazy = true,
  priority = 'normal',
  width,
  height,
  showLoadingIndicator = true,
  showErrorMessage = true,
  blurRadius,
  progressive = true,
  ...props
}) => {
  const [state, setState] = useState<OptimizedImageState>({
    isLoading: true,
    hasError: false,
    isVisible: !lazy, // If not lazy, assume visible
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(blurRadius || 0)).current;
  const mountTimeRef = useRef(Date.now());
  const viewRef = useRef<View>(null);

  // Get image URI from source
  const getImageUri = useCallback(() => {
    if (typeof source === 'object' && 'uri' in source) {
      return source.uri;
    }
    return '';
  }, [source]);

  // Load optimized image
  const loadImage = useCallback(async () => {
    const uri = getImageUri();
    if (!uri) {
      setState(prev => ({ ...prev, isLoading: false, hasError: true }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, hasError: false }));
      
      const optimizedUri = await imageOptimizationService.loadOptimizedImage(
        uri,
        width,
        height,
        priority
      );
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        loadedUri: optimizedUri 
      }));

      // Animate fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate blur out for progressive loading
      if (progressive && blurRadius) {
        Animated.timing(blurAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }

      // Track load time
      const loadTime = Date.now() - mountTimeRef.current;
      performanceMonitor.recordMetric('optimized_image_load_time', loadTime);
      
      onLoad?.();

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, hasError: true }));
      onError?.(error);
      
      analyticsService.trackEvent('optimized_image_load_error', {
        uri,
        error: (error as Error).message,
      });
    }
  }, [getImageUri, width, height, priority, fadeAnim, blurAnim, progressive, blurRadius, onLoad, onError]);

  // Handle visibility change for lazy loading
  const handleLayout = useCallback(() => {
    if (!lazy || state.isVisible) return;

    // Simple visibility check - in a real implementation, you'd use intersection observer
    // or measure the component's position relative to the viewport
    setState(prev => ({ ...prev, isVisible: true }));
  }, [lazy, state.isVisible]);

  // Load image when visible
  useEffect(() => {
    if (state.isVisible && !state.loadedUri && !state.hasError) {
      loadImage();
    }
  }, [state.isVisible, state.loadedUri, state.hasError, loadImage]);

  // Preload high priority images
  useEffect(() => {
    if (priority === 'high' && !lazy) {
      const uri = getImageUri();
      if (uri) {
        imageOptimizationService.preloadImage(uri, priority);
      }
    }
  }, [priority, lazy, getImageUri]);

  // Create placeholder
  const renderPlaceholder = useCallback(() => {
    if (placeholder) {
      return (
        <Image
          source={{ uri: placeholder }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
        />
      );
    }

    if (width && height) {
      const placeholderUri = imageOptimizationService.createPlaceholder(width, height);
      return (
        <Image
          source={{ uri: placeholderUri }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
        />
      );
    }

    return (
      <View style={[styles.placeholder, imageStyle]}>
        {showLoadingIndicator && state.isLoading && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>
    );
  }, [placeholder, width, height, imageStyle, resizeMode, showLoadingIndicator, state.isLoading]);

  // Render error state
  const renderError = useCallback(() => {
    if (fallback) {
      return (
        <Image
          source={{ uri: fallback }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
        />
      );
    }

    return (
      <View style={[styles.errorContainer, imageStyle]}>
        {showErrorMessage && (
          <Text style={styles.errorText}>Failed to load image</Text>
        )}
      </View>
    );
  }, [fallback, imageStyle, resizeMode, showErrorMessage]);

  // Render main image
  const renderImage = useCallback(() => {
    if (!state.loadedUri) return null;

    const imageSource = typeof source === 'number' 
      ? source 
      : { uri: state.loadedUri };

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={imageSource}
          style={[
            styles.image,
            imageStyle,
            progressive && blurRadius && { blurRadius: blurAnim }
          ]}
          resizeMode={resizeMode}
          onLoad={() => {
            const loadTime = Date.now() - mountTimeRef.current;
            analyticsService.trackEvent('optimized_image_rendered', {
              uri: state.loadedUri,
              loadTime,
              priority,
            });
          }}
          {...props}
        />
      </Animated.View>
    );
  }, [state.loadedUri, source, fadeAnim, imageStyle, progressive, blurRadius, blurAnim, resizeMode, priority, props]);

  return (
    <View
      ref={viewRef}
      style={[styles.container, containerStyle, style]}
      onLayout={handleLayout}
    >
      {/* Placeholder layer */}
      {(state.isLoading || !state.isVisible) && renderPlaceholder()}
      
      {/* Error layer */}
      {state.hasError && renderError()}
      
      {/* Main image layer */}
      {state.isVisible && !state.hasError && renderImage()}
      
      {/* Loading indicator overlay */}
      {state.isLoading && showLoadingIndicator && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
});

// Batch image preloader component
export const ImagePreloader: React.FC<{
  images: string[];
  priority?: 'low' | 'normal' | 'high';
  onComplete?: () => void;
}> = memo(({ images, priority = 'normal', onComplete }) => {
  useEffect(() => {
    const preloadImages = async () => {
      try {
        await imageOptimizationService.batchPreloadImages(images, priority);
        onComplete?.();
      } catch (error) {
        console.warn('Failed to preload images:', error);
      }
    };

    if (images.length > 0) {
      preloadImages();
    }
  }, [images, priority, onComplete]);

  return null; // This component doesn't render anything
});

// Progressive image component for hero images
export const ProgressiveImage: React.FC<OptimizedImageProps & {
  lowQualitySource?: string;
  highQualitySource: string;
  width: number;
  height: number;
}> = memo(({ lowQualitySource, highQualitySource, width, height, ...props }) => {
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  useEffect(() => {
    // Preload high quality image
    imageOptimizationService.preloadImage(highQualitySource, 'high')
      .then(() => setHighQualityLoaded(true))
      .catch(() => setHighQualityLoaded(false));
  }, [highQualitySource]);

  return (
    <View style={props.style}>
      {/* Low quality placeholder */}
      {lowQualitySource && !highQualityLoaded && (
        <OptimizedImage
          source={{ uri: lowQualitySource }}
          width={width}
          height={height}
          lazy={false}
          priority="high"
          blurRadius={2}
          {...props}
        />
      )}
      
      {/* High quality image */}
      {highQualityLoaded && (
        <OptimizedImage
          source={{ uri: highQualitySource }}
          width={width}
          height={height}
          lazy={false}
          priority="high"
          progressive={true}
          {...props}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: colors.darkGrey,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default OptimizedImage;
