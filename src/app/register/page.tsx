'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to terms',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, googleLogin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Account created successfully!');
      router.push('/feed');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2F6' }}>
        <div className="animate-spin" style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#1890FF', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: '#EEF2F6',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative shapes on background */}
      <div style={{ position: 'absolute', top: -80, left: -80, opacity: 0.4 }}>
        <img src="/assets/images/shape1.svg" alt="" style={{ width: 280 }} />
      </div>
      <div style={{ position: 'absolute', top: 40, right: -40, opacity: 0.3 }}>
        <img src="/assets/images/shape2.svg" alt="" style={{ width: 250 }} />
      </div>
      <div style={{ position: 'absolute', bottom: -50, left: '35%', opacity: 0.25 }}>
        <img src="/assets/images/shape3.svg" alt="" style={{ width: 220 }} />
      </div>

      {/* Content Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 40px',
        gap: 60,
      }}>
        {/* Left Side - Image blends with background */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src="/assets/images/registration.png" 
            alt="Registration Illustration" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '70vh', 
              objectFit: 'contain',
            }} 
          />
        </div>

        {/* Right Side - Form in white card (taller for registration) */}
        <div style={{
          flex: '0 0 420px',
          background: '#fff',
          borderRadius: 12,
          padding: '32px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src="/assets/images/logo.svg" alt="BuddyScript" style={{ height: 34, margin: '0 auto' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#1890FF', fontSize: 14, marginBottom: 4 }}>Get Started Now</p>
          <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#112032', marginBottom: 22 }}>Registration</h2>

          {/* Google Button */}
          <div style={{ marginBottom: 18 }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  if (credentialResponse.credential) {
                    await googleLogin(credentialResponse.credential);
                    toast.success('Google login successful!');
                    router.push('/feed');
                  }
                } catch (error: any) {
                  toast.error(error.message || 'Google login failed');
                }
              }}
              onError={() => {
                toast.error('Google login failed');
              }}
              width="350"
              text="signup_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}></div>
            <span style={{ fontSize: 13, color: '#999' }}>Or</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* First Name & Last Name - side by side */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 5 }}>First Name</label>
                <input
                  type="text"
                  {...register('firstName')}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 14px',
                    border: errors.firstName ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                {errors.firstName && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.firstName.message}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 5 }}>Last Name</label>
                <input
                  type="text"
                  {...register('lastName')}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 14px',
                    border: errors.lastName ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                {errors.lastName && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.lastName.message}</p>}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 5 }}>Email</label>
              <input
                type="email"
                {...register('email')}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 14px',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 42px 0 14px',
                    border: errors.password ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#999',
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.password.message}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 5 }}>Repeat Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 42px 0 14px',
                    border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#999',
                  }}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 3 }}>{errors.confirmPassword.message}</p>}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', cursor: 'pointer', marginBottom: 18 }}>
              <input type="checkbox" {...register('agreeToTerms')} style={{ accentColor: '#1890FF' }} />
              I agree to terms &amp; conditions
            </label>
            {errors.agreeToTerms && <p style={{ color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 8 }}>{errors.agreeToTerms.message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: 44,
                background: '#1890FF',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginBottom: 18,
              }}
            >
              {isSubmitting ? 'Creating account...' : 'Login now'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#1890FF', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
