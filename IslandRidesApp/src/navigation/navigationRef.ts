import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './routes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();