import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { securityApi, personnelApi } from '../../services/api';
import { useColorScheme } from 'react-native';
import { CameraView, Camera } from 'expo-camera/next';
import dayjs from 'dayjs';

export const SecurityScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { personnel, fetchPersonnelProfile, token } = useAuthStore();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [pointageType, setPointageType] = useState<'entree' | 'sortie'>('entree');

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#3b82f6',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    success: '#22c55e',
    danger: '#ef4444',
  };

  useEffect(() => {
    if (!token) {
      navigation.replace('Login');
      return;
    }

    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
    fetchPersonnelProfile();
  }, [token]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setScanning(true);

    try {
      const response = await securityApi.scanBadge(data, pointageType);
      setScanResult(response.data);
      setShowResultModal(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors du scan';
      Alert.alert('Erreur', message);
    } finally {
      setScanning(false);
      setScanned(false);
      // Reset scanner after a delay
      setTimeout(() => {
        setScanned(false);
      }, 3000);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setScanResult(null);
    setShowResultModal(false);
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>Demande d'autorisation de caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>Accès à la caméra refusé</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.buttonText}>Demander la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Scanner un badge</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Pointage Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            { backgroundColor: pointageType === 'entree' ? colors.primary : colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setPointageType('entree')}
        >
          <Text style={[styles.typeButtonText, { color: pointageType === 'entree' ? '#fff' : colors.text }]}>Entrée</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            { backgroundColor: pointageType === 'sortie' ? colors.primary : colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setPointageType('sortie')}
        >
          <Text style={[styles.typeButtonText, { color: pointageType === 'sortie' ? '#fff' : colors.text }]}>Sortie</Text>
        </TouchableOpacity>
      </View>

      {/* Scanner Info */}
      <View style={styles.infoBanner}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Sécurité: Scannez le QR code du badge du personnel pour enregistrer le pointage
        </Text>
        {personnel && (
          <Text style={[styles.securityInfo, { color: colors.text }]}>
            Sécurité connecté: {personnel.prenom} {personnel.nom}
          </Text>
        )}
      </View>

      {/* Camera Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
        />
      </View>

      {scanning && (
        <View style={styles.scanningOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.scanningText, { color: colors.text }]}>Scan en cours...</Text>
        </View>
      )}

      {/* Result Modal */}
      <Modal visible={showResultModal} animationType="slide" transparent={true} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.resultModal, { backgroundColor: colors.surface }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {scanResult?.message?.includes('succès') ? '✅ Pointage enregistré' : '⚠️ Erreur de pointage'}
              </Text>
              <TouchableOpacity onPress={resetScan}>
                <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {scanResult && (
              <View style={styles.resultContent}>
                {scanResult.personnel && (
                  <>
                    <View style={styles.personnelInfo}>
                      <Text style={[styles.personnelName, { color: colors.text }]}>
                        {scanResult.personnel.prenom} {scanResult.personnel.nom}
                      </Text>
                      <Text style={[styles.personnelIM, { color: colors.textSecondary }]}>
                        IM: {scanResult.personnel.IM}
                      </Text>
                    </View>

                    {scanResult.pointage && (
                      <View style={styles.pointageInfo}>
                        <Text style={[styles.pointageLabel, { color: colors.textSecondary }]}>Heure d'entrée</Text>
                        <Text style={[styles.pointageValue, { color: colors.text }]}>
                          {scanResult.pointage.heure_entree || '--:--'}
                        </Text>
                        <Text style={[styles.pointageLabel, { color: colors.textSecondary }]}>Heure de sortie</Text>
                        <Text style={[styles.pointageValue, { color: colors.text }]}>
                          {scanResult.pointage.heure_sortie || '--:--'}
                        </Text>
                        {scanResult.pointage.status && (
                          <>
                            <Text style={[styles.pointageLabel, { color: colors.textSecondary }]}>Statut</Text>
                            <Text style={[styles.pointageValue, { color: scanResult.pointage.status === 'En retard' ? colors.danger : colors.success }]}>
                              {scanResult.pointage.status}
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={resetScan}
            >
              <Text style={styles.modalButtonText}>Scanner un autre badge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    zIndex: 10,
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
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBanner: {
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  securityInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  resultContent: {
    padding: 20,
  },
  personnelInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  personnelName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  personnelIM: {
    fontSize: 14,
  },
  pointageInfo: {
    gap: 12,
  },
  pointageLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  pointageValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
