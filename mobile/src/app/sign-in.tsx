import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import { useAuth } from '@/features/auth/auth-context';

export default function SignInScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(null); setMessage(null);
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  };

  const submit = () => run(async () => {
    if (mode === 'signIn') {
      await auth.signInWithPassword(email, password);
      return;
    }
    if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
    if (password !== confirmPassword) throw new Error('The passwords do not match.');
    const result = await auth.signUpWithPassword(email, password);
    if (result.requiresEmailConfirmation) {
      setMessage('Check your email and confirm your account, then return here to sign in.');
      setMode('signIn');
      setPassword('');
      setConfirmPassword('');
    }
  });

  const switchMode = () => {
    setMode((current) => current === 'signIn' ? 'signUp' : 'signIn');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  };

  const canSubmit = Boolean(
    email && password && auth.configured &&
    (mode === 'signIn' || confirmPassword),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardArea}>
        <ScrollView
          contentContainerStyle={styles.screen}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brand}><Text style={styles.logo}>FORGE</Text><Text style={styles.tagline}>PLAN. PERFORM. PROGRESS.</Text></View>
          <View style={styles.card}>
          <Text style={styles.title}>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>{mode === 'signIn' ? 'Sign in to access your workouts and templates.' : 'Create an account to start tracking your training.'}</Text>
          {!auth.configured ? <Text style={styles.error}>Supabase is not configured in this build.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={SetForgeColors.textDisabled} style={styles.input} value={email} />
          <TextInput autoCapitalize="none" autoComplete={mode === 'signIn' ? 'password' : 'new-password'} onChangeText={setPassword} onSubmitEditing={mode === 'signIn' ? () => void submit() : undefined} placeholder="Password" placeholderTextColor={SetForgeColors.textDisabled} secureTextEntry style={styles.input} value={password} />
          {mode === 'signUp' ? <TextInput autoCapitalize="none" autoComplete="new-password" onChangeText={setConfirmPassword} onSubmitEditing={() => void submit()} placeholder="Confirm password" placeholderTextColor={SetForgeColors.textDisabled} secureTextEntry style={styles.input} value={confirmPassword} /> : null}
          <Pressable disabled={busy || !canSubmit} onPress={() => void submit()} style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed]}>
            {busy ? <ActivityIndicator color={SetForgeColors.canvas} /> : <Text style={styles.primaryText}>{mode === 'signIn' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>}
          </Pressable>
          <View style={styles.accountPrompt}>
            <Text style={styles.accountPromptText}>{mode === 'signIn' ? "Don't have an account?" : 'Already have an account?'}</Text>
            <Pressable disabled={busy} onPress={switchMode}><Text style={styles.accountPromptAction}>{mode === 'signIn' ? 'Sign up' : 'Sign in'}</Text></Pressable>
          </View>
          <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>OR</Text><View style={styles.line} /></View>
          <Pressable disabled={busy || !auth.configured} onPress={() => void run(auth.signInWithGoogle)} style={({ pressed }) => [styles.google, pressed && styles.pressed]}><Text style={styles.googleText}>CONTINUE WITH GOOGLE</Text></Pressable>
          <Text style={styles.invite}>Google can also create your SetForge account the first time you continue.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:SetForgeColors.canvas},keyboardArea:{flex:1},screen:{flexGrow:1,width:'100%',maxWidth:440,alignSelf:'center',justifyContent:'center',padding:24,gap:42},
  brand:{alignItems:'center',gap:7},logo:{color:SetForgeColors.textPrimary,fontSize:38,fontWeight:'900',letterSpacing:-1.2},tagline:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:12,letterSpacing:.35},
  card:{gap:14,padding:22,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:14,backgroundColor:SetForgeColors.surface},title:{color:SetForgeColors.textPrimary,fontSize:25,fontWeight:'900'},subtitle:{marginBottom:5,color:SetForgeColors.textSecondary,fontSize:13,lineHeight:19},
  input:{height:50,paddingHorizontal:14,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:7,backgroundColor:SetForgeColors.surfaceMuted,color:SetForgeColors.textPrimary,fontSize:15},
  primary:{height:50,alignItems:'center',justifyContent:'center',borderRadius:7,backgroundColor:SetForgeColors.accent},primaryText:{color:SetForgeColors.canvas,fontSize:14,fontWeight:'900'},google:{height:48,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border,borderRadius:7},googleText:{color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'800'},pressed:{opacity:.7},
  accountPrompt:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},accountPromptText:{color:SetForgeColors.textSecondary,fontSize:12},accountPromptAction:{color:SetForgeColors.accent,fontSize:12,fontWeight:'800'},
  divider:{flexDirection:'row',alignItems:'center',gap:10},line:{flex:1,height:1,backgroundColor:SetForgeColors.border},or:{color:SetForgeColors.textDisabled,fontSize:10,fontWeight:'800'},error:{padding:10,borderRadius:6,backgroundColor:'rgba(239,68,68,.12)',color:'#FCA5A5',fontSize:12,lineHeight:17},message:{padding:10,borderRadius:6,backgroundColor:'rgba(0,229,255,.1)',color:SetForgeColors.accent,fontSize:12,lineHeight:17},invite:{color:SetForgeColors.textDisabled,fontSize:11,lineHeight:16,textAlign:'center'},
});
