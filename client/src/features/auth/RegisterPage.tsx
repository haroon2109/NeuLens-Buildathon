import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { ShieldCheck, User, Calendar, BookOpen, ChevronRight, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  educationYears: z.coerce.number().min(0, 'Education years must be positive'),
  handedness: z.enum(['LEFT', 'RIGHT', 'AMBIDEXTROUS']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormFields = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      handedness: 'RIGHT',
      educationYears: 12
    }
  });

  const onSubmit = async () => {
    navigate('/patient/register');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-8 space-y-6 shadow-card">
        {/* Header */}
        <div className="text-center space-y-2">
          <NeuLensLogo height="h-12" className="mx-auto" />
          <h2 className="font-display text-2xl font-bold text-slate-900">Patient Registration</h2>
          <p className="text-xs text-slate-500">Demographic parameters calibrate age and education-adjusted normative baselines</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> First Name
              </label>
              <Input
                type="text"
                {...register('firstName')}
                placeholder="First name"
                aria-invalid={Boolean(errors.firstName)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
              />
              {errors.firstName && (
                <span className="text-xs text-rose-600 font-medium">{errors.firstName.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Last Name
              </label>
              <Input
                type="text"
                {...register('lastName')}
                placeholder="Last name"
                aria-invalid={Boolean(errors.lastName)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
              />
              {errors.lastName && (
                <span className="text-xs text-rose-600 font-medium">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="your.email@domain.com"
              aria-invalid={Boolean(errors.email)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
            />
            {errors.email && (
              <span className="text-xs text-rose-600 font-medium">{errors.email.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
              </label>
              <Input
                type="date"
                {...register('dateOfBirth')}
                aria-invalid={Boolean(errors.dateOfBirth)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
              />
              {errors.dateOfBirth && (
                <span className="text-xs text-rose-600 font-medium">{errors.dateOfBirth.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Education (Years)
              </label>
              <Input
                type="number"
                {...register('educationYears')}
                aria-invalid={Boolean(errors.educationYears)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
              />
              {errors.educationYears && (
                <span className="text-xs text-rose-600 font-medium">{errors.educationYears.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Handedness</label>
              <select {...register('handedness')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all">
                <option value="RIGHT">Right-Handed</option>
                <option value="LEFT">Left-Handed</option>
                <option value="AMBIDEXTROUS">Ambidextrous</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
              </label>
              <Input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all"
              />
              {errors.password && (
                <span className="text-xs text-rose-600 font-medium">{errors.password.message}</span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary h-auto py-3.5 mt-2 font-bold text-sm rounded-2xl shadow-pill disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Registering...' : 'Create Account'}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/auth/login" className="text-medical-600 hover:text-medical-700 font-bold hover:underline">
              Sign In
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Your information is used only for your cognitive screening record</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
