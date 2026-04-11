import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

interface CarouselSlide {
  headline: string;
  body: string;
  // TODO: replace with actual illustration component per slide
}

const SLIDES: CarouselSlide[] = [
  {
    headline: 'Knows your history',
    body: 'Every cue is built from your last 90 days on that segment — not a generic script.',
  },
  {
    headline: 'Ready before you roll',
    body: 'Coaching cues are generated over WiFi before your ride. Zero network calls mid-effort.',
  },
  {
    headline: 'Your debrief, spoken',
    body: 'After every ride, hear exactly what happened — segment by segment, in your ear.',
  },
];

interface Props {
  onComplete: () => void; // navigates to Strava OAuth
}

export default function CarouselScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={onComplete} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* TODO: swap placeholder for per-slide illustration component */}
      <View style={styles.illustration}>
        <Text style={styles.illustrationPlaceholder}>[ Illustration {index + 1} ]</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.headline}>{slide.headline}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnGold} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.btnGoldText}>{isLast ? 'Connect Strava' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  illustration: {
    width: 260,
    height: 210,
    alignSelf: 'center',
    marginTop: 48,
    marginBottom: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationPlaceholder: {
    fontSize: 13,
    color: colors.textDim,
  },
  textBlock: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.textDim,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: colors.gold,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  btnGold: {
    width: '100%',
    height: 56,
    backgroundColor: colors.gold,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGoldText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textOnGold,
  },
});
