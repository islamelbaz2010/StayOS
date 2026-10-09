import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";
import type { ViewStyle, StyleProp } from "react-native";

// Lightweight motion helpers on the built-in Animated API.
// All animations are native-driver transforms/opacity only: no layout
// shifts, and every animation is skipped entirely when the OS reports
// reduced-motion.

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

// Runs a short animation unless reduced-motion is on, in which case the
// target value is applied instantly.
export function animateMaybe(
  reduced: boolean,
  animation: Animated.CompositeAnimation,
  value: Animated.Value,
  toValue: number
) {
  if (reduced) {
    value.setValue(toValue);
    return;
  }
  animation.start();
}

interface FadeInProps {
  children: React.ReactNode;
  // Re-triggers the fade when this changes (e.g. when async data arrives).
  trigger?: unknown;
  style?: StyleProp<ViewStyle>;
}

// One-shot fade+rise used when content becomes available. Never replays
// on ordinary re-renders — only when `trigger` changes.
export function FadeIn({ children, trigger, style }: FadeInProps) {
  const reduced = usePrefersReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, reduced]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
