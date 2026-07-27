import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import NativeDevSettings from 'react-native/Libraries/NativeModules/specs/NativeDevSettings';

/**
 * React Native persists "Show Element Inspector" in dev builds. On launch, native
 * code re-enables the overlay when that flag is set. Turn it off after bootstrap.
 */
export function disableElementInspectorOnLaunch(): (() => void) | undefined {
  if (!__DEV__) {
    return;
  }

  let inspectorVisible = false;
  const subscription = RCTDeviceEventEmitter.addListener('toggleElementInspector', () => {
    inspectorVisible = !inspectorVisible;
  });

  const timeout = setTimeout(() => {
    if (inspectorVisible) {
      NativeDevSettings.toggleElementInspector();
    }
    subscription.remove();
  }, 100);

  return () => {
    clearTimeout(timeout);
    subscription.remove();
  };
}
