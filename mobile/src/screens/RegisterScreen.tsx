import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useColorScheme } from 'react-native';

export const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { registerPersonnel, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    IM: '',
    service: '',
    grade: '',
    corp: '',
    fonction: '',
    direction_id: '',
    role: 'employee',
    password: '',
    password_confirmation: '',
  });
  
  const [directions, setDirections] = useState<Array<{id: number, nom: string}>>([]);
  const [showPassword, setShowPassword] = useState(false);

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      clearError();
      const personnelData = {
        ...formData,
        direction_id: formData.direction_id ? parseInt(formData.direction_id) : 1,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      };
      await registerPersonnel(personnelData);
      
      const { personnel } = useAuthStore.getState();
      if (personnel?.role === 'security') {
        navigation.replace('SecurityScan');
      } else {
        navigation.replace('EmployeeHome');
      }
    } catch (err) {
      // Error handled in store
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, role });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Inscription</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Créer votre compte personnel
          </Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Rôle *</Text>
            <TouchableOpacity
              style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                Alert.alert(
                  'Sélectionner un rôle',
                  'Choisissez le rôle du personnel',
                  [
                    { text: 'Employé', onPress: () => handleRoleChange('employee') },
                    { text: 'Personnel de sécurité', onPress: () => handleRoleChange('security') },
                    { text: 'Annuler', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {formData.role === 'security' ? 'Personnel de sécurité' : 'Employé'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Nom *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Dupont"
                placeholderTextColor={colors.textSecondary}
                value={formData.nom}
                onChangeText={(v) => handleInputChange('nom', v)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Prénom *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Jean"
                placeholderTextColor={colors.textSecondary}
                value={formData.prenom}
                onChangeText={(v) => handleInputChange('prenom', v)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="jean.dupont@email.com"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(v) => handleInputChange('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>IM (Identifiant Matricule) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="IM123456"
              placeholderTextColor={colors.textSecondary}
              value={formData.IM}
              onChangeText={(v) => handleInputChange('IM', v)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Service *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Service..."
                placeholderTextColor={colors.textSecondary}
                value={formData.service}
                onChangeText={(v) => handleInputChange('service', v)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Grade *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Grade..."
                placeholderTextColor={colors.textSecondary}
                value={formData.grade}
                onChangeText={(v) => handleInputChange('grade', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Corps *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Corps..."
                placeholderTextColor={colors.textSecondary}
                value={formData.corp}
                onChangeText={(v) => handleInputChange('corp', v)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Fonction *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Fonction..."
                placeholderTextColor={colors.textSecondary}
                value={formData.fonction}
                onChangeText={(v) => handleInputChange('fonction', v)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mot de passe *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={formData.password}
                onChangeText={(v) => handleInputChange('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                <Text style={[{ color: colors.textSecondary }]}>{showPassword ? 'Masquer' : 'Afficher'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={formData.password_confirmation}
              onChangeText={(v) => handleInputChange('password_confirmation', v)}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
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
  pickerContainer: {
    height: 52,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 80,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});