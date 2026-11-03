import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('DEVELOPER'); // 'DEVELOPER' | 'RECRUITER'
  const [companyName, setCompanyName] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.login(email.trim(), password);
        Alert.alert('Success', `Welcome back, ${res.user.name}!`);
        onAuthSuccess(res.user);
      } else {
        if (!name || !role || !phone) {
          Alert.alert('Required Fields', 'Name, Role, and Phone are required.');
          setLoading(false);
          return;
        }

        const skillList = skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const res = await api.register({
          email: email.trim(),
          password,
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim(),
          userType,
          companyName: userType === 'RECRUITER' ? companyName.trim() : undefined,
          skills: skillList.length ? skillList : undefined,
        });

        Alert.alert('Account Created', `Welcome to DevMatch, ${res.user.name}!`);
        onAuthSuccess(res.user);
      }
    } catch (err) {
      Alert.alert('Authentication Error', err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>devMatch Android</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to discover roles and developers' : 'Create an account to start matching'}
        </Text>
      </View>

      {/* Switch between Login and Register */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View style={styles.form}>
        {!isLogin && (
          <>
            {/* Account Type Selection */}
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, userType === 'DEVELOPER' && styles.typeBtnActive]}
                onPress={() => setUserType('DEVELOPER')}
              >
                <Text style={userType === 'DEVELOPER' ? styles.typeTextActive : styles.typeText}>
                  Developer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, userType === 'RECRUITER' && styles.typeBtnActive]}
                onPress={() => setUserType('RECRUITER')}
              >
                <Text style={userType === 'RECRUITER' ? styles.typeTextActive : styles.typeText}>
                  Recruiter
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
            />

            {userType === 'RECRUITER' && (
              <>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Acme Tech"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </>
            )}

            <Text style={styles.label}>Headline / Role *</Text>
            <TextInput
              style={styles.input}
              placeholder={userType === 'RECRUITER' ? 'Technical Recruiter' : 'Fullstack Developer'}
              value={role}
              onChangeText={setRole}
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 555-0100"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {userType === 'DEVELOPER' && (
              <>
                <Text style={styles.label}>Skills (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="React, Node.js, PostgreSQL"
                  value={skills}
                  onChangeText={setSkills}
                />
              </>
            )}
          </>
        )}

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e11d48',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  toggleTextActive: {
    color: '#e11d48',
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#e11d48',
    backgroundColor: '#ffe4e6',
  },
  typeText: {
    fontSize: 13,
    color: '#4b5563',
  },
  typeTextActive: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e11d48',
  },
  submitBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

