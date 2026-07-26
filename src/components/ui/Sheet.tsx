import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, Modal, Pressable, View } from 'react-native';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  /** Cap on sheet height as a fraction of the screen. Mockups use ~0.88. */
  maxHeightRatio?: number;
  children?: React.ReactNode;
}

/**
 * Bottom sheet — design/07-prototype-plan.md motion table.
 *
 * Spring physics are allowed on exactly three things; the sheet is one of them
 * (the others are the favorite heart and list reorder). Everything else in the
 * app uses the 120/200/280ms ease-out tokens.
 *
 * Reduced motion collapses the slide to an opacity crossfade — per the motion
 * rules, transforms go to ~0 but opacity survives.
 */
export const Sheet: React.FC<SheetProps> = ({ visible, onClose, maxHeightRatio = 0.88, children }) => {
  // Keep the Modal mounted through the exit animation, then unmount.
  const [mounted, setMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => setReduceMotion(false));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const screenHeight = Dimensions.get('window').height;

    if (visible) {
      setMounted(true);
      translateY.setValue(reduceMotion ? 0 : screenHeight);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        reduceMotion
          ? Animated.timing(translateY, { toValue: 0, duration: 1, useNativeDriver: true })
          : Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 260, mass: 0.9, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (!mounted) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: reduceMotion ? 0 : screenHeight,
        duration: reduceMotion ? 1 : 280,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
    // `mounted` is deliberately not a dependency — including it would re-run the
    // exit animation the moment it flips false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Animated.View style={{ opacity, ...StyleSheetAbsoluteFill }}>
          <Pressable
            className="flex-1 bg-ink/60"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={{ transform: [{ translateY }], maxHeight: Dimensions.get('window').height * maxHeightRatio }}
          className="rounded-t-hero bg-white dark:bg-night-raised"
        >
          {/* Grab handle — affordance only, drag-to-dismiss is not wired */}
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-9 rounded-pill bg-sand dark:bg-night-line" />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

/** RN has no `inset: 0` shorthand in style objects; spelled out once here. */
const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
