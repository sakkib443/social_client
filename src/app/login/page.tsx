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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success('Login successful!');
      router.push('/feed');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
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
        {/* Left Side - Image on background (no card) */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src="/assets/images/login.png" 
            alt="Login Illustration" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '70vh', 
              objectFit: 'contain',
            }} 
          />
        </div>

        {/* Right Side - Form in white card */}
        <div style={{
          flex: '0 0 420px',
          background: '#fff',
          borderRadius: 12,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/assets/images/logo.svg" alt="BuddyScript" style={{ height: 34, margin: '0 auto' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#1890FF', fontSize: 14, marginBottom: 4 }}>Welcome back</p>
          <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#112032', marginBottom: 28 }}>Login to your account</h2>

          {/* Google Button */}
          <div style={{ marginBottom: 22 }}>
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
              text="signin_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}></div>
            <span style={{ fontSize: 13, color: '#999' }}>Or</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                {...register('email')}
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 14px',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#4A5568', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  style={{
                    width: '100%',
                    height: 42,
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
              {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#1890FF' }} />
                Remember me
              </label>
              <span style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer' }}>Forgot password?</span>
            </div>

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
                marginBottom: 22,
              }}
            >
              {isSubmitting ? 'Logging in...' : 'Login now'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>
            Dont have an account?{' '}
            <Link href="/register" style={{ color: '#1890FF', fontWeight: 600 }}>Create New Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
