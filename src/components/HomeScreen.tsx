import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

interface RecentRide {
  id: string;
  title: string;
  date: string;
  distanceKm: number;
  segmentCount: number;
  prCount: number;
}

interface Props {
  athleteName: string;
  starredSegmentCount: number;
  lastSyncedAt: string; // human-readable e.g. "2h ago"
  recentRides: RecentRide[];
  canStartRideDirectly: boolean; // true when segments cached + cues fresh
  isSyncing: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onPlanRide: () => void;
  onStartRide: () => void;
  onRideTap: (rideId: string) => void;
}

export default function HomeScreen({
  athleteName,
  starredSegmentCount,
  lastSyncedAt,
  recentRides,
  canStartRideDirectly,
  isSyncing,
  isRefreshing,
  onRefresh,
  onPlanRide,
  onStartRide,
  onRideTap,
}: Props) {
  const greeting = `Good ${getTimeOfDay()}, ${athleteName.split(' ')[0]}.`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <View style={styles.syncRow}>
              {isSyncing && (
                <ActivityIndicator size="small" color={colors.gold} style={styles.syncSpinner} />
              )}
              <Text style={styles.syncStatus}>
                {isSyncing
                  ? 'Syncing segments from Strava...'
                  : `${starredSegmentCount} starred segments · Last synced ${lastSyncedAt}`}
              </Text>
            </View>
          </View>
          {/* TODO: replace with actual profile image */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{athleteName[0]}</Text>
          </View>
        </View>

        {/* Plan Ride card */}
        <TouchableOpacity style={styles.planCard} onPress={onPlanRide} activeOpacity={0.8}>
          <View style={styles.planCardLeft}>
            <Text style={styles.planCardIcon}>🚴</Text>
            <View>
              <Text style={styles.planCardTitle}>Plan Ride</Text>
              <Text style={styles.planCardSub}>
                Set route, choose goal, generate cues
              </Text>
            </View>
          </View>
          <Text style={styles.planCardChevron}>›</Text>
        </TouchableOpacity>

        {/* Quick start if cues cached */}
        {canStartRideDirectly && (
          <TouchableOpacity style={styles.quickStartCard} onPress={onStartRide} activeOpacity={0.85}>
            <Text style={styles.quickStartText}>▶  Start Ride Now</Text>
            <Text style={styles.quickStartSub}>Using cached cues from last session</Text>
          </TouchableOpacity>
        )}

        {/* Recent rides */}
        <Text style={styles.sectionLabel}>Recent Rides</Text>

        {recentRides.length === 0 ? (
          <Text style={styles.emptyState}>
            Your rides will appear here after your first Sherpaa session.
          </Text>
        ) : (
          recentRides.map(ride => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              onPress={() => onRideTap(ride.id)}
              activeOpacity={0.75}
            >
              <View style={styles.rideCardTop}>
                <Text style={styles.rideTitle}>{ride.title}</Text>
                <Text style={styles.rideDate}>{ride.date}</Text>
              </View>
              <View style={styles.rideCardStats}>
                <View style={styles.rideStat}>
                  <Text style={styles.rideStatVal}>{ride.distanceKm} km</Text>
                </View>
                <View style={styles.rideStat}>
                  <Text style={styles.rideStatVal}>{ride.segmentCount} segs</Text>
                </View>
                {ride.prCount > 0 && (
                  <View style={styles.prTag}>
                    <Text style={styles.prTagText}>🏆 {ride.prCount} PR</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncSpinner: {
    marginRight: 6,
  },
  syncStatus: {
    fontSize: 13,
    color: colors.textMuted,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnGold,
  },
  planCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  planCardIcon: { fontSize: 24 },
  planCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planCardSub: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  planCardChevron: {
    fontSize: 22,
    color: colors.gold,
  },
  quickStartCard: {
    marginHorizontal: 20,
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickStartText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 3,
  },
  quickStartSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  emptyState: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  rideCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  rideCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rideTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rideDate: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
  },
  rideCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rideStat: {},
  rideStatVal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  prTag: {
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  prTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
  },
});
