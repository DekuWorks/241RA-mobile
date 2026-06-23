import { NativeModules } from 'react-native';

/** True when the custom dev client includes linked @rnmapbox/maps native code. */
export function isMapboxNativeAvailable(): boolean {
  return NativeModules.RNMBXModule != null;
}
