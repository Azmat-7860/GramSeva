import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function AdminLoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const sendOTP = async () => {
    const email = getValues('email');
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (!error) setOtpSent(true);
  };

  const verifyOTP = async (data: LoginFormData) => {
    setLoading(true);
    const { data: authData, error } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.otp!,
      type: 'email',
    });
    setLoading(false);

    if (error || !authData.session) return;

    dispatch(
      setSession({
        session: authData.session.access_token,
        email: data.email,
        role: 'admin',
      })
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>Sign in to manage your village</Text>

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

        {!otpSent ? (
          <Button
            title="Send OTP"
            onPress={sendOTP}
            loading={loading}
            fullWidth
          />
        ) : (
          <>
            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Enter OTP"
                  placeholder="000000"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.otp?.message}
                />
              )}
            />
            <Button
              title="Verify & Login"
              onPress={handleSubmit(verifyOTP)}
              loading={loading}
              fullWidth
            />
          </>
        )}
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
});
