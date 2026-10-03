import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutSet } from '@/models/workout-session';
import { getWorkoutSession, updateWorkoutSession } from '@/services/workout-session-api';

type EditableSet = WorkoutSet & { clientId: string; repsText: string; weightText: string; timeText: string };
type EditableExercise = Omit<WorkoutSessionExercise, 'sets'> & { clientId: string; sets: EditableSet[] };

let sequence = 0;
function clientId(prefix: string) { sequence += 1; return `${prefix}-${sequence}`; }

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workoutId = Number(id);
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(workoutId) || workoutId <= 0) return;
    let current = true;
    getWorkoutSession(workoutId)
      .then((loaded) => {
        if (!current) return;
        setWorkout(loaded);
        setName(loaded.name);
        setNotes(loaded.notes ?? '');
        setExercises(loaded.exercises.map(toEditableExercise));
      })
      .catch((loadError: unknown) => {
        if (current) setError(loadError instanceof Error ? loadError.message : 'Could not load the workout.');
      })
      .finally(() => { if (current) setIsLoading(false); });
    return () => { current = false; };
  }, [workoutId]);

  const updateSet = (exerciseClientId: string, setClientId: string, field: 'repsText' | 'weightText' | 'timeText', value: string) => {
    setExercises((current) => current.map((exercise) => exercise.clientId === exerciseClientId
      ? { ...exercise, sets: exercise.sets.map((set) => set.clientId === setClientId ? { ...set, [field]: value } : set) }
      : exercise));
  };

  const toggleSet = (exerciseClientId: string, setClientId: string) => {
    setExercises((current) => current.map((exercise) => exercise.clientId === exerciseClientId
      ? { ...exercise, sets: exercise.sets.map((set) => set.clientId === setClientId ? { ...set, completed: !set.completed } : set) }
      : exercise));
  };

  const addSet = (exerciseClientId: string) => {
    setExercises((current) => current.map((exercise) => {
      if (exercise.clientId !== exerciseClientId) return exercise;
      const previous = exercise.sets[exercise.sets.length - 1];
      const next: EditableSet = {
        ...(previous ?? {
          id: 0,
          position: 0,
          setType: 'NORMAL' as const,
          completed: false,
          repsText: exercise.exerciseType === 'WEIGHT_AND_REPS' ? '10' : '',
          weightText: '',
          timeText: exercise.exerciseType === 'TIMED' ? '30' : '',
        }),
        id: 0,
        clientId: clientId('set'),
        position: exercise.sets.length,
        completed: false,
        completedAt: undefined,
      };
      return { ...exercise, sets: [...exercise.sets, next] };
    }));
  };

  const removeSet = (exerciseClientId: string, setClientId: string) => {
    setExercises((current) => current.map((exercise) => exercise.clientId === exerciseClientId && exercise.sets.length > 1
      ? { ...exercise, sets: exercise.sets.filter((set) => set.clientId !== setClientId) }
      : exercise));
  };

  const removeExercise = (exercise: EditableExercise) => {
    Alert.alert('Remove exercise?', `${exercise.exerciseName} will be removed from this saved workout.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setExercises((current) => current.filter((item) => item.clientId !== exercise.clientId)) },
    ]);
  };

  const save = async () => {
    if (!name.trim()) { setError('Workout name is required.'); return; }
    try {
      setIsSaving(true);
      setError(null);
      await updateWorkoutSession(workoutId, {
        name: name.trim(),
        notes: notes.trim() || undefined,
        exercises: exercises.map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exerciseId,
          notes: exercise.notes,
          sets: exercise.sets.map((set) => ({
            id: set.id || undefined,
            setType: set.setType,
            targetReps: set.targetReps,
            targetWeight: set.targetWeight,
            targetTimeSeconds: set.targetTimeSeconds,
            restSeconds: set.restSeconds,
            reps: optionalNumber(set.repsText),
            weight: optionalNumber(set.weightText),
            timeSeconds: optionalNumber(set.timeText),
            completed: set.completed,
          })),
        })),
      });
      router.replace('/history');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update the workout.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!Number.isInteger(workoutId) || workoutId <= 0) return <State message="Invalid workout identifier." onBack={() => router.back()} />;
  if (isLoading) return <State loading message="Loading workout..." />;
  if (!workout) return <State message={error ?? 'Workout not found.'} onBack={() => router.back()} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Close editor" onPress={() => router.back()} style={styles.headerSide}><Text style={styles.close}>×</Text></Pressable>
            <Text style={styles.headerTitle}>Edit Workout</Text>
            <Pressable disabled={isSaving} onPress={() => void save()} style={[styles.saveButton, isSaving && styles.disabled]}>
              {isSaving ? <ActivityIndicator color={SetForgeColors.canvas} size="small" /> : <Text style={styles.saveLabel}>SAVE</Text>}
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>WORKOUT NAME</Text>
            <TextInput maxLength={100} onChangeText={setName} style={styles.nameInput} value={name} />
            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput multiline onChangeText={setNotes} placeholder="Workout notes" placeholderTextColor={SetForgeColors.textDisabled} style={styles.notesInput} value={notes} />

            {exercises.map((exercise, exerciseIndex) => {
              const timed = exercise.exerciseType === 'TIMED';
              return (
                <View key={exercise.clientId} style={styles.exerciseBlock}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseCopy}><Text style={styles.exerciseName}>{exerciseIndex + 1}. {exercise.exerciseName}</Text><Text style={styles.exerciseMeta}>{exercise.primaryMuscle} · {exercise.equipment}</Text></View>
                    <Pressable accessibilityLabel={`Remove ${exercise.exerciseName}`} onPress={() => removeExercise(exercise)}><Text style={styles.removeExercise}>×</Text></Pressable>
                  </View>
                  <View style={styles.setHeader}>
                    <Text style={[styles.columnLabel, styles.numberColumn]}>SET</Text>
                    {!timed && <Text style={styles.columnLabel}>KG</Text>}
                    <Text style={styles.columnLabel}>{timed ? 'TIME' : 'REPS'}</Text>
                    <View style={styles.checkColumn} />
                  </View>
                  {exercise.sets.map((set, index) => (
                    <View key={set.clientId} style={styles.setRow}>
                      <Pressable disabled={exercise.sets.length === 1} onLongPress={() => removeSet(exercise.clientId, set.clientId)} style={[styles.setNumber, styles.numberColumn]}><Text style={styles.setNumberText}>{index + 1}</Text></Pressable>
                      {!timed && <Input value={set.weightText} onChange={(value) => updateSet(exercise.clientId, set.clientId, 'weightText', value)} />}
                      <Input value={timed ? set.timeText : set.repsText} onChange={(value) => updateSet(exercise.clientId, set.clientId, timed ? 'timeText' : 'repsText', value)} />
                      <Pressable onPress={() => toggleSet(exercise.clientId, set.clientId)} style={[styles.checkButton, set.completed && styles.checked]}><Text style={[styles.checkText, set.completed && styles.checkedText]}>✓</Text></Pressable>
                    </View>
                  ))}
                  <Pressable onPress={() => addSet(exercise.clientId)}><Text style={styles.addSet}>+ ADD SET</Text></Pressable>
                </View>
              );
            })}
            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function toEditableExercise(exercise: WorkoutSessionExercise): EditableExercise {
  return { ...exercise, clientId: clientId('exercise'), sets: exercise.sets.map((set) => ({ ...set, clientId: clientId('set'), repsText: set.reps?.toString() ?? '', weightText: set.weight?.toString() ?? '', timeText: set.timeSeconds?.toString() ?? '' })) };
}
function optionalNumber(value: string) { const normalized = value.trim().replace(',', '.'); if (!normalized) return undefined; const parsed = Number(normalized); return Number.isFinite(parsed) ? parsed : undefined; }
function Input({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <TextInput keyboardType="decimal-pad" maxLength={7} onChangeText={onChange} placeholder="—" placeholderTextColor={SetForgeColors.textDisabled} selectTextOnFocus style={styles.setInput} value={value} />; }
function State({ message, loading, onBack }: { message: string; loading?: boolean; onBack?: () => void }) { return <SafeAreaView style={styles.safeArea}><View style={styles.state}>{loading && <ActivityIndicator color={SetForgeColors.accent} />}<Text style={styles.stateText}>{message}</Text>{onBack && <Pressable onPress={onBack}><Text style={styles.stateAction}>GO BACK</Text></Pressable>}</View></SafeAreaView>; }

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas }, screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: SetForgeColors.border, backgroundColor: SetForgeColors.surface },
  headerSide: { width: 68 }, close: { color: SetForgeColors.textSecondary, fontSize: 30 }, headerTitle: { flex: 1, color: SetForgeColors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  saveButton: { width: 68, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: SetForgeColors.accent }, saveLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' }, disabled: { opacity: 0.5 },
  content: { paddingTop: 18, paddingBottom: 40 }, fieldLabel: { marginHorizontal: 20, marginBottom: 6, color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 9, fontWeight: '800' },
  nameInput: { height: 45, marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surface, color: SetForgeColors.textPrimary, fontSize: 14, fontWeight: '700' },
  notesInput: { minHeight: 70, marginHorizontal: 20, marginBottom: 18, padding: 12, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surface, color: SetForgeColors.textPrimary, fontSize: 13, textAlignVertical: 'top' },
  exerciseBlock: { gap: 11, padding: 20, borderTopWidth: 1, borderTopColor: SetForgeColors.border }, exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' }, exerciseCopy: { flex: 1, gap: 3 },
  exerciseName: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' }, exerciseMeta: { color: SetForgeColors.textSecondary, fontSize: 10, textTransform: 'capitalize' }, removeExercise: { color: SetForgeColors.textSecondary, fontSize: 27 },
  setHeader: { flexDirection: 'row', gap: 8 }, columnLabel: { flex: 1, color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 8, fontWeight: '700', textAlign: 'center' }, numberColumn: { width: 43, flexGrow: 0, flexShrink: 0 }, checkColumn: { width: 45 },
  setRow: { height: 47, flexDirection: 'row', alignItems: 'center', gap: 8 }, setNumber: { height: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7 }, setNumberText: { color: SetForgeColors.accent, fontFamily: 'monospace', fontWeight: '800' },
  setInput: { flex: 1, minWidth: 0, height: 45, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surface, color: SetForgeColors.textPrimary, fontFamily: 'monospace', textAlign: 'center' },
  checkButton: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surface }, checked: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accent }, checkText: { color: SetForgeColors.textDisabled, fontSize: 18, fontWeight: '900' }, checkedText: { color: SetForgeColors.canvas }, addSet: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 11, fontWeight: '800' },
  error: { margin: 20, padding: 12, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#FCA5A5', fontSize: 12 }, state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }, stateText: { color: SetForgeColors.textSecondary, textAlign: 'center' }, stateAction: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
});
