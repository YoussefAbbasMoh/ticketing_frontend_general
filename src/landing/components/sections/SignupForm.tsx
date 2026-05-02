import { useForm } from 'react-hook-form';
import { Button } from '@/landing/components/ui/Button';
import {
  getMainAppOrigin,
  REGISTER_PREFILL_STORAGE_KEY,
  SELECTED_PLAN_STORAGE_KEY,
} from '@/landing/lib/config';

type FormValues = {
  companyName: string;
  email: string;
  password: string;
};

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onBlur' });

  const onSubmit = (data: FormValues) => {
    const payload = {
      companyName: data.companyName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.password,
    };
    try {
      sessionStorage.setItem(REGISTER_PREFILL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
    const origin = getMainAppOrigin();
    let plan = '';
    try {
      plan = sessionStorage.getItem(SELECTED_PLAN_STORAGE_KEY) || '';
    } catch {
      /* ignore */
    }
    const planQs = plan ? `?plan=${encodeURIComponent(plan)}` : '';
    window.location.href = `${origin}/register-company${planQs}`;
  };

  return (
    <section id="signup" className="scroll-mt-28 md:scroll-mt-32 py-[120px]">
      <div className="mx-auto max-w-lg px-4">
        <div className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-8 md:p-10">
          <h2 className="text-center font-cairo text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Start your 14-day free trial
          </h2>
          <p className="mt-3 text-center font-cairo text-white/65">
            No credit card required. Set up your company in under 20 minutes.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="companyName"
                className="mb-2 block font-cairo text-sm font-medium text-white/80"
              >
                Company name
              </label>
              <input
                id="companyName"
                autoComplete="organization"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder="Acme Logistics"
                {...register('companyName', { required: 'Company name is required' })}
              />
              {errors.companyName ? (
                <p className="mt-1 font-cairo text-sm text-orange">
                  {errors.companyName.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-cairo text-sm font-medium text-white/80"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder="you@company.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Enter a valid email',
                  },
                })}
              />
              {errors.email ? (
                <p className="mt-1 font-cairo text-sm text-orange">{errors.email.message}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-cairo text-sm font-medium text-white/80"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder="At least 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
              />
              {errors.password ? (
                <p className="mt-1 font-cairo text-sm text-orange">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" variant="primary" className="w-full py-3.5 text-base">
              Create Free Account →
            </Button>
          </form>

          <p className="mt-6 text-center font-cairo text-xs text-white/45">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  );
}
