import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { personnelApi } from '../../services/api';
import { useColorScheme } from 'react-native';
import Svg, { Defs, Rect, Path } from 'react-native-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import dayjs from 'dayjs';

export const EmployeeBadgeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { personnel, fetchPersonnelProfile } = useAuthStore();

  const [badgeData, setBadgeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const viewShotAnyRef = viewShotRef as any;

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#3b82f6',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  const fetchBadge = async () => {
    if (!personnel) {
      await fetchPersonnelProfile();
    }

    setLoading(true);
    try {
      const response = await personnelApi.getBadge();
      setBadgeData(response.data);
    } catch (error) {
      console.error('Failed to fetch badge:', error);
      Alert.alert('Erreur', 'Impossible de charger le badge');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!viewShotRef) return;
    
    try {
      const { uri } = await viewShotAnyRef.current?.capture();
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Erreur', 'Impossible de partager le badge');
    }
  };

  const handleSave = async () => {
    if (!viewShotRef) return;
    
    try {
      const { uri } = await viewShotAnyRef.current?.capture();
      const fileName = `${FileSystem.documentDirectory}badge-${personnel?.qr_code}.png`;
      await FileSystem.copyAsync({ from: uri, to: fileName });
      Alert.alert('Succès', 'Badge enregistré dans la galerie');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le badge');
    }
  };

  // Simple QR code visualization using squares
  const QRCodeDisplay = ({ qrCode }: { qrCode: string }) => {
    const qrSize = 200;
    const boxSize = 10;
    const grid = qrSize / boxSize;
    
    // Generate a deterministic pattern based on QR code
    const getFilled = (i: number, j: number) => {
      const char = qrCode.charCodeAt((i * j) % qrCode.length);
      return (char % 2 === 0);
    };

    return (
      <View style={styles.qrContainer}>
        <Svg width={qrSize} height={qrSize} viewBox={`0 0 ${qrSize} ${qrSize}`}>
          <Defs>
            <Rect x="0" y="0" width={qrSize} height={qrSize} fill="#FFFFFF" />
          </Defs>
          {Array.from({ length: grid }).map((_, i) =>
            Array.from({ length: grid }).map((_, j) => {
              if (getFilled(i, j)) {
                return (
                  <Rect
                    key={`${i}-${j}`}
                    x={j * boxSize}
                    y={i * boxSize}
                    width={boxSize}
                    height={boxSize}
                    fill="#000000"
                  />
                );
              }
              return null;
            })
          )}
          {/* Three positioning squares */}
          <Rect x="0" y="0" width="40" height="40" fill="#000000" />
          <Rect x="0" y="0" width="10" height="10" fill="#FFFFFF" />
          <Rect x="30" y="30" width="10" height="10" fill="#FFFFFF" />
          <Rect x="160" y="0" width="40" height="40" fill="#000000" />
          <Rect x="160" y="0" width="10" height="10" fill="#FFFFFF" />
          <Rect x="190" y="30" width="10" height="10" fill="#FFFFFF" />
          <Rect x="0" y="160" width="40" height="40" fill="#000000" />
          <Rect x="0" y="160" width="10" height="10" fill="#FFFFFF" />
          <Rect x="30" y="190" width="10" height="10" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  };

  useEffect(() => {
    fetchBadge();
  }, [personnel]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mon badge QR</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Badge Card */}
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 0.9 }}
              style={styles.card}
            >
              <View style={styles.badgeContent}>
                <View style={styles.badgeHeader}>
                  <Text style={[styles.badgeTitle, { color: colors.text }]}>Badge de présence</Text>
                  <Text style={[styles.badgeSubtitle, { color: colors.textSecondary }]}>Pointage Mobile</Text>
                </View>

                {/* Badge Image / Initials */}
                <View style={styles.badgePhotoContainer}>
                  {personnel?.photo ? (
                    <Image source={{ uri: personnel.photo }} style={styles.badgePhoto} />
                  ) : (
                    <View style={styles.badgePhotoPlaceholder}>
                      <Text style={styles.badgePhotoText}>
                        {personnel?.prenom?.charAt(0)}{personnel?.nom?.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Personnel Info */}
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeName, { color: colors.text }]}>
                    {personnel?.prenom} {personnel?.nom}
                  </Text>
                  <Text style={[styles.badgeIM, { color: colors.textSecondary }]}>
                    IM: {personnel?.IM}
                  </Text>
                  {personnel?.direction && (
                    <Text style={[styles.badgeDirection, { color: colors.textSecondary }]}>
                      {personnel.direction.nom}
                    </Text>
                  )}
                </View>

                {/* QR Code */}
                <View style={styles.qrCodeContainer}>
                  <QRCodeDisplay qrCode={personnel?.qr_code || ''} />
                </View>

                {/* QR Code Data */}
                <View style={[styles.qrDataContainer, { borderTopColor: colors.border }]}>
                  <Text style={[styles.qrDataLabel, { color: colors.textSecondary }]}>Code QR</Text>
                  <Text style={[styles.qrDataValue, { color: colors.text }]}>{personnel?.qr_code}</Text>
                </View>
              </View>
            </ViewShot>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.actionButtonText}>💾 Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleShare}
              >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>📤 Partager</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Scan QR Button for Security */}
      {personnel?.role === 'security' && (
        <View style={styles.scanButtonContainer}>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SecurityScan' as never)}
          >
            <Text style={styles.scanButtonText}>📷 Scanner un badge</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeContent: {
    alignItems: 'center',
  },
  badgeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeSubtitle: {
    fontSize: 14,
  },
  badgePhotoContainer: {
    marginBottom: 16,
  },
  badgePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  badgePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePhotoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  badgeInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeIM: {
    fontSize: 14,
  },
  badgeDirection: {
    fontSize: 12,
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrDataContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    width: '100%',
  },
  qrDataLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  qrDataValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scanButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
