import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../services/api';
import { getMobileSocket } from '../services/socket';

export default function ChatScreen({ match, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  const matchId = match.matchId;
  const partner = match.user;

  useEffect(() => {
    // 1. Fetch chat history
    api
      .getMessages(matchId)
      .then((res) => {
        setMessages(res.data || []);
      })
      .catch((err) => console.warn('Chat history error:', err))
      .finally(() => setLoading(false));

    // 2. Setup Socket.io real-time listener
    let activeSocket = null;
    getMobileSocket().then((socket) => {
      if (socket) {
        activeSocket = socket;
        socket.emit('join_match', { matchId });

        socket.on('receive_message', (msg) => {
          if (msg.matchId === matchId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        });
      }
    });

    return () => {
      if (activeSocket) {
        activeSocket.emit('leave_match', { matchId });
        activeSocket.off('receive_message');
      }
    };
  }, [matchId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');

    const socket = await getMobileSocket();
    if (socket && socket.connected) {
      socket.emit('send_message', { matchId, content }, (res) => {
        if (res?.status === 'ok') {
          setMessages((prev) => [...prev, res.data]);
        }
      });
    } else {
      // Fallback to REST
      try {
        const res = await api.sendMessage(matchId, content);
        setMessages((prev) => [...prev, res.data]);
      } catch (err) {
        console.warn('Failed to send message via REST:', err);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{partner.name}</Text>
          <Text style={styles.headerSubtitle}>{partner.role}</Text>
        </View>
      </View>

      {/* Message List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#e11d48" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMine = item.senderId === currentUser.id;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMine ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={isMine ? styles.myText : styles.theirText}>
                  {item.content}
                </Text>
                <Text style={isMine ? styles.myTime : styles.theirTime}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Bottom Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type message..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e11d48',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#e11d48',
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  myText: {
    color: '#ffffff',
    fontSize: 14,
  },
  theirText: {
    color: '#1f2937',
    fontSize: 14,
  },
  myTime: {
    color: '#fecdd3',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  theirTime: {
    color: '#9ca3af',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

