import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Button, Input } from '../../components/common';
import { supabase } from '../../store/supabaseClient';
import { useAppDispatch } from '../../store/store';
import { setSession } from '../../store/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

async function ensureVillage(userId: string): Promise<{ id: string; name: string }> {
  const { data: existing } = await supabase
    .from('villages')
    .select('id, name')
    .eq('admin_id', userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created } = await supabase
    .from('villages')
    .insert({ admin_id: userId, name: 'My Village' })
    .select('id, name')
    .single();

  return created ?? { id: '', name: 'My Village' };
}

export function AdminLoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleAuth = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) { setError(error.message); return; }
        if (authData.session) {
          const village = await ensureVillage(authData.session.user.id);
          dispatch(setSession({
            session: authData.session.access_token,
            email: data.email,
            role: 'admin',
            villageId: village.id,
            villageName: village.name,
          }));
        } else {
          setError('Account created! Check your email to confirm, then sign in.');
          setIsSignUp(false);
        }
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) { setError(error.message); return; }
        const village = await ensureVillage(authData.session.user.id);
        dispatch(setSession({
          session: authData.session.access_token,
          email: data.email,
          role: 'admin',
          villageId: village.id,
          villageName: village.name,
        }));
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Admin Login'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Set up your admin account' : 'Sign in to manage your village'}
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="admin@village.com"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                error={errors.password?.message}
                containerStyle={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={showPassword ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button style={{ marginTop: spacing.lg, width: '50%', alignSelf: 'center',marginBottom: spacing.md }}
          title={isSignUp ? 'Create Account ' : 'Sign In '}
          onPress={handleSubmit(handleAuth)}
          loading={loading}
          fullWidth
        />

        <TouchableOpacity
          style={{ marginTop: spacing.md }}
          onPress={() => { setIsSignUp(!isSignUp); setError(null); }}
        >
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="I'm a Collector"
          onPress={() => navigation.navigate('CollectorPhoneCheck')}
          variant="ghost"
          style={styles.collectorBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xxxl,
  },
  errorText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  toggleText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  collectorBtn: {
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderRadius: 8,
  },

  passwordContainer: {
    position: 'relative',
  },

  passwordInput: {
    marginBottom: 0,
  },

  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 45,
    zIndex: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
// import { useForm, Controller } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { colors } from '../../constants/colors';
// import { fonts } from '../../constants/fonts';
// import { spacing } from '../../constants/spacing';
// import { Button, Input } from '../../components/common';
// import { supabase } from '../../store/supabaseClient';
// import { useAppDispatch } from '../../store/store';
// import { setSession } from '../../store/slices/authSlice';

// const loginSchema = z.object({
//   email: z.string().email('Enter a valid email'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
// });

// type LoginFormData = z.infer<typeof loginSchema>;

// async function ensureVillage(userId: string): Promise<{ id: string; name: string }> {
//   const { data: existing } = await supabase
//     .from('villages')
//     .select('id, name')
//     .eq('admin_id', userId)
//     .maybeSingle();

//   if (existing) return existing;

//   const { data: created } = await supabase
//     .from('villages')
//     .insert({ admin_id: userId, name: 'My Village' })
//     .select('id, name')
//     .single();

//   return created ?? { id: '', name: 'My Village' };
// }

// export function AdminLoginScreen({ navigation }: any) {
//   const dispatch = useAppDispatch();
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const {
//     control,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//   });

//   const handleAuth = async (data: LoginFormData) => {
//     setLoading(true);
//     setError(null);

//     try {
//       if (isSignUp) {
//         const { data: authData, error } = await supabase.auth.signUp({
//           email: data.email,
//           password: data.password,
//         });
//         if (error) {
//           setError(error.message);
//           return;
//         }
//         if (authData.session) {
//           const village = await ensureVillage(authData.session.user.id);
//           dispatch(
//             setSession({
//               session: authData.session.access_token,
//               email: data.email,
//               role: 'admin',
//               villageId: village.id,
//               villageName: village.name,
//             })
//           );
//         } else {
//           setError('Account created! Check your email to confirm, then sign in.');
//           setIsSignUp(false);
//         }
//       } else {
//         const { data: authData, error } = await supabase.auth.signInWithPassword({
//           email: data.email,
//           password: data.password,
//         });
//         if (error) {
//           setError(error.message);
//           return;
//         }
//         const village = await ensureVillage(authData.session.user.id);
//         dispatch(
//           setSession({
//             session: authData.session.access_token,
//             email: data.email,
//             role: 'admin',
//             villageId: village.id,
//             villageName: village.name,
//           })
//         );
//       }
//     } catch {
//       setError('Something went wrong. Try again.');
//     }

//     setLoading(false);
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <View style={styles.content}>
//         <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Admin Login'}</Text>
//         <Text style={styles.subtitle}>
//           {isSignUp ? 'Set up your admin account' : 'Sign in to manage your village'}
//         </Text>

//         <Controller
//           control={control}
//           name="email"
//           render={({ field: { onChange, value } }) => (
//             <Input
//               label="Email"
//               placeholder="admin@village.com"
//               value={value}
//               onChangeText={onChange}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               error={errors.email?.message}
//             />
//           )}
//         />

//         <Controller
//           control={control}
//           name="password"
//           render={({ field: { onChange, value } }) => (
//             <Input
//               label="Password"
//               placeholder="Enter your password"
//               value={value}
//               onChangeText={onChange}
//               secureTextEntry
//               error={errors.password?.message}
//             />
//           )}
//         />

//         {error && <Text style={styles.errorText}>{error}</Text>}

//         <Button
//           title={isSignUp ? 'Create Account' : 'Sign In'}
//           onPress={handleSubmit(handleAuth)}
//           loading={loading}
//           fullWidth
//         />

//         <Button
//           title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
//           onPress={() => { setIsSignUp(!isSignUp); setError(null); }}
//           variant="ghost"
//           style={{ marginTop: spacing.md }}
//         />
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: spacing.xxl,
//     justifyContent: 'center',
//   },
//   title: {
//     fontFamily: fonts.poppins.bold,
//     fontSize: 28,
//     color: colors.textPrimary,
//     marginBottom: spacing.xs,
//   },
//   subtitle: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 14,
//     color: colors.textMuted,
//     marginBottom: spacing.xxxl,
//   },
//   errorText: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 13,
//     color: colors.danger,
//     marginBottom: spacing.md,
//     textAlign: 'center',
//   },
// });
