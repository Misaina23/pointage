import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { personnelApi } from '../../services/api';
import { useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

interface Absence {
  id: number;
  personnel_id: number;
  date_debut: string;
  date_fin: string;
  annee: number;
  lieu: string;
  motif: string;
  etat: string;
  created_at: string;
}

export const EmployeeAbsenceScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { personnel, fetchPersonnelProfile } = useAuthStore();

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    date_debut: new Date(),
    date_fin: new Date(),
    annee: new Date().getFullYear().toString(),
    lieu: '',
    motif: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#3b82f6',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  };

  const fetchAbsences = async () => {
    if (!personnel) {
      await fetchPersonnelProfile();
    }

    setLoading(true);
    try {
      const response = await personnelApi.getMyAbsences({ per_page: 50 });
      setAbsences(response.data.data);
    } catch (error) {
      console.error('Failed to fetch absences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAbsence = async () => {
    setErrors({});
    setSubmitting(true);

    try {
      const data = {
        date_debut: dayjs(formData.date_debut).format('YYYY-MM-DD'),
        date_fin: dayjs(formData.date_fin).format('YYYY-MM-DD'),
        annee: parseInt(formData.annee),
        lieu: formData.lieu,
        motif: formData.motif,
      };

      await personnelApi.createAbsence(data);
      Alert.alert('Succès', 'Demande d\'absence créée avec succès');
      setShowCreateModal(false);
      setErrors({});
      fetchAbsences();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer la demande');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const [showDatePicker, setShowDatePicker] = useState<'date_debut' | 'date_fin' | null>(null);

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate && showDatePicker) {
      const field = showDatePicker;
      setFormData({ ...formData, [field]: selectedDate });
      setShowDatePicker(null);
    } else {
      setShowDatePicker(null);
    }
  };

  const openDatePicker = (field: 'date_debut' | 'date_fin') => {
    setShowDatePicker(field);
  };

  const getStatusBadge = (etat: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'En attente': { color: colors.warning, label: 'En attente' },
      'Acceptée': { color: colors.success, label: 'Acceptée' },
      'Refusée': { color: colors.error, label: 'Refusée' },
    };
    const status = statusMap[etat] || { color: colors.textSecondary, label: etat };
    return (
      <View style={[styles.badge, { backgroundColor: `${status.color}20` }]}>
        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
      </View>
    );
  };

  useEffect(() => {
    fetchAbsences();
  }, [personnel]);

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide" transparent={true} statusBarTranslucent>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle demande d'absence</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalForm}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Date de début *</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => openDatePicker('date_debut')}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {dayjs(formData.date_debut).format('DD/MM/YYYY')}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Date de fin *</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => openDatePicker('date_fin')}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {dayjs(formData.date_fin).format('DD/MM/YYYY')}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData[showDatePicker]}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Année *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="2024"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.annee}
                  onChangeText={(v) => setFormData({ ...formData, annee: v })}
                  keyboardType="numeric"
                />
                {errors.annee && <Text style={styles.errorText}>{errors.annee[0]}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Lieu *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Lieu de destination"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.lieu}
                  onChangeText={(v) => setFormData({ ...formData, lieu: v })}
                />
                {errors.lieu && <Text style={styles.errorText}>{errors.lieu[0]}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Motif *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Motif de l'absence"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.motif}
                  onChangeText={(v) => setFormData({ ...formData, motif: v })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.motif && <Text style={styles.errorText}>{errors.motif[0]}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateAbsence}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Soumettre</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Demandes d'absence</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Nouvelle demande</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : absences.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune demande d'absence</Text>
          </View>
        ) : (
          <View style={styles.absenceList}>
            {absences.map((absence) => (
              <View key={absence.id} style={[styles.absenceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.absenceHeader}>
                  <Text style={[styles.absencePeriod, { color: colors.text }]}>
                    {dayjs(absence.date_debut).format('DD/MM/YYYY')} - {dayjs(absence.date_fin).format('DD/MM/YYYY')}
                  </Text>
                  {getStatusBadge(absence.etat)}
                </View>
                <View style={styles.absenceDetails}>
                  <Text style={[styles.absenceLieu, { color: colors.textSecondary }]}>📍 {absence.lieu}</Text>
                  <Text style={[styles.absenceMotif, { color: colors.text }]}>{absence.motif}</Text>
                  <Text style={[styles.absenceDate, { color: colors.textSecondary }]}>
                    Demandé le {dayjs(absence.created_at).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {renderCreateModal()}
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
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  absenceList: {
    gap: 16,
  },
  absenceItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  absenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  absencePeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  absenceDetails: {
    gap: 4,
  },
  absenceLieu: {
    fontSize: 14,
  },
  absenceMotif: {
    fontSize: 12,
  },
  absenceDate: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    maxHeight: '80%',
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalForm: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dateButton: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});
