import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WebView as WebViewType } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const DEFAULT_CONTROL_URL = 'https://texasterminator5.github.io/Pool-Stream-Overlay/control.html';
const BASE_CONTROL_URL = process.env.EXPO_PUBLIC_CONTROL_URL ?? DEFAULT_CONTROL_URL;
const SUPABASE_PROJECT_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_CONTROL_SUPABASE_URL ?? '';
const VERIFY_CONTROL_URL =
  process.env.EXPO_PUBLIC_VERIFY_CONTROL_URL ??
  process.env.EXPO_PUBLIC_CONTROL_VERIFY_URL ??
  (SUPABASE_PROJECT_URL ? `${SUPABASE_PROJECT_URL}/functions/v1/verify-control-access` : '');
const DEFAULT_FIREBASE_DB_URL = 'https://pool-score-1a1f3-default-rtdb.firebaseio.com';
const FIREBASE_DB_URL =
  process.env.EXPO_PUBLIC_FIREBASE_DB_URL ??
  process.env.EXPO_PUBLIC_CONTROL_FIREBASE_DB_URL ??
  DEFAULT_FIREBASE_DB_URL;

function toRoomId(seed: string, preferredBase?: string | null, uniqueId?: string | null) {
  const base =
    (preferredBase ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '') || 'scorecast';

  // Keep format as requested: "<emailName>-<numbers>".
  // We hash a stable account seed to get a deterministic numeric suffix.
  const suffixSeed = uniqueId || seed;
  let hash = 0;
  for (let i = 0; i < suffixSeed.length; i += 1) {
    hash = (hash * 31 + suffixSeed.charCodeAt(i)) % 1000000;
  }
  const suffix = String(hash).padStart(6, '0');
  return `${base}-${suffix}`;
}

function withLiveParams(baseUrl: string, email?: string | null, userId?: string | null) {
  if (!FIREBASE_DB_URL) return baseUrl;

  // `serve` often redirects `/control.html` -> `/control` locally, and redirects can drop query params.
  // Normalize local URLs to `/control` so live params always arrive in the page.
  const normalizedBaseUrl = baseUrl.replace(
    /(https?:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?\/)control\.html(?=$|\?)/i,
    '$1control'
  );

  const localPart = email?.split('@')[0] ?? null;
  const seed = email || userId || 'scorecast-user';
  const roomId = toRoomId(seed, localPart, userId);
  const url = new URL(normalizedBaseUrl);
  url.searchParams.set('live', '1');
  url.searchParams.set('lockRoom', '1');
  url.searchParams.set('db', FIREBASE_DB_URL);
  url.searchParams.set('room', roomId);
  return url.toString();
}

function toOverlayUrl(controlUrl: string) {
  const url = new URL(controlUrl);
  url.pathname = url.pathname
    .replace(/\/control\.html$/i, '/index.html')
    .replace(/\/control$/i, '/index.html');
  return url.toString();
}

export default function Index() {
  const { session } = useAuth();
  const webviewRef = useRef<WebViewType>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [activeRoomId, setActiveRoomId] = useState('');
  const controlUrl = useMemo(
    () => withLiveParams(BASE_CONTROL_URL, session?.user?.email, session?.user?.id),
    [session?.user?.email, session?.user?.id]
  );
  const overlayUrl = useMemo(() => toOverlayUrl(controlUrl), [controlUrl]);
  const injectedBootstrap = useMemo(
    () =>
      `
        window.__scorecastAuthToken = ${JSON.stringify(session?.access_token ?? '')};
        window.__scorecastVerifyUrl = ${JSON.stringify(VERIFY_CONTROL_URL)};
        true;
      `,
    [session?.access_token]
  );

  useEffect(() => {
    try {
      const url = new URL(controlUrl);
      setActiveRoomId(url.searchParams.get('room') ?? '');
    } catch {
      setActiveRoomId('');
    }
  }, [controlUrl]);

  const reload = () => {
    setError(false);
    setLoading(true);
    webviewRef.current?.reload();
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const copyOverlayUrl = async () => {
    try {
      await Clipboard.setStringAsync(overlayUrl);
      setCopyStatus(activeRoomId ? `Overlay copied (${activeRoomId})` : 'Overlay URL copied');
    } catch {
      setCopyStatus('Copy failed');
    }

    setTimeout(() => {
      setCopyStatus('');
    }, 2200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.headerTitle}>Scorecast</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={copyOverlayUrl} style={styles.copyBtn}>
            <Text style={styles.copyText}>Copy overlay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reload} style={styles.reloadBtn}>
            <Text style={styles.reloadText}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!process.env.EXPO_PUBLIC_CONTROL_URL && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Using default control URL. Set EXPO_PUBLIC_CONTROL_URL to customize.</Text>
        </View>
      )}
      {!FIREBASE_DB_URL && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Set EXPO_PUBLIC_FIREBASE_DB_URL to auto-enable Firebase live update.</Text>
        </View>
      )}
      {!!copyStatus && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>{copyStatus}</Text>
        </View>
      )}
      {!!activeRoomId && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Room: {activeRoomId}</Text>
        </View>
      )}

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Can&apos;t load control page</Text>
            <Text style={styles.errorSub}>Check your internet connection or update the URL in index.tsx</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reload}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ uri: controlUrl }}
            style={styles.webview}
            injectedJavaScriptBeforeContentLoaded={injectedBootstrap}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}

        {/* Loading overlay */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4F8EF7" />
            <Text style={styles.loadingText}>Loading control panel...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0f0f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2a',
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F8EF7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  reloadBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reloadText: {
    fontSize: 20,
    color: '#4F8EF7',
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: '#2f446f',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signOutText: {
    color: '#8eb7ff',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBtn: {
    borderWidth: 1,
    borderColor: '#2f446f',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyText: {
    color: '#8eb7ff',
    fontSize: 12,
    fontWeight: '600',
  },
  noticeBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#16161f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2a',
  },
  noticeText: {
    color: '#8e8ea5',
    fontSize: 12,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0f0f14',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0f14',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0f14',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666680',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: '#666680',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#4F8EF7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});