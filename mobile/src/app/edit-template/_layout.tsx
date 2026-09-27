import { Slot } from 'expo-router';

import { CreateTemplateDraftProvider } from '@/features/workouts/create-template/create-template-draft-context';

export default function EditTemplateLayout() {
  return (
    <CreateTemplateDraftProvider>
      <Slot />
    </CreateTemplateDraftProvider>
  );
}
