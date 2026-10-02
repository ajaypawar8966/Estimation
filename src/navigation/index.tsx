import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabBar } from './TabBar';
import {
  EstimationStackParamList,
  HomeStackParamList,
  RootStackParamList,
  TabParamList,
} from './types';
import DashboardScreen from '../screens/DashboardScreen';
import MaterialCalculatorScreen from '../screens/MaterialCalculatorScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import QuickCalculatorScreen from '../screens/QuickCalculatorScreen';
import TourDiaryScreen from '../screens/TourDiaryScreen';
import {
  TourDiaryEntryScreen,
  TourDiaryMonthScreen,
  TourDiaryReportScreen,
} from '../screens/TourDiaryScreens';
import SitePhotosScreen, { SitePhotoAddScreen } from '../screens/SitePhotosScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { DesignStudioScreen } from '../screens/ComingSoonScreen';
import CommunityScreen from '../screens/CommunityScreen';
import { EstimationDetailScreen } from '../screens/EstimationScreens';
import EstimationHomeScreen from '../screens/estimation/EstimationHomeScreen';
import CreateWorkScreen from '../screens/estimation/CreateWorkScreen';
import EstimateDetailScreen from '../screens/estimation/EstimateDetailScreen';
import RatesScreen from '../screens/estimation/RatesScreen';
import ValuationScreen from '../screens/estimation/ValuationScreen';
import {
  ProjectDetailScreen,
  ProjectEditScreen,
  ProjectsScreen,
} from '../screens/estimation/ProjectScreens';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import { useAuth } from '../store/AuthStore';
import { colors } from '../theme';

const Root = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const EstimationStack = createNativeStackNavigator<EstimationStackParamList>();

// React Navigation calls `tabBar` as a function, so wrap it to keep hooks valid.
const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

const stackOptions = { headerShown: false, animation: 'slide_from_right' } as const;

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="MaterialCalculator" component={MaterialCalculatorScreen} />
      <HomeStack.Screen name="Calculator" component={CalculatorScreen} />
      <HomeStack.Screen name="QuickCalculator" component={QuickCalculatorScreen} />
      <HomeStack.Screen name="TourDiary" component={TourDiaryScreen} />
      <HomeStack.Screen name="TourDiaryMonth" component={TourDiaryMonthScreen} />
      <HomeStack.Screen name="TourDiaryReport" component={TourDiaryReportScreen} />
      <HomeStack.Screen name="TourDiaryEntry" component={TourDiaryEntryScreen} />
      <HomeStack.Screen name="SitePhotos" component={SitePhotosScreen} />
      <HomeStack.Screen name="SitePhotoAdd" component={SitePhotoAddScreen} />
      <HomeStack.Screen name="Reports" component={ReportsScreen} />
      <HomeStack.Screen name="Community" component={CommunityScreen} />
      <HomeStack.Screen name="DesignStudio" component={DesignStudioScreen} />
    </HomeStack.Navigator>
  );
}

function EstimationNavigator() {
  return (
    <EstimationStack.Navigator screenOptions={stackOptions}>
      <EstimationStack.Screen name="EstimationHome" component={EstimationHomeScreen} />
      <EstimationStack.Screen name="Valuation" component={ValuationScreen} />
      <EstimationStack.Screen name="CreateWork" component={CreateWorkScreen} />
      <EstimationStack.Screen name="Projects" component={ProjectsScreen} />
      <EstimationStack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <EstimationStack.Screen name="ProjectEdit" component={ProjectEditScreen} />
      <EstimationStack.Screen name="EstimateDetail" component={EstimateDetailScreen} />
      <EstimationStack.Screen name="Rates" component={RatesScreen} />
      <EstimationStack.Screen name="EstimationDetail" component={EstimationDetailScreen} />
    </EstimationStack.Navigator>
  );
}

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

function MainTabs() {
  return (
    <Tabs.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeNavigator} />
      <Tabs.Screen name="Estimation" component={EstimationNavigator} />
      <Tabs.Screen name="Alerts" component={AlertsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { status } = useAuth();
  if (status === 'loading') {
    return null;
  }
  // The app always opens on the dashboard. Sign in/up slide up over it when a
  // signed-out user taps a feature (see requireAuth.ts).
  return (
    <NavigationContainer theme={theme}>
      <Root.Navigator screenOptions={stackOptions}>
        <Root.Screen name="Main" component={MainTabs} />
        <Root.Screen name="EditProfile" component={EditProfileScreen} />
        <Root.Group screenOptions={{ animation: 'slide_from_bottom' }}>
          <Root.Screen name="Login" component={LoginScreen} />
          <Root.Screen name="Signup" component={SignupScreen} />
        </Root.Group>
      </Root.Navigator>
    </NavigationContainer>
  );
}
