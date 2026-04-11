import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

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
  onPlanRide,
  onStartRide,
  onRideTap,
}: Props) {
  const greeting = `Good ${getTimeOfDay()}, ${athleteName.split(' ')[0]}.`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.syncStatus}>
              {starredSegmentCount} starred segments · Last synced {lastSyncedAt}
            </Text>
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

      {/* Tab bar — TODO: replace with actual tab navigator */}
      <View style={styles.tabBar}>
        {['🏠', '⭐', '📋', '⚙️'].map((icon, i) => (
          <View key={i} style={styles.tabItem}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabLabel, i === 0 && styles.tabLabelActive]}>
              {['Home', 'Segments', 'History', 'Settings'][i]}
            </Text>
          </View>
        ))}
      </View>
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
    backgroundColor: '#1C1C1E',
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
    color: '#F0F0F0',
    marginBottom: 4,
  },
  syncStatus: {
    fontSize: 13,
    color: '#555555',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#F5C842',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  planCard: {
    marginHorizontal: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#363636',
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
    color: '#F0F0F0',
    marginBottom: 4,
  },
  planCardSub: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
  },
  planCardChevron: {
    fontSize: 22,
    color: '#F5C842',
  },
  quickStartCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(245,200,66,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickStartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5C842',
    marginBottom: 3,
  },
  quickStartSub: {
    fontSize: 12,
    color: '#555555',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444444',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  emptyState: {
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  rideCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#363636',
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
    color: '#F0F0F0',
  },
  rideDate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444444',
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
    color: '#F0F0F0',
  },
  prTag: {
    backgroundColor: 'rgba(245,200,66,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  prTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F5C842',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    height: 83,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIcon: { fontSize: 22, opacity: 0.6 },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444444',
  },
  tabLabelActive: {
    color: '#F5C842',
  },
});
