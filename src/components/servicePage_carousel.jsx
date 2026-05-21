import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const getVisibleCards = () => {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 768)  return 3;
  if (window.innerWidth >= 640)  return 2;
  return 1;
};

export default function ServicesCarousel({ services = [] }) {
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [visibleCards, setVisibleCards]   = useState(getVisibleCards);

  useEffect(() => {
    const onResize = () => setVisibleCards(getVisibleCards());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const maxIndex = Math.max(0, services.length - visibleCards);
  const next = () => setCurrentIndex(p => (p >= maxIndex ? 0 : p + 1));
  const prev = () => setCurrentIndex(p => (p <= 0 ? maxIndex : p - 1));

  return (
    <div className="px-8 lg:px-10 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">
          <span className="text-gray-900 dark:text-slate-100">Services you might </span>
          <span className="text-blue-600">also like</span>
        </h2>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
          >
            {services.map((service, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-3"
                style={{ width: `${100 / visibleCards}%` }}
              >
                <Link to={service.slug}>
                  <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                    <div className="relative overflow-hidden h-48">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{service.name}</h3>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={prev}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-[#252b3b] rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={20} className="text-gray-700 dark:text-slate-300" />
        </button>
        <button
          onClick={next}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-[#252b3b] rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={20} className="text-gray-700 dark:text-slate-300" />
        </button>

        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'bg-blue-600 w-6' : 'bg-gray-300 dark:bg-slate-600 w-2'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
