import { useCallback, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Asks for confirmation before the hardware back button closes the app.
 * Only attach this to root screens — anywhere else back should navigate.
 */
export function useExitConfirm(): void {
  const promptOpen = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const dismiss = () => {
        promptOpen.current = false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (promptOpen.current) return true;
        promptOpen.current = true;

        Alert.alert(
          'Exit Velocity Fit?',
          'Are you sure you want to close the app?',
          [
            { text: 'Stay', style: 'cancel', onPress: dismiss },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => {
                dismiss();
                BackHandler.exitApp();
              },
            },
          ],
          { onDismiss: dismiss }
        );

        return true;
      });

      return () => {
        promptOpen.current = false;
        subscription.remove();
      };
    }, [])
  );
}
