import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';

export default function FeedScreen({ user }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const isDeveloper = user?.userType !== 'RECRUITER';

  const loadFeed = async () => {
    setLoading(true);
    try {
      if (isDeveloper) {
        const res = await api.getRolesFeed();
        setItems(res.data || []);
      } else {
        const res = await api.getDevelopersFeed();
        setItems(res.data || []);
      }
      setCurrentIndex(0);
    } catch (err) {
      Alert.alert('Feed Error', err.message || 'Could not load feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleAction = async (isLike) => {
    if (currentIndex >= items.length) return;
    const currentItem = items[currentIndex];

    try {
      if (isDeveloper) {
        const roleId = currentItem.role.id;
        if (isLike) {
          await api.applyRole(roleId, 'Applied from Android client');
          Alert.alert('Applied!', `Application submitted for "${currentItem.role.title}".`);
        }
      } else {
        const devId = currentItem.id;
        await api.swipeUser(devId, isLike ? 'LIKE' : 'PASS');
        if (isLike) {
          Alert.alert('Liked!', `Liked candidate ${currentItem.name}.`);
        }
      }
    } catch (err) {
      Alert.alert('Notice', err.message || 'Action processed.');
    } finally {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Fetching personalized feed...</Text>
      </View>
    );
  }

  if (currentIndex >= items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptySubtitle}>
          You have reviewed all current recommendations in your feed.
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadFeed}>
          <Text style={styles.refreshBtnText}>Refresh Feed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.feedType}>
          {isDeveloper ? 'Personalized Job Feed' : 'Developer Candidate Deck'}
        </Text>
        <Text style={styles.counter}>
          Card {currentIndex + 1} of {items.length}
        </Text>
      </View>

      {/* Card Content */}
      <View style={styles.card}>
        {isDeveloper ? (
          // Role Card
          <>
            <View style={styles.badgeRow}>
              <Text style={styles.companyBadge}>{currentItem.role.companyName}</Text>
              <Text style={styles.matchBadge}>{currentItem.scoring.score}% Match</Text>
            </View>

            <Text style={styles.roleTitle}>{currentItem.role.title}</Text>
            <Text style={styles.metaText}>
              {currentItem.role.isRemote ? 'Remote' : currentItem.role.location || 'Onsite'} •{' '}
              {currentItem.role.experienceYearsRequired}+ yrs exp
              {currentItem.role.salaryRange ? ` • ${currentItem.role.salaryRange}` : ''}
            </Text>

            <Text style={styles.description}>{currentItem.role.description}</Text>

            <Text style={styles.sectionTitle}>Required Skills:</Text>
            <View style={styles.skillsRow}>
              {(currentItem.role.skills || []).map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          // Developer Card
          <>
            <Text style={styles.roleTitle}>{currentItem.name}</Text>
            <Text style={styles.metaText}>
              {currentItem.role} • {currentItem.experienceYears} yrs experience
            </Text>

            {currentItem.bio ? <Text style={styles.description}>{currentItem.bio}</Text> : null}

            <Text style={styles.sectionTitle}>Skills:</Text>
            <View style={styles.skillsRow}>
              {(currentItem.skills || []).map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Simple Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => handleAction(false)}>
          <Text style={styles.skipText}>✕ Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeBtn} onPress={() => handleAction(true)}>
          <Text style={styles.likeText}>
            {isDeveloper ? '✓ Apply Now' : '✓ Connect / Like'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  counter: {
    fontSize: 12,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  companyBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e11d48',
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  matchBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  metaText: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 6,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skillText: {
    fontSize: 12,
    color: '#374151',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  skipText: {
    color: '#4b5563',
    fontWeight: 'bold',
    fontSize: 15,
  },
  likeBtn: {
    flex: 2,
    backgroundColor: '#e11d48',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  likeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

