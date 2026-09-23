import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './store/authStore';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { EmployeeHomeScreen } from './screens/employee/EmployeeHomeScreen';
import { EmployeeBadgeScreen } from './screens/employee/EmployeeBadgeScreen';
import { EmployeeAbsenceScreen } from './screens/employee/EmployeeAbsenceScreen';
import { SecurityScanScreen } from './screens/security/SecurityScanScreen';
import { SecurityAbsenceScreen } from './screens/security/SecurityAbsenceScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    border: '#e2e8f0',
    card: '#ffffff',
  },
};

export default function App() {
  const { initializeAuth } = useAuthStore();

  // Initialize auth on app start
  initializeAuth();

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <NavigationContainer theme={MyTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            {/* Auth Stack */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

            {/* Employee Stack */}
            <Stack.Screen name="EmployeeHome" component={EmployeeHomeScreen} />
            <Stack.Screen name="EmployeeBadge" component={EmployeeBadgeScreen} />
            <Stack.Screen name="EmployeeAbsence" component={EmployeeAbsenceScreen} />

            {/* Security Stack */}
            <Stack.Screen name="SecurityScan" component={SecurityScanScreen} />
            <Stack.Screen name="SecurityAbsence" component={SecurityAbsenceScreen} />

            {/* Settings */}
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});