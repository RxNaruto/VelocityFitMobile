import { Alert } from 'react-native';

export function showError(message: string, title = 'Error'): void {
  Alert.alert(title, message);
}

export function showSuccess(message: string): void {
  Alert.alert('Success', message);
}

export function showInfo(message: string): void {
  Alert.alert('Notice', message);
}

export function confirm(
  title: string,
  message: string,
  onConfirm: () => void
): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', style: 'destructive', onPress: onConfirm },
  ]);
}
