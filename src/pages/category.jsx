import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { DownloadSection } from '../components/download_ad.jsx';
import BackToTop from '../components/back_the_top_btn';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { getCategoryBySlug, ALL_CATEGORIES } from '../data/categories.js';

const CategorySkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    {/* Hero */}
    <div className="relative w-full h-56 md:h-72 bg-gray-300">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
      </div>
    </div>

    {/* Breadcrumb */}
    <div className="max-w-6xl mx-auto px-5 pt-5 pb-2 flex items-center gap-2">
      <div className="h-4 w-10 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
      <div className="h-4 w-28 bg-gray-200 rounded" />
    </div>

    {/* Sub-services grid */}
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="h-7 w-52 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="h-44 bg-gray-300" />
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-5 w-5 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Other category pills */}
    <div className="max-w-6xl mx-auto px-5 pb-14">
      <div className="h-6 w-44 bg-gray-200 rounded mb-4" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
        ))}
      </div>
    </div>
  </div>
);

const Category = () => {
  const { category: categorySlug } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(id);
  }, [categorySlug]);

  const cat = getCategoryBySlug(categorySlug);

  if (isLoading) return <CategorySkeleton />;

  // Fallback: unknown slug → show all categories
  if (!cat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-5 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Category not found</h1>
          <Link to="/lucid/services/all" className="text-blue-600 hover:underline">
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  const Icon = cat.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">

      {/* ── Hero ── */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-5 text-center">
          <div className={`w-14 h-14 rounded-2xl bg-white bg-opacity-20 border border-white border-opacity-40 flex items-center justify-center mb-4 backdrop-blur-sm`}>
            <Icon size={28} className="text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">{cat.name}</h1>
          <p className="text-white/80 text-sm md:text-base">{cat.description}</p>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-5 pt-5 pb-2">
        <Breadcrumb crumbs={[
          { label: 'Home',         href: '/lucid/' },
          { label: 'All Services', href: '/lucid/services/all' },
          { label: cat.name },
        ]} />
      </div>

      {/* ── Sub-services grid ── */}
      <div className="max-w-6xl mx-auto px-5 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
          {cat.services.length} services in {cat.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cat.services.map(svc => (
            <Link
              key={svc.slug}
              to={`/lucid/services/${cat.slug}/${svc.slug}`}
            >
              <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 dark:border-[#1e293b] transition-all duration-200 group">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={svc.image}
                    alt={svc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{svc.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-500 mt-1">
                      <MapPin size={12} />
                      <span>See workers near you</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 dark:text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Other categories ── */}
      <div className="max-w-6xl mx-auto px-5 pb-14">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Explore other categories</h2>
        <div className="flex flex-wrap gap-3">
          {ALL_CATEGORIES.filter(c => c.slug !== cat.slug).map(c => {
            const CIcon = c.icon;
            return (
              <Link
                key={c.slug}
                to={`/lucid/services/${c.slug}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:shadow-sm ${c.color} ${c.iconColor} border-transparent hover:border-current`}
              >
                <CIcon size={14} />
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      <DownloadSection />
      <BackToTop />
    </div>
  );
};

export default Category;
