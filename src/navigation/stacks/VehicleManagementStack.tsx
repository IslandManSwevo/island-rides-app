import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createLazyScreen } from '../LazyScreenWrapper';

// Lazy load heavy screens for better performance
const FleetManagementScreen = createLazyScreen(
  () => import('../../screens/FleetManagementScreen'),
  'Fleet Management'
);

const VehicleConditionTrackerScreen = createLazyScreen(
  () => import('../../screens/VehicleConditionTrackerScreen'),
  'Vehicle Condition'
);

const VehiclePhotoUploadScreen = createLazyScreen(
  () => import('../../screens/VehiclePhotoUploadScreen'),
  'Photo Upload'
);

const VehicleAvailabilityScreen = createLazyScreen(
  () => import('../../screens/VehicleAvailabilityScreen'),
  'Availability'
);

const VehicleDocumentManagementScreen = createLazyScreen(
  () => import('../../screens/VehicleDocumentManagementScreen'),
  'Document Management'
);

const BulkRateUpdateScreen = createLazyScreen(
  () => import('../../screens/BulkRateUpdateScreen'),
  'Rate Update'
);

const CompareVehiclesScreen = createLazyScreen(
  () => import('../../screens/CompareVehiclesScreen'),
  'Compare Vehicles'
);
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ROUTES } from '../routes';
import { VehicleManagementStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<VehicleManagementStackParamList>();

const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 18,
  },
  headerBackTitleVisible: false,
  gestureEnabled: true,
};

export const VehicleManagementStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.FLEET_MANAGEMENT}
    >
      <Stack.Screen
        name={ROUTES.FLEET_MANAGEMENT}
        options={{
          title: 'Fleet Management',
          headerShown: true,
        }}
      >
        {(props) => (
          <ProtectedRoute requiredRole={['host', 'owner']}>
            <FleetManagementScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name={ROUTES.VEHICLE_CONDITION_TRACKER}
        component={VehicleConditionTrackerScreen}
        options={{
          title: 'Vehicle Condition',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name={ROUTES.VEHICLE_PHOTO_UPLOAD}
        component={VehiclePhotoUploadScreen}
        options={{
          title: 'Upload Photos',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name={ROUTES.VEHICLE_AVAILABILITY}
        component={VehicleAvailabilityScreen}
        options={{
          title: 'Availability',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name={ROUTES.VEHICLE_DOCUMENT_MANAGEMENT}
        options={{
          title: 'Documents',
          headerShown: true,
        }}
      >
        {(props) => (
          <ProtectedRoute requiredRole={['host', 'owner']}>
            <VehicleDocumentManagementScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name={ROUTES.BULK_RATE_UPDATE}
        component={BulkRateUpdateScreen}
        options={{
          title: 'Update Rates',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name={ROUTES.COMPARE_VEHICLES}
        component={CompareVehiclesScreen}
        options={{
          title: 'Compare Vehicles',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default VehicleManagementStack;
