import { Link } from 'react-router-dom';
import WhiteLucidLogo from '../../assets/brand/Lucid-horizontal white.webp';

export default function AuthPageLayout({ eyebrow, title, description, children, footer }) {
  return (
    <div className="grid min-h-svh bg-slate-50 dark:bg-[#0f1117] lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-[linear-gradient(135deg,#2148d0_0%,#245cc9_62%,#087c8a_100%)] px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-svh lg:px-12 lg:py-10">
        <Link to="/lucid/" aria-label="LUCID home" className="w-fit rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <img src={WhiteLucidLogo} alt="LUCID" className="h-9 w-auto object-contain object-left" />
        </Link>
        <div className="max-w-lg py-8 lg:py-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 sm:text-sm">Your service, managed</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:mt-5 lg:text-5xl">One place for every step.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-blue-50 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">Track requests, coordinate with the LUCID team, and keep every decision and receipt together.</p>
        </div>
        <p className="text-xs text-blue-100 sm:text-sm">LUCID service workspace</p>
      </section>

      <section className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:min-h-svh lg:px-14 lg:py-14">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">{description}</p>
          {children}
          <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-400">{footer}</p>
        </div>
      </section>
    </div>
  );
}
