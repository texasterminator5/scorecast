import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (mode: 'sign-in' | 'sign-up') => {
    if (!supabase) {
      setErrorText('Supabase is not configured yet.');
      return;
    }

    if (!email || !password) {
      setErrorText('Enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorText('');

    const response =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (response.error) {
      setErrorText(response.error.message);
      setLoading(false);
      return;
    }

    if (mode === 'sign-up') {
      setErrorText('Account created. Check your email to confirm, then sign in.');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.title}>Scorecast Login</Text>
        <Text style={styles.subtitle}>Sign in to access your control panel.</Text>

        {!hasSupabaseConfig && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Supabase not configured</Text>
            <Text style={styles.warningText}>
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or the CONTROL_ prefixed
              equivalents) in your environment, then restart Expo.
            </Text>
          </View>
        )}

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#8e8e98"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Password"
          placeholderTextColor="#8e8e98"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={() => submit('sign-in')} disabled={loading || !hasSupabaseConfig}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </Pressable>

        <Pressable style={[styles.secondaryButton, loading && styles.buttonDisabled]} onPress={() => submit('sign-up')} disabled={loading || !hasSupabaseConfig}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f14',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#171722',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26263a',
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#a4a4b4',
    fontSize: 14,
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: '#2a2220',
    borderColor: '#805a4d',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  warningTitle: {
    color: '#f0c6a4',
    fontWeight: '600',
  },
  warningText: {
    color: '#e9d6c8',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#2f2f45',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 14,
    backgroundColor: '#10101a',
  },
  error: {
    color: '#ff9898',
    fontSize: 13,
  },
  button: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F8EF7',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4F8EF7',
  },
  secondaryButtonText: {
    color: '#8eb7ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
