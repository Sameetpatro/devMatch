import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { api, storage } from './src/services/api';
import { closeMobileSocket } from './src/services/socket';
import AuthScreen from './src/screens/AuthScreen';
import FeedScreen from './src/screens/FeedScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'matches'
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        const res = await api.getMe();
        setUser(res.user);
      }
    } catch (err) {
      console.log('No active session:', err.message);
      await storage.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    closeMobileSocket();
    await storage.clearToken();
    setUser(null);
    setActiveChat(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Initializing devMatch...</Text>
      </View>
    );
  }

  // Unauthenticated: Show Auth Screen
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <AuthScreen onAuthSuccess={(userData) => setUser(userData)} />
      </SafeAreaView>
    );
  }

  // Active Chat Screen
  if (activeChat) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ChatScreen
          match={activeChat}
          currentUser={user}
          onBack={() => setActiveChat(null)}
        />
      </SafeAreaView>
    );
  }

  // Authenticated Main Dashboard
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>devMatch</Text>
          <Text style={styles.userSubtitle}>
            {user.name} ({user.userType === 'RECRUITER' ? 'Recruiter' : 'Developer'})
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content View */}
      <View style={styles.content}>
        {activeTab === 'feed' ? (
          <FeedScreen user={user} />
        ) : (
          <MatchesScreen onOpenChat={(m) => setActiveChat(m)} />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'feed' && styles.tabItemActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={activeTab === 'feed' ? styles.tabTextActive : styles.tabText}>
            🔍 Discover Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'matches' && styles.tabItemActive]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={activeTab === 'matches' ? styles.tabTextActive : styles.tabText}>
            💬 Matches & Chat
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e11d48',
  },
  userSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: '#ffe4e6',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    fontSize: 13,
    color: '#e11d48',
    fontWeight: 'bold',
  },
});
