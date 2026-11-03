import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';

export default function MatchesScreen({ onOpenChat }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.getMatches();
      setMatches(res.data || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not fetch matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Loading connections...</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No Connections Yet</Text>
        <Text style={styles.emptySubtitle}>
          Apply to roles or swipe right on developers. When both parties agree, you can chat live!
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchMatches}>
          <Text style={styles.refreshBtnText}>Check Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Matches ({matches.length})</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.matchId)}
        renderItem={({ item }) => {
          const u = item.user;
          return (
            <View style={styles.matchCard}>
              <View style={styles.infoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{u.name?.[0]?.toUpperCase() || 'U'}</Text>
                  <View
                    style={[
                      styles.presenceDot,
                      { backgroundColor: u.isOnline ? '#10b981' : '#9ca3af' },
                    ]}
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.name}>{u.name}</Text>
                  <Text style={styles.role}>{u.role}</Text>
                  <Text style={styles.contact}>
                    📞 {u.phone} • ✉️ {u.email}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => onOpenChat(item)}
              >
                <Text style={styles.chatBtnText}>💬 Live Chat</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
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
  },
  emptyTitle: {
    fontSize: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e11d48',
  },
  presenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  textContainer: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  role: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 1,
  },
  contact: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  chatBtn: {
    marginTop: 12,
    backgroundColor: '#e11d48',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

