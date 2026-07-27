import { Redirect, Slot } from 'expo-router';
import { FEATURES } from '../../config/features';

export default function AdminLayout() {
  if (!FEATURES.ADMIN_APP_ENABLED) {
    return <Redirect href="/profile" />;
  }

  return <Slot />;
}
