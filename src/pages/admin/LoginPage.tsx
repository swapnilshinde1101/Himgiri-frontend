import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types';
import Input from '../../components/shared/forms/Input';
import Button from '../../components/shared/Button';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const user = await authService.login(data);
      setUser(user);
      toast.success(`Welcome, ${user.name}`);
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
            <span className="text-2xl font-bold italic">HG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Himgiri Goods</h1>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-semibold">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@himgirigoods.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-11 text-base shadow-lg shadow-blue-100"
          >
            Sign In to Dashboard
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Forgot password? Contact your IT administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
