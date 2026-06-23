import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAppSelector } from '../store/store';

import { SplashScreen } from '../screens/auth/SplashScreen';
import { AdminLoginScreen } from '../screens/auth/AdminLoginScreen';
import { CollectorPhoneCheckScreen } from '../screens/auth/CollectorPhoneCheckScreen';
import { CollectorPINScreen } from '../screens/auth/CollectorPINScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AllCollectionsScreen } from '../screens/admin/AllCollectionsScreen';
import { CreateCollectionScreen } from '../screens/admin/CreateCollectionScreen';
import { CollectionDetailScreen } from '../screens/admin/CollectionDetailScreen';
import { VillagerPaymentDetailScreen } from '../screens/admin/VillagerPaymentDetailScreen';
import { VillagersScreen } from '../screens/admin/VillagersScreen';
import { CollectorsScreen } from '../screens/admin/CollectorsScreen';
import { SettingsScreen } from '../screens/admin/SettingsScreen';
import { CollectorDashboardScreen } from '../screens/collector/CollectorDashboardScreen';
import { CollectorCollectionDetailScreen } from '../screens/collector/CollectorCollectionDetailScreen';
import { RecordPaymentScreen } from '../screens/collector/RecordPaymentScreen';
import { PublicCollectionViewScreen } from '../screens/public/PublicCollectionViewScreen';
import { VillagerHistoryScreen } from '../screens/public/VillagerHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0E1A',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Poppins_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Villagers"
        component={VillagersScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Collectors"
        component={CollectorsScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="account-tie" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0E1A' } }}>
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="CollectorPhoneCheck" component={CollectorPhoneCheckScreen} />
      <Stack.Screen name="CollectorPIN" component={CollectorPINScreen} />
      <Stack.Screen name="PublicCollectionView" component={PublicCollectionViewScreen} />
      <Stack.Screen name="VillagerHistory" component={VillagerHistoryScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E1A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminTabs} />
      <Stack.Screen name="AllCollections" component={AllCollectionsScreen} />
      <Stack.Screen
        name="CreateCollection"
        component={CreateCollectionScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
      <Stack.Screen name="VillagerPaymentDetail" component={VillagerPaymentDetailScreen} />
    </Stack.Navigator>
  );
}

function CollectorStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0E1A' },
      }}
    >
      <Stack.Screen name="CollectorDashboard" component={CollectorDashboardScreen} />
      <Stack.Screen name="CollectorCollectionDetail" component={CollectorCollectionDetailScreen} />
      <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { isLoggedIn, role } = useAppSelector((state) => state.auth);
  const { pinVerified } = useAppSelector((state) => state.collector);
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
        <AuthStack />
      ) : role === 'admin' ? (
        <AdminStack />
      ) : pinVerified ? (
        <CollectorStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
