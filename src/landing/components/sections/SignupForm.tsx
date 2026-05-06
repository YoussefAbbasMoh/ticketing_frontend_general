import { useForm } from 'react-hook-form';
import { Button } from '@/landing/components/ui/Button';
import {
  getMainAppOrigin,
  REGISTER_PREFILL_STORAGE_KEY,
  SELECTED_PLAN_STORAGE_KEY,
} from '@/landing/lib/config';
import { useLandingLang } from '@/landing/LandingLangContext';

type FormValues = {
  ownerName: string;
  companyName: string;
  email: string;
  password: string;
};

export function SignupForm() {
  const { copy } = useLandingLang();
  const s = copy.signup;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onBlur' });

  const onSubmit = (data: FormValues) => {
    const payload = {
      ownerName: data.ownerName.trim(),
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
            {s.title}
          </h2>
          <p className="mt-3 text-center font-cairo text-white/65">{s.subtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="ownerName"
                className="mb-2 block font-cairo text-sm font-medium text-white/80"
              >
                {s.ownerName}
              </label>
              <input
                id="ownerName"
                autoComplete="name"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder={s.phOwner}
                {...register('ownerName', { required: s.errOwner })}
              />
              {errors.ownerName ? (
                <p className="mt-1 font-cairo text-sm text-orange">{errors.ownerName.message}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="mb-2 block font-cairo text-sm font-medium text-white/80"
              >
                {s.companyName}
              </label>
              <input
                id="companyName"
                autoComplete="organization"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder={s.phCompany}
                {...register('companyName', { required: s.errCompany })}
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
                {s.workEmail}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder={s.phEmail}
                {...register('email', {
                  required: s.errEmail,
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: s.errEmailInvalid,
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
                {s.password}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/15 bg-navy-dark/80 px-4 py-3 font-cairo text-white outline-none transition-colors focus:border-orange"
                placeholder={s.phPassword}
                {...register('password', {
                  required: s.errPassword,
                  minLength: { value: 8, message: s.errPasswordLen },
                })}
              />
              {errors.password ? (
                <p className="mt-1 font-cairo text-sm text-orange">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" variant="primary" className="w-full py-3.5 text-base">
              {s.submit}
            </Button>
          </form>

          <p className="mt-6 text-center font-cairo text-xs text-white/45">{s.legal}</p>
        </div>
      </div>
    </section>
  );
}
