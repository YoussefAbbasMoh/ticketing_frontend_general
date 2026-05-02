import React from 'react';

/**
 * Matches Ticketing-App `AuthBackground`: cool gray canvas, radial glows
 * (secondarySoft / primarySoft), 48px grid in divider color — see `auth_background.dart`.
 */
export function AuthPageLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-app-background font-cairo text-app-text">
      <div
        className="pointer-events-none absolute -right-20 -top-28 h-[min(380px,85vw)] w-[min(380px,85vw)] rounded-full md:-right-24 md:-top-32"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255, 122, 61, 0.16) 0%, transparent 68%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-24 h-[min(300px,75vw)] w-[min(300px,75vw)] rounded-full md:-bottom-20 md:-left-28"
        style={{
          background:
            'radial-gradient(circle at center, rgba(20, 27, 82, 0.12) 0%, transparent 68%)',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 auth-grid-overlay" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-s24 py-s24">
        {children}
      </div>
    </div>
  );
}

export default AuthPageLayout;
