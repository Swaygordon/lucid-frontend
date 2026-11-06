// Service detail page: explains the selected service and starts a LUCID-managed request.

import React, { useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import BusinessCategorySection from '../../components/catalog/CategoryShowcase.jsx';
import { DownloadSection } from '../../components/shared/DownloadAppSection.jsx';
import Breadcrumb from '../../components/catalog/Breadcrumb.jsx';
import CatalogImage from '../../components/catalog/CatalogImage.jsx';
import { getCategoryBySlug, getServiceBySlug } from '../../data/catalog/categories.js';

// Lazy load heavy components
const BackToTop = lazy(() => import('../../components/shared/BackToTopButton.jsx'));


// Build category data from the database categories
const _FEATURED_SLUGS = ['home-repairs', 'auto-repairs', 'cleaning', 'construction'];

const SERVICE_ICONS = _FEATURED_SLUGS.map((slug, i) => {
  const cat = getCategoryBySlug(slug);
  return { id: i + 1, icon: cat?.icon || MapPin, name: cat?.name || slug, slug };
});

const BUSINESS_CARDS = Object.fromEntries(
  SERVICE_ICONS.map(({ name, slug }) => {
    const cat = getCategoryBySlug(slug);
    return [name, {
      cat: name,
      slug,
      mainCardBackground: cat?.image,
      cardIcon: cat?.icon,
      heading: cat?.description || `${name} services`,
      seeAll: `See all ${name.toLowerCase()} services`,
    }];
  })
);

const BUSINESS_SERVICES = SERVICE_ICONS.flatMap(({ name, slug }) => {
  const cat = getCategoryBySlug(slug);
  return (cat?.services ?? []).slice(0, 3).map(svc => ({
    cat: name,
    catSlug: slug,
    slug: svc.slug,
    image: svc.image,
    title: svc.name,
    subtitle: 'Browse service details',
  }));
});

// ============================================
// MAIN COMPONENT
// ============================================
const SelectedService = () => {
  const { category: categorySlug, service: serviceSlug } = useParams();
  const catData = getCategoryBySlug(categorySlug);
  const svcData = getServiceBySlug(categorySlug, serviceSlug);
  const skill = svcData?.name ?? serviceSlug ?? categorySlug ?? 'service';

  const breadcrumbCrumbs = useMemo(() => [
    { label: 'Home',         href: '/lucid/' },
    { label: 'Services',     href: '/lucid/services' },
    { label: 'All Services', href: '/lucid/services/all' },
    { label: catData?.name ?? categorySlug, href: `/lucid/services/${categorySlug}` },
    { label: svcData?.name ?? serviceSlug },
  ], [catData, svcData, categorySlug, serviceSlug]);

  const heroImage = svcData?.image ?? catData?.image ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format';
  const heroTitle = svcData?.name ?? catData?.name ?? skill;
  const heroSubtitle = `${catData?.name ?? 'Lucid'} · Ghana`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f1117] pb-20">
      <div className="relative w-full h-52 md:h-64 overflow-hidden">
        <CatalogImage src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-5 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{heroTitle} Services</h1>
          <p className="text-white/80 text-sm">{heroSubtitle}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 pt-4 pb-2">
        <Breadcrumb crumbs={breadcrumbCrumbs} />
      </div>

      <div className="container mx-auto px-6 pb-16">
        {/* A service request goes to LUCID; provider identity stays private. */}
        <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-blue-900/50 dark:bg-[#1a1f2e] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Managed by LUCID</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-slate-100">Let LUCID arrange this service</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-slate-400">
              Describe the work and location. An optional price range can guide the team, but it does not set the Provider's final bill.
            </p>
          </div>
          <Link
            to={`/lucid/bookings/request/${categorySlug}/${serviceSlug}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-3 text-center font-semibold text-white shadow-md transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1f2e]"
          >
            Request through LUCID
          </Link>
        </section>

        <section className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-[#1a1f2e] sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Your service, coordinated by LUCID</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-slate-400">
            Tell LUCID what needs attention. Our team reviews the request and coordinates an Inspector when one is available. If none is suitable, you can choose whether to continue; the Provider can assess the site without another Client form. Clients do not choose or directly contact Providers. LUCID shares only the request details needed by the assigned people.
          </p>
        </section>
      </div>

      <DownloadSection />
      <motion.div className="w-full" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <BusinessCategorySection serviceIcons={SERVICE_ICONS} businessCards={BUSINESS_CARDS} businessServices={BUSINESS_SERVICES} />
      </motion.div>
      <Suspense fallback={null}><BackToTop /></Suspense>
    </div>
  );
};

export default SelectedService;
