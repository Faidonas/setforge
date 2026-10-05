import { Stack } from 'expo-router';

import { CreateTemplateDraftProvider } from '@/features/workouts/create-template/create-template-draft-context';

export default function CreateTemplateLayout() {
  return (
    <CreateTemplateDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CreateTemplateDraftProvider>
  );
}
