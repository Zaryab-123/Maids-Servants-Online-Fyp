/**
 * Web platform layer – the single import surface used by converted screens.
 */
export { sx, imgSrc, StyleSheet, RESIZE } from './style';
export { Platform, Dimensions, Alert, PermissionsAndroid, Keyboard } from './platform';
export { Spinner, ScrollView, ListView, Dialog, Toggle, RefreshControl, TextBox } from './components';

/** RN onPress → DOM onClick. Stops propagation so nested touchables behave
 *  like React Native (only the innermost pressable fires). */
export const press = (handler) => (e) => {
  if (e && e.stopPropagation) e.stopPropagation();
  if (typeof handler === 'function') return handler(e);
  return undefined;
};

/** RN onChangeText(text) → DOM onChange(event). */
export const changeText = (handler) => (e) => {
  if (typeof handler === 'function') handler(e.target.value);
};

/** RN onSubmitEditing → Enter key on single-line inputs. */
export const submitOnEnter = (handler) => (e) => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && typeof handler === 'function') {
    e.preventDefault();
    handler({ nativeEvent: { text: e.target.value } });
  }
};

/** RN TextInput keyboard/secure/editable props → HTML input attributes. */
export const tin = ({ secureTextEntry, keyboardType, autoCapitalize, autoCorrect, editable, returnKeyType, autoComplete } = {}) => {
  const out = {};
  if (secureTextEntry) out.type = 'password';
  else if (keyboardType === 'email-address') out.type = 'email';
  else if (keyboardType === 'phone-pad') out.type = 'tel';
  if (keyboardType === 'numeric' || keyboardType === 'number-pad') out.inputMode = 'numeric';
  if (keyboardType === 'decimal-pad') out.inputMode = 'decimal';
  if (keyboardType === 'phone-pad') out.inputMode = 'tel';
  if (keyboardType === 'email-address') out.inputMode = 'email';
  if (autoCapitalize) out.autoCapitalize = autoCapitalize === 'none' ? 'off' : autoCapitalize;
  if (autoCorrect === false) out.autoCorrect = 'off';
  if (editable === false) out.readOnly = true;
  if (returnKeyType) out.enterKeyHint = { done: 'done', go: 'go', next: 'next', search: 'search', send: 'send' }[returnKeyType];
  if (autoComplete) out.autoComplete = autoComplete;
  return out;
};
