import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useFavourites } from '../contexts/FavouritesContext';
import { ProfileCard } from '../components/shared';
import { PageHeader } from '../components/ui';
import { DownloadSection } from '../components/download_ad';

// [API] Replace useFavourites() with GET /users/:id/favourites → [{ id, name, role, location, rating, image }]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const Favourites = () => {
  const handleBackClick = useNavigateBack('/lucid/dashboard', 400);
  const { favouriteProviders } = useFavourites();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <PageHeader
        title="Favourite Providers"
        subtitle={
          favouriteProviders.length > 0
            ? `${favouriteProviders.length} saved provider${favouriteProviders.length !== 1 ? 's' : ''}`
            : 'Providers you have saved'
        }
        onBack={handleBackClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favouriteProviders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-[#252b3b] rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-300 dark:text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              No saved providers yet
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-sm">
              Tap the heart icon on any provider's card or profile to save them here for quick access.
            </p>
            <Link
              to="/lucid/services"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold"
            >
              <Search className="w-4 h-4" />
              Browse Providers
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {favouriteProviders.map((provider) => (
              <motion.div key={provider.id} variants={fadeUp}>
                <ProfileCard
                  id={provider.id}
                  name={provider.name}
                  role={provider.role}
                  location={provider.location}
                  rating={provider.rating}
                  image={provider.image}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <DownloadSection />
    </div>
  );
};

export default Favourites;
