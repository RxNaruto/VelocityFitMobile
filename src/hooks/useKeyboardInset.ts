import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';

/**
 * Height currently covered by the software keyboard, or 0 while it is closed.
 *
 * Android draws edge-to-edge, so the window is never resized when the keyboard
 * opens and it simply covers whatever is at the bottom of the screen. Scroll
 * containers have to reserve this space themselves or the content underneath
 * stays unreachable.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    // Both platforms re-fire the show event when the keyboard swaps size (the
    // numeric pad is shorter than the full keyboard), so height changes are
    // covered without also listening for frame changes — those keep reporting
    // a height while the keyboard slides away and would strand the padding.
    const onShow = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setInset(e.endCoordinates?.height ?? 0)
    );
    const onHide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setInset(0)
    );

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return inset;
}