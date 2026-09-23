import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { personnelApi } from '../../services/api';
import { useColorScheme } from 'react-native';
import dayjs from 'dayjs';

interface Absence {
  id: number;
  date_debut: string;
  date_fin: string;
  annee: number;
  lieu: string;
  motif: string;
  etat: string;
}

export const EmployeeHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { user, personnel, token, logout, fetchPersonnelProfile } = useAuthStore();

  const [todayPointage, setTodayPointage] = useState<any>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#3b82f6',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch today's pointage and recent absences
      const absencesRes = await personnelApi.getMyAbsences({ per_page: 5 });
      setAbsences(absencesRes?.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPersonnelProfile();
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const getStatusBadge = (etat: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'En attente': { color: colors.warning, label: 'En attente' },
      'Acceptée': { color: colors.success, label: 'Acceptée' },
      'Refusée': { color: colors.danger, label: 'Refusée' },
    };
    const status = statusMap[etat] || { color: colors.textSecondary, label: etat };
    return (
      <View style={[styles.badge, { backgroundColor: `${status.color}20` }]}>
        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
      </View>
    );
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  useEffect(() => {
    if (!token) {
      navigation.replace('Login');
      return;
    }
    fetchPersonnelProfile().then(() => fetchData());
  }, [token]);

  const userName = `${personnel?.prenom || ''} ${personnel?.nom || ''}`.trim() || user?.name || 'Utilisateur';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userName.split(' ').map(n => n?.[0]).join('')}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                {personnel?.role === 'employee' ? 'Employé' : 'Personnel de sécurité'}
              </Text>
            </View>
            
            <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)} style={styles.settingsButton}>
              <Text style={[styles.settingsText, { color: colors.textSecondary }]}>•••</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.dashboardGrid}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('EmployeeBadge' as never)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardEmoji}>🧾</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mon badge</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Voir et imprimer mon QR code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('EmployeeAbsence' as never)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardEmoji}>📅</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Demande d'absence</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Demander un congé</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Absences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes demandes d'absence</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EmployeeAbsence' as never)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir toutes</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : absences.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune demande d'absence</Text>
            </View>
          ) : (
            <View style={styles.absenceList}>
              {absences.slice(0, 3).map((absence) => (
                <View key={absence.id} style={[styles.absenceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.absenceInfo}>
                    <Text style={[styles.absencePeriod, { color: colors.text }]}>
                      {formatDate(absence.date_debut)} - {formatDate(absence.date_fin)}
                    </Text>
                    <Text style={[styles.absenceMotif, { color: colors.textSecondary }]}>{absence.motif}</Text>
                  </View>
                  {getStatusBadge(absence.etat)}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.danger }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  settingsText: {
    fontSize: 20,
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 120,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  absenceList: {
    gap: 12,
  },
  absenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  absenceInfo: {
    flex: 1,
  },
  absencePeriod: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  absenceMotif: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
