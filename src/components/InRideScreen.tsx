import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// TODO: implement 2-second hold with LongPressGestureHandler from react-native-gesture-handler

interface NextSegment {
  name: string;
  distanceKm: number;
}

interface Props {
  elapsedTime: string;       // formatted "1:04:22"
  speedKmh: number;
  heartRateBpm?: number;
  powerWatts?: number;
  distanceKm: number;
  gpsLocked: boolean;
  audioActive: boolean;
  nextSegment?: NextSegment; // undefined when no more segments ahead
  onEndRide: () => void;     // called after 2-second hold confirmed
}

export default function InRideScreen({
  elapsedTime,
  speedKmh,
  heartRateBpm,
  powerWatts,
  distanceKm,
  gpsLocked,
  audioActive,
  nextSegment,
  onEndRide,
}: Props) {
  return (
    <View style={styles.container}>

      {/* Status bar row */}
      <View style={styles.statusBar}>
        <Text style={styles.elapsed}>{elapsedTime}</Text>
        <View style={styles.statusPills}>
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: gpsLocked ? '#30A46C' : '#E5484D' }]} />
            <Text style={[styles.pillText, { color: gpsLocked ? '#30A46C' : '#E5484D' }]}>GPS</Text>
          </View>
          {audioActive && (
            <View style={styles.pill}>
              <Text style={styles.pillAudio}>♪</Text>
              <Text style={[styles.pillText, { color: '#888888' }]}>On</Text>
            </View>
          )}
        </View>
      </View>

      {/* Next segment pill */}
      {nextSegment ? (
        <View style={styles.nextSegPill}>
          <View>
            <Text style={styles.nextSegLabel}>Next segment</Text>
            <Text style={styles.nextSegName}>{nextSegment.name}</Text>
          </View>
          <View style={styles.nextSegDistWrap}>
            <Text style={styles.nextSegDist}>{nextSegment.distanceKm.toFixed(1)}</Text>
            <Text style={styles.nextSegDistLabel}>km away</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.nextSegPill, { opacity: 0.5 }]}>
          <Text style={styles.nextSegName}>No more segments · {distanceKm.toFixed(1)} km ridden</Text>
        </View>
      )}

      {/* Speed — hero element */}
      <View style={styles.speedWrap}>
        <Text style={styles.speed}>{Math.round(speedKmh)}</Text>
        <Text style={styles.speedUnit}>km/h</Text>

        {/* Secondary metrics */}
        <View style={styles.metricsRow}>
          {heartRateBpm !== undefined && (
            <>
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{heartRateBpm}</Text>
                <Text style={styles.metricLabel}>bpm</Text>
              </View>
              <View style={styles.metricDivider} />
            </>
          )}
          {powerWatts !== undefined && (
            <>
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{powerWatts}</Text>
                <Text style={styles.metricLabel}>watts</Text>
              </View>
              <View style={styles.metricDivider} />
            </>
          )}
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{distanceKm.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>km</Text>
          </View>
        </View>
      </View>

      {/* End Ride — requires 2-second hold */}
      {/* TODO: replace TouchableOpacity with LongPressGestureHandler (minDurationMs: 2000) */}
      <TouchableOpacity style={styles.endRideBtn} onLongPress={onEndRide} delayLongPress={2000} activeOpacity={0.7}>
        <Text style={styles.endRideText}>■  End Ride</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingTop: 54, // status bar height
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  elapsed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F0F0F0',
    fontVariant: ['tabular-nums'],
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillAudio: {
    fontSize: 11,
    color: '#F5C842',
  },
  nextSegPill: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(245,200,66,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.2)',
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextSegLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F5C842',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  nextSegName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0F0F0',
  },
  nextSegDistWrap: { alignItems: 'flex-end' },
  nextSegDist: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5C842',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  nextSegDistLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  speedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  speed: {
    fontSize: 112,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: -6,
    lineHeight: 112,
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555555',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  metric: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 4,
  },
  metricVal: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0F0F0',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444444',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2A2A2A',
  },
  endRideBtn: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  endRideText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
  },
});
