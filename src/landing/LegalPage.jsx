import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredLanguage } from '@/i18n';
import { LandingLangProvider } from '@/landing/LandingLangContext';
import { Navbar } from '@/landing/components/layout/Navbar';
import { Footer } from '@/landing/components/layout/Footer';

const content = {
  terms: {
    en: {
      title: 'Terms & Conditions',
      effectiveDate: '6/5/2025',
      company: 'ABS.AI Technologies',
      intro:
        'By accessing or using our SaaS ticketing platform ("Service"), you agree to the following Terms & Conditions:',
      sections: [
        {
          heading: '1. Use of Service',
          bullets: [
            'You must be at least 18 years old.',
            'You agree to use the Service only for lawful purposes.',
            'You are responsible for your account and all activities under it.',
          ],
        },
        {
          heading: '2. Account Registration',
          bullets: [
            'You must provide accurate information.',
            'You are responsible for maintaining account security.',
            'We reserve the right to suspend or terminate accounts.',
          ],
        },
        {
          heading: '3. Subscription & Payment',
          bullets: [
            'The Service is provided on a subscription basis.',
            'Fees are billed monthly or annually.',
            'Failure to pay may result in service suspension.',
          ],
        },
        {
          heading: '4. Acceptable Use',
          bullets: [
            'Use the system for spam or illegal activities is prohibited.',
            'Attempting to hack or disrupt the platform is prohibited.',
            'Uploading malicious content is prohibited.',
          ],
        },
        {
          heading: '5. Data Ownership',
          bullets: [
            'You own your data.',
            'You grant us a limited license to process it for service delivery.',
          ],
        },
        {
          heading: '6. Service Availability',
          bullets: ['We aim for high uptime but do not guarantee uninterrupted service.'],
        },
        {
          heading: '7. Limitation of Liability',
          bullets: ['ABS.AI is not liable for data loss, indirect damages, or service interruptions.'],
        },
        {
          heading: '8. Termination',
          bullets: [
            'We may terminate or suspend accounts if terms are violated.',
            'We may terminate or suspend accounts if payments are not made.',
            'We may terminate or suspend accounts if misuse is detected.',
          ],
        },
        {
          heading: '9. Modifications',
          bullets: ['We reserve the right to update these terms at any time.'],
        },
        {
          heading: '10. Governing Law',
          bullets: ['These Terms are governed by applicable local laws.'],
        },
        {
          heading: '11. Contact',
          bullets: [
            'Email: tik@absai.dev',
            'Phone: 01099112703',
            'Address: القاهرة التجمع الاول وبنفسج 11 و فيلا 55',
          ],
        },
      ],
    },
    ar: {
      title: 'الشروط والأحكام',
      effectiveDate: '6/5/2025',
      company: 'ABS.AI Technologies',
      intro:
        'من خلال الوصول إلى أو استخدام منصة التذاكر السحابية (SaaS) الخاصة بنا ("الخدمة")، فإنك توافق على الالتزام بالشروط والأحكام التالية:',
      sections: [
        {
          heading: '1. استخدام الخدمة',
          bullets: [
            'يجب ألا يقل عمرك عن 18 عامًا.',
            'توافق على استخدام الخدمة لأغراض قانونية فقط.',
            'تتحمل المسؤولية الكاملة عن حسابك وجميع الأنشطة التي تتم من خلاله.',
          ],
        },
        {
          heading: '2. تسجيل الحساب',
          bullets: [
            'يجب تقديم معلومات صحيحة ودقيقة.',
            'أنت مسؤول عن الحفاظ على سرية وأمان بيانات حسابك.',
            'نحتفظ بالحق في تعليق أو إنهاء الحسابات عند الضرورة.',
          ],
        },
        {
          heading: '3. الاشتراك والدفع',
          bullets: [
            'يتم تقديم الخدمة بنظام الاشتراك.',
            'يتم تحصيل الرسوم بشكل شهري أو سنوي.',
            'قد يؤدي عدم السداد إلى تعليق الخدمة.',
          ],
        },
        {
          heading: '4. الاستخدام المقبول',
          bullets: [
            'يُمنع استخدام النظام في إرسال الرسائل المزعجة (Spam) أو أي أنشطة غير قانونية.',
            'يُمنع محاولة اختراق أو تعطيل المنصة.',
            'يُمنع رفع أو نشر محتوى ضار أو خبيث.',
          ],
        },
        {
          heading: '5. ملكية البيانات',
          bullets: [
            'تظل ملكية البيانات الخاصة بك لك بالكامل.',
            'تمنحنا ترخيصًا محدودًا لمعالجة البيانات فقط بغرض تقديم الخدمة.',
          ],
        },
        {
          heading: '6. توفر الخدمة',
          bullets: ['نسعى لتوفير أعلى مستوى من الجاهزية، لكننا لا نضمن استمرارية الخدمة دون انقطاع.'],
        },
        {
          heading: '7. تحديد المسؤولية',
          bullets: ['لا تتحمل شركة ABS.AI أي مسؤولية عن فقدان البيانات أو الأضرار غير المباشرة أو انقطاع الخدمة.'],
        },
        {
          heading: '8. إنهاء الخدمة',
          bullets: [
            'يحق لنا إنهاء أو تعليق الحسابات عند مخالفة الشروط والأحكام.',
            'يحق لنا إنهاء أو تعليق الحسابات عند عدم سداد الرسوم.',
            'يحق لنا إنهاء أو تعليق الحسابات عند إساءة استخدام الخدمة.',
          ],
        },
        {
          heading: '9. التعديلات',
          bullets: ['نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إخطار المستخدمين عند وجود تغييرات جوهرية.'],
        },
        {
          heading: '10. القانون الحاكم',
          bullets: ['تخضع هذه الشروط والأحكام للقوانين المحلية المعمول بها.'],
        },
        {
          heading: '11. التواصل',
          bullets: [
            'البريد الإلكتروني: tik@absai.dev',
            'الهاتف: 01099112703',
            'العنوان: القاهرة التجمع الاول وبنفسج 11 و فيلا 55',
          ],
        },
      ],
    },
  },
  privacy: {
    en: {
      title: 'Privacy Policy',
      effectiveDate: '6/5/2025',
      company: 'ABS.AI Technologies',
      intro:
        'At ABS.AI Technologies ("we", "our", or "us"), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our SaaS ticketing platform ("Service").',
      sections: [
        {
          heading: '1. Information We Collect',
          bullets: [
            'We may collect the following types of data:',
            'Personal Information: Name, email address, phone number, company name',
            'Account Data: Login credentials, user roles',
            'Payment Information: Billing details (processed via third-party providers)',
            'Usage Data: IP address, browser type, device info, activity logs',
            'Ticket Data: Customer interactions, messages, attachments',
          ],
        },
        {
          heading: '2. How We Use Your Information',
          bullets: [
            'We use collected data to:',
            'Provide and operate the Service',
            'Manage user accounts',
            'Process payments',
            'Improve system performance and user experience',
            'Communicate updates, support, and notifications',
            'Ensure security and prevent fraud',
          ],
        },
        {
          heading: '3. Data Sharing',
          bullets: [
            'We do not sell your data. We may share data with:',
            'Payment processors (e.g., Paymob)',
            'Hosting providers (e.g., contabo)',
            'Legal authorities if required by law',
          ],
        },
        {
          heading: '4. Data Storage & Security',
          bullets: ['We implement appropriate technical and organizational measures to protect your data, including encryption and secure servers.'],
        },
        {
          heading: '5. Data Retention',
          bullets: [
            'We retain data only as long as necessary to:',
            'Provide services',
            'Comply with legal obligations',
            'Resolve disputes',
          ],
        },
        {
          heading: '6. Your Rights',
          bullets: [
            'You have the right to:',
            'Access your data',
            'Request correction or deletion',
            'Object to processing',
            'Request data portability',
          ],
        },
        {
          heading: '7. Cookies',
          bullets: ['We use cookies to enhance user experience and analyze platform usage.'],
        },
        {
          heading: '8. Third-Party Services',
          bullets: ['Our platform may integrate with third-party tools. We are not responsible for their privacy practices.'],
        },
        {
          heading: '9. Changes to This Policy',
          bullets: ['We may update this Privacy Policy from time to time. Users will be notified of significant changes.'],
        },
        {
          heading: '10. Contact Us',
          bullets: [
            'ABS.AI Technologies',
            'Email: tik@absai.dev',
            'Phone: 01099112703',
            'Address: القاهرة التجمع الاول وبنفسج 11 و فيلا 55',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة الخصوصية',
      effectiveDate: '6/5/2025',
      company: 'ABS.AI Technologies',
      intro:
        'في شركة ABS.AI Technologies ("نحن" أو "لنا")، نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الخاصة بك عند استخدامك لمنصة التذاكر السحابية (SaaS) الخاصة بنا ("الخدمة").',
      sections: [
        {
          heading: '1. المعلومات التي نقوم بجمعها',
          bullets: [
            'المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف، اسم الشركة.',
            'بيانات الحساب: بيانات تسجيل الدخول، أدوار المستخدمين.',
            'معلومات الدفع: تفاصيل الفواتير (تتم معالجتها عبر مزودي خدمات الدفع الخارجيين).',
            'بيانات الاستخدام: عنوان IP، نوع المتصفح، معلومات الجهاز، سجلات النشاط.',
            'بيانات التذاكر: تفاعلات العملاء، الرسائل، المرفقات.',
          ],
        },
        {
          heading: '2. كيفية استخدام المعلومات',
          bullets: [
            'تقديم وتشغيل الخدمة.',
            'إدارة حسابات المستخدمين.',
            'معالجة المدفوعات.',
            'تحسين أداء النظام وتجربة المستخدم.',
            'التواصل مع المستخدمين بشأن التحديثات والدعم والإشعارات.',
            'تعزيز الأمان ومنع الاحتيال.',
          ],
        },
        {
          heading: '3. مشاركة البيانات',
          bullets: [
            'نحن لا نقوم ببيع بياناتك.',
            'قد نشارك البيانات مع مزودي خدمات الدفع (مثل Paymob).',
            'قد نشارك البيانات مع مزودي خدمات الاستضافة (مثل Contabo).',
            'قد نشارك البيانات مع الجهات القانونية إذا طُلب ذلك بموجب القانون.',
          ],
        },
        {
          heading: '4. تخزين البيانات وأمانها',
          bullets: ['نطبق إجراءات تقنية وتنظيمية مناسبة لحماية بياناتك، بما في ذلك التشفير واستخدام خوادم آمنة.'],
        },
        {
          heading: '5. الاحتفاظ بالبيانات',
          bullets: [
            'نحتفظ بالبيانات فقط للمدة اللازمة لتقديم الخدمة.',
            'نحتفظ بالبيانات فقط للمدة اللازمة للامتثال للالتزامات القانونية.',
            'نحتفظ بالبيانات فقط للمدة اللازمة لحل النزاعات.',
          ],
        },
        {
          heading: '6. حقوقك',
          bullets: [
            'الوصول إلى بياناتك.',
            'طلب تصحيح أو حذف البيانات.',
            'الاعتراض على معالجة البيانات.',
            'طلب نقل البيانات.',
          ],
        },
        {
          heading: '7. ملفات تعريف الارتباط (Cookies)',
          bullets: ['نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل استخدام المنصة.'],
        },
        {
          heading: '8. خدمات الطرف الثالث',
          bullets: ['قد تتكامل منصتنا مع أدوات وخدمات خارجية. نحن غير مسؤولين عن سياسات الخصوصية الخاصة بهذه الجهات.'],
        },
        {
          heading: '9. التعديلات على السياسة',
          bullets: ['قد نقوم بتحديث سياسة الخصوصية من وقت لآخر، وسيتم إخطار المستخدمين بأي تغييرات جوهرية.'],
        },
        {
          heading: '10. تواصل معنا',
          bullets: [
            'البريد الإلكتروني: tik@absai.dev',
            'الهاتف: 01099112703',
            'العنوان: القاهرة التجمع الاول وبنفسج 11 و فيلا 55',
          ],
        },
      ],
    },
  },
  refund: {
    en: {
      title: 'Refund Policy',
      effectiveDate: '6/5/2025',
      company: 'ABS.AI Technologies',
      intro: '',
      sections: [
        {
          heading: '1. Subscription Fees',
          bullets: ['All subscription fees are billed in advance and are generally non-refundable.'],
        },
        {
          heading: '2. Refund Eligibility',
          bullets: [
            'Refunds may be granted only in the following cases:',
            'Duplicate payment.',
            'Technical failure preventing service usage.',
            'Cancellation within 7-14 days of first subscription (trial period, if applicable).',
          ],
        },
        {
          heading: '3. Non-Refundable Cases',
          bullets: [
            'Partial usage of the service.',
            'Failure to cancel before renewal.',
            'Violation of Terms & Conditions.',
          ],
        },
        {
          heading: '4. Cancellation Policy',
          bullets: [
            'Users may cancel subscriptions at any time.',
            'Cancellation will take effect at the end of the billing cycle.',
          ],
        },
        {
          heading: '5. Processing Refunds',
          bullets: ['Approved refunds are processed within 7-14 business days via the original payment method.'],
        },
        {
          heading: '6. Contact',
          bullets: [
            'Email: tik@absai.dev',
            'Phone: 01099112703',
            'Address: القاهرة التجمع الاول وبنفسج 11 و فيلا 55',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة الاسترداد',
      effectiveDate: '6/5/2025',
      company: 'ABS.AI Technologies',
      intro: '',
      sections: [
        {
          heading: '1. رسوم الاشتراك',
          bullets: ['يتم تحصيل جميع رسوم الاشتراك مقدمًا، وهي بشكل عام غير قابلة للاسترداد.'],
        },
        {
          heading: '2. حالات استحقاق الاسترداد',
          bullets: [
            'قد يتم منح استرداد الأموال فقط في الحالات التالية:',
            'الدفع المكرر (تحصيل المبلغ أكثر من مرة).',
            'حدوث خلل تقني يمنع استخدام الخدمة.',
            'إلغاء الاشتراك خلال فترة 7-14 يومًا من الاشتراك الأول (في حال وجود فترة تجريبية).',
          ],
        },
        {
          heading: '3. الحالات غير القابلة للاسترداد',
          bullets: [
            'الاستخدام الجزئي للخدمة.',
            'عدم إلغاء الاشتراك قبل موعد التجديد.',
            'مخالفة الشروط والأحكام.',
          ],
        },
        {
          heading: '4. سياسة الإلغاء',
          bullets: [
            'يمكن للمستخدمين إلغاء الاشتراك في أي وقت.',
            'يسري الإلغاء اعتبارًا من نهاية دورة الفوترة الحالية.',
          ],
        },
        {
          heading: '5. معالجة طلبات الاسترداد',
          bullets: ['يتم معالجة طلبات الاسترداد المعتمدة خلال 7 إلى 14 يوم عمل باستخدام نفس وسيلة الدفع الأصلية.'],
        },
        {
          heading: '6. التواصل',
          bullets: [
            'البريد الإلكتروني: tik@absai.dev',
            'الهاتف: 01099112703',
            'العنوان: القاهرة التجمع الاول وبنفسج 11 و فيلا 55',
          ],
        },
      ],
    },
  },
};

function LegalPageContent() {
  const location = useLocation();
  const rawLang = String(getStoredLanguage() || 'en').toLowerCase();
  const lang = rawLang.startsWith('ar') ? 'ar' : 'en';
  const isArabic = lang === 'ar';

  const kind = useMemo(() => {
    if (location.pathname === '/terms-of-service') return 'terms';
    if (location.pathname === '/privacy-policy') return 'privacy';
    if (location.pathname === '/cookie-policy') return 'refund';
    return null;
  }, [location.pathname]);

  if (!kind) return <Navigate to="/" replace />;

  const page = content[kind][lang];

  return (
    <div
      className="tik-marketing min-h-screen bg-navy-dark font-cairo text-white antialiased"
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={lang}
    >
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <p className="mt-3 text-sm text-white/70">
          {isArabic ? 'تاريخ السريان' : 'Effective Date'}: {page.effectiveDate}
        </p>
        <p className="text-sm text-white/70">
          {isArabic ? 'الشركة' : 'Company'}: {page.company}
        </p>
        {page.intro ? <p className="mt-6 text-white/85">{page.intro}</p> : null}

        <div className="mt-8 space-y-6">
          {page.sections.map((section) => {
            const sectionNumber = Number(String(section.heading).split('.')[0]);
            const hasIntroLine =
              Number.isFinite(sectionNumber) &&
              section.bullets.length > 1 &&
              ((kind === 'privacy' && sectionNumber >= 1 && sectionNumber <= 6) ||
                (kind === 'refund' && (sectionNumber === 2 || sectionNumber === 3)));
            const introLine = hasIntroLine ? section.bullets[0] : null;
            const listItems = hasIntroLine ? section.bullets.slice(1) : section.bullets;

            return (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-orange">{section.heading}</h2>
                {introLine ? <p className="mt-3 text-white/85">{introLine}</p> : null}
                <ul className="mt-3 list-disc space-y-2 ps-5 text-white/85">
                  {listItems.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalPage() {
  return (
    <LandingLangProvider>
      <LegalPageContent />
    </LandingLangProvider>
  );
}

