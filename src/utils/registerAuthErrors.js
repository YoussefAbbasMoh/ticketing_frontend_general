import { t } from '../i18n';

const REGISTER_SUBMIT_EXACT = [
  ['email and password are required', 'errRegisterEmailPasswordRequired'],
  [
    'Provide at least one of companyName or ownerName, plus email and password',
    'errRegisterProvideCompanyOrOwnerName',
  ],
  [
    'Password must be at least 8 characters and include uppercase, lowercase, and a special character',
    'valPasswordStrongPolicy',
  ],
  [
    'This email has a registration pending email verification. Enter the code from your inbox, or use POST /api/auth/resend-registration-otp.',
    'errRegisterPendingVerification',
  ],
  [
    'You already have a company with this name. Please choose a different company name.',
    'errDuplicateCompanyName',
  ],
  [
    'Company was created but we could not send the verification email. Try POST /api/auth/resend-registration-otp shortly.',
    'errRegisterOtpEmailFailed',
  ],
];

const VERIFY_OTP_EXACT = [
  ['email and otp are required', 'errVerifyEmailOtpRequired'],
  ['Code not found or expired. Request a new one.', 'errVerifyCodeNotFoundOrExpired'],
  ['Code expired', 'errVerifyCodeExpired'],
  ['Invalid code', 'errVerifyInvalidCode'],
  ['User not found', 'errVerifyUserNotFound'],
  [
    'This account is already verified. Log in with your password.',
    'errVerifyAlreadyVerified',
  ],
];

const RESEND_OTP_EXACT = [
  ['email and password are required', 'errResendEmailPasswordRequired'],
  ['Invalid credentials', 'errResendInvalidCredentials'],
  ['This account is already verified.', 'errResendAlreadyVerified'],
];

function mapExactMessages(lang, message, pairs) {
  const m = String(message || '').trim();
  for (const [en, key] of pairs) {
    if (m === en) return t(lang, key);
  }
  return null;
}

/** After handling 409 ACCOUNT_EXISTS_USE_LOGIN in the caller. */
export function localizeRegisterSubmitError(lang, status, data) {
  const code = data?.code;
  const message = data?.message;

  if (code === 'OWNER_NAME_INVALID_CHARS') {
    return t(lang, 'valOwnerNameLettersOnly');
  }
  if (code === 'OWNER_NAME_NOT_FULL' || code === 'OWNER_NAME_WORD_TOO_SHORT') {
    return t(lang, 'valOwnerNameFullName');
  }
  if (code === 'COMPANY_NAME_TOO_SHORT') {
    return t(lang, 'valCompanyNameMin2');
  }

  if (status === 503) return t(lang, 'errDbUnavailable');
  if (status === 500) return t(lang, 'errServerGeneric');

  const byMessage = mapExactMessages(lang, message, REGISTER_SUBMIT_EXACT);
  if (byMessage) return byMessage;
  if (String(message || '').trim() === 'Internal server error') return t(lang, 'errServerGeneric');

  if (lang === 'ar') return t(lang, 'errRegisterCouldNotCreate');
  return String(message || '').trim() || t(lang, 'errRegisterCouldNotCreate');
}

export function localizeVerifyRegistrationOtpError(lang, status, data) {
  const message = data?.message;
  if (status === 503) return t(lang, 'errDbUnavailable');
  if (status === 500) return t(lang, 'errServerGeneric');
  const mapped = mapExactMessages(lang, message, VERIFY_OTP_EXACT);
  if (mapped) return mapped;
  if (String(message || '').trim() === 'Internal server error') return t(lang, 'errServerGeneric');
  if (lang === 'ar') return t(lang, 'errVerifyCouldNotVerify');
  return String(message || '').trim() || t(lang, 'errVerifyCouldNotVerify');
}

export function localizeResendRegistrationOtpError(lang, status, data) {
  const message = data?.message;
  if (status === 503) return t(lang, 'errDbUnavailable');
  if (status === 500) return t(lang, 'errServerGeneric');
  const mapped = mapExactMessages(lang, message, RESEND_OTP_EXACT);
  if (mapped) return mapped;
  if (String(message || '').trim() === 'Internal server error') return t(lang, 'errServerGeneric');
  if (lang === 'ar') return t(lang, 'errResendCouldNot');
  return String(message || '').trim() || t(lang, 'errResendCouldNot');
}

export function localizeRegisterNetworkError(lang, err) {
  if (err?.response?.data) return null;
  return t(lang, 'errNetwork');
}
