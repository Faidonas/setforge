import {
  forwardRef,
  type ComponentType,
  type RefAttributes,
} from 'react';
import {
  Platform,
  TextInput,
  type TextInputProps,
} from 'react-native';

type WebTextInputProps = TextInputProps & {
  dataSet?: Record<string, string>;
};

const WebTextInput = TextInput as unknown as ComponentType<
  WebTextInputProps & RefAttributes<TextInput>
>;

/**
 * Text input for search, workout, profile, and dashboard forms.
 *
 * Browsers and password-manager extensions may ignore autocomplete="off" and
 * inject the signed-in email into unrelated fields. The web-only token and
 * data attributes below make the field explicitly non-credential while native
 * platforms keep their normal no-autofill behavior.
 */
export const NonCredentialTextInput = forwardRef<TextInput, TextInputProps>(
  function NonCredentialTextInput(props, ref) {
    return (
      <WebTextInput
        {...props}
        autoComplete={Platform.OS === 'web' ? 'one-time-code' : 'off'}
        dataSet={
          Platform.OS === 'web'
            ? {
                '1p-ignore': 'true',
                bwignore: 'true',
                lpignore: 'true',
              }
            : undefined
        }
        importantForAutofill="no"
        ref={ref}
        textContentType="none"
      />
    );
  },
);
