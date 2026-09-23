import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  EmployeeHome: undefined;
  EmployeeBadge: undefined;
  EmployeeAbsence: undefined;
  SecurityScan: undefined;
  SecurityAbsence: undefined;
  Settings: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
