import { Platform } from 'react-native';

// For Android emulator, host machine is accessible via 10.0.2.2
// For iOS simulator, host machine is localhost
// For physical devices, set your LAN IP (e.g. 192.168.1.100)
const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const CONFIG = {
  API_URL: `http://${defaultHost}:5001/api`,
  WS_URL: `http://${defaultHost}:5001`,
};

