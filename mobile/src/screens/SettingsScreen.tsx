import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useColorScheme } from 'react-native';

export const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { user, personnel, logout, token } = useAuthStore();

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#3b82f6',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    danger: '#ef4444',
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleAPISettings = () => {
    Alert.alert(
      'API Configuration',
      `API URL: ${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api'}\n\nConfigurez EXPO_PUBLIC_API_URL dans votre environnement.`,
      [{ text: 'OK' }]
    );
  };

  const displayName = personnel?.prenom 
    ? `${personnel.prenom} ${personnel.nom}` 
    : user?.name || 'Utilisateur';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Paramètres</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {displayName.split(' ').map(n => n?.[0]).join('')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              {personnel && (
                <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                  {personnel.role === 'employee' ? 'Employé' : 'Sécurité'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Settings Items */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingItem} onPress={handleAPISettings}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingEmoji}>🌐</Text>
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Configuration API</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>API locale</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingEmoji}>🔔</Text>
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Activées</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingEmoji}>🎨</Text>
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Thème</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {isDark ? 'Sombre' : 'Clair'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingEmoji}>❔</Text>
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Aide & Support</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Documentation</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={[styles.settingIcon, { backgroundColor: `${colors.danger}15` }]}>
              <Text style={[styles.settingEmoji, { color: colors.danger }]}>🚪</Text>
            </View>
            <Text style={[styles.settingLabel, { color: colors.danger }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Pointage Mobile v1.0.0
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarLargeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingEmoji: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
  },
});
