import { Redirect, Slot } from 'expo-router';
import { FEATURES } from '../../config/features';

export default function PortalLayout() {
  if (!FEATURES.ADMIN_APP_ENABLED) {
    return <Redirect href="/profile" />;
  }

  return <Slot />;
}
