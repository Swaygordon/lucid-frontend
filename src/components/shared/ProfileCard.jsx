import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavourites } from '../../contexts/FavouritesContext';

/**
 * ProfileCard Component - Shared user/provider profile card
 * @param {string} id - Provider ID (UUID)
 * @param {string} name - User name
 * @param {string} role - User role/profession
 * @param {string} location - User location
 * @param {number} rating - User rating (0-5)
 * @param {number} maxRating - Maximum rating value
 * @param {string} image - Profile image URL
 * @param {boolean} isFavorite - Is favorite status
 * @param {function} onViewProfile - View profile callback
 * @returns {JSX.Element}
 */
const ProfileCardComponent = ({
  id,
  name = "Gabriel A. Gordon-Mensah",
  role = "Web Developer",
  location = "Kwabenya, Accra",
  rating = 4.0,
  maxRating = 5,
  image = null,
  onViewProfile = () => {}
}) => {
  const { isFavourite, toggleFavourite } = useFavourites();
  const favorite = id ? isFavourite(id) : false;

  const handleToggle = () => {
    if (!id) return;
    toggleFavourite({ id, name, role, location, rating, image });
  };

  const renderStars = () => {
    const r = rating ?? 0;
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <Star
          key={i}
          size={20}
          className={
            i <= Math.floor(r)
              ? 'fill-primary text-primary'
              : i - r < 1
              ? 'fill-primary/50 text-primary'
              : 'fill-none text-primary'
          }
        />
      );
    }
    return stars;
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile();
    }
  };

  return (
    <motion.div
      className="relative flex flex-col bg-white dark:bg-[#1a1f2e] rounded-2xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm hover:shadow-lg transition-shadow duration-300 p-3 sm:p-4 md:p-6 w-full h-full"
      whileHover={{ y: -2 }}
    >

      {/* Favorite */}
      <motion.button
        onClick={handleToggle}
        aria-label={favorite ? 'Remove from favourites' : 'Add to favourites'}
        aria-pressed={favorite}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-full transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Heart className={`w-5 h-5 ${favorite ? 'fill-error text-error' : 'text-gray-500 dark:text-slate-400'}`} />
      </motion.button>

      {/* Profile Image */}
      <div className="flex justify-center mb-4">
        <motion.div 
          className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center bg-gray-200 dark:bg-[#252b3b] overflow-hidden"
          whileHover={{ scale: 1.05 }}
        >
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <User size={36} className="text-gray-400 dark:text-slate-500" />
          )}
        </motion.div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 text-center mb-1">
        {name}
      </h2>

      <p className="text-gray-700 dark:text-slate-300 text-sm text-center mb-2">
        {role}
      </p>

      <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-slate-400 mb-3">
        <MapPin size={14} />
        <span className="text-xs">{location}</span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex gap-0.5">{renderStars()}</div>
        <span className="font-semibold">{rating != null ? rating.toFixed(1) : '—'}</span>
      </div>

      {/* FIXED: Removed hardcoded Link, now uses onClick callback */}
      <motion.button
        onClick={handleViewProfile}
        className="w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary-hover transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1f2e]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        View Profile
      </motion.button>
    </motion.div>
  );
};

export const ProfileCard = React.memo(ProfileCardComponent);