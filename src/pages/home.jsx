import React, { memo, useState, useCallback, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { 
  FaTruck, FaBroom, FaWrench, FaTshirt, FaPaintRoller, 
  FaBoxes, FaScrewdriver, FaEllipsisH, FaWater, FaPlug, FaLeaf 
} from 'react-icons/fa';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Section1 from "./home_sections.jsx";
import BackgroundImage from "../assets/background.png";
import BackToTop from '../components/back_the_top_btn';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Service Icon Component
const ServiceIcon = memo(({ icon, name, to, isMore = false, index }) => {
  const IconComponent = icon;

  return (
    <motion.div
      className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => window.location.href = to}
    >
      <div className="relative w-16 h-16">
        <motion.div
          className={`absolute top-0 left-6 right-2 w-12 h-12 rounded-lg ${
            isMore ? 'bg-blue-300' : 'bg-blue-300'
          }`}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        />

        <motion.div
          className={`absolute btn btn-square top-3 left-3 w-12 h-12 rounded-lg flex items-center justify-center ${
            isMore ? 'bg-blue-700 hover:bg-blue-300' : 'bg-blue-700 hover:bg-blue-300'
          }`}
          whileHover={{ rotate: 5, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconComponent size={20} className="text-white" />
        </motion.div>
      </div>

      <p
        className={`text-center text-xs mt-1 whitespace-nowrap ${
          isMore ? 'text-black' : 'text-blue-700'
        }`}
      >
        {name}
      </p>
    </motion.div>
  );
});

ServiceIcon.displayName = 'ServiceIcon';

// Search Bar Component
const SearchBar = ({ onSearch, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    if (searchTerm.trim() && onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div 
      className="mt-8 sm:mt-12 flex justify-center px-4"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <motion.div 
        className="flex w-full max-w-2xl rounded-full shadow-lg overflow-hidden bg-white border-2 border-blue-700"
        whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.2 }}
      >
        <input
          type="text"
          placeholder="What service do you need?"
          className="flex-grow px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-black bg-white placeholder-gray-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <motion.button 
          className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 sm:py-3 rounded-r-full flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
          ) : (
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Service Icons Grid Component
const ServiceIconsGrid = memo(({ services = [], className = "" }) => (
  <motion.div
    className={className}
    variants={staggerContainer}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
  >
    {services.map((service, index) => (
      <ServiceIcon
        key={service.id}
        icon={service.icon}
        name={service.name}
        to={`/lucid/services?category=${service.slug}`}
        index={index}
      />
    ))}

    <ServiceIcon
      icon={FaEllipsisH}
      name="More"
      isMore={true}
      to="/lucid/all-services"
      index={services.length}
    />
  </motion.div>
));

ServiceIconsGrid.displayName = 'ServiceIconsGrid';

// Map icon names to components
const iconMap = {
  'Plumbing': FaWater,
  'Carpentry': FaWrench,
  'Electrical': FaPlug,
  'Cleaning': FaBroom,
  'Painting': FaPaintRoller,
  'Moving': FaTruck,
  'Gardening': FaLeaf,
  'Appliance Repair': FaScrewdriver,
  'HVAC': FaBoxes,
  'Roofing': FaTshirt
};

function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      console.log('Categories fetched:', data);

      if (data && data.length > 0) {
        // Transform categories to include icons
        const categoriesWithIcons = data.map(cat => ({
          ...cat,
          icon: iconMap[cat.name] || FaWrench
        }));
        setCategories(categoriesWithIcons);
      } else {
        // Set default categories if none in database
        setCategories([
          { id: '1', name: 'Plumbing', slug: 'plumbing', icon: FaWater },
          { id: '2', name: 'Electrical', slug: 'electrical', icon: FaPlug },
          { id: '3', name: 'Carpentry', slug: 'carpentry', icon: FaWrench },
          { id: '4', name: 'Cleaning', slug: 'cleaning', icon: FaBroom },
          { id: '5', name: 'Painting', slug: 'painting', icon: FaPaintRoller },
          { id: '6', name: 'Moving', slug: 'moving', icon: FaTruck },
          { id: '7', name: 'Gardening', slug: 'gardening', icon: FaLeaf },
          { id: '8', name: 'Appliance Repair', slug: 'appliance-repair', icon: FaScrewdriver },
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Failed to load service categories', 'error');
      // Set default categories if fetch fails
      setCategories([
        { id: '1', name: 'Plumbing', slug: 'plumbing', icon: FaWater },
        { id: '2', name: 'Electrical', slug: 'electrical', icon: FaPlug },
        { id: '3', name: 'Carpentry', slug: 'carpentry', icon: FaWrench },
        { id: '4', name: 'Cleaning', slug: 'cleaning', icon: FaBroom },
        { id: '5', name: 'Painting', slug: 'painting', icon: FaPaintRoller },
        { id: '6', name: 'Moving', slug: 'moving', icon: FaTruck },
        { id: '7', name: 'Gardening', slug: 'gardening', icon: FaLeaf },
        { id: '8', name: 'Appliance Repair', slug: 'appliance-repair', icon: FaScrewdriver },
      ]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = async (searchTerm) => {
    setSearchLoading(true);
    try {
      navigate(`/lucid/search?q=${encodeURIComponent(searchTerm)}`);
    } catch (error) {
      console.error('Search error:', error);
      showNotification('Failed to perform search', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex flex-col lg:min-h-screen bg-white">
        <div className="hero flex-1 w-full min-h-[29rem] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:min-h-screen bg-white">
        <div
          className="hero flex-1 w-full min-h-[29rem]"
          style={{
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="hero-overlay bg-transparent"></div>
          <div className="hero-content w-full text-neutral-content text-center px-4 sm:px-6">
            <div className="w-full max-w-4xl">
              {/* Heading */}
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold text-black leading-tight mb-4 sm:mb-6"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6 }}
              >
                Trusted help,<br />
                <span className="block">when and how you need it.</span>
              </motion.h1>

              {/* Paragraph */}
              <motion.p 
                className="text-base sm:text-base md:text-lg text-black leading-relaxed mb-8 px-4"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="text-orange-600 font-semibold">Connect</span> with{" "}
                <span className="text-orange-600 font-semibold">trusted workers</span> in
                your neighbourhood for home repairs, cleaning, moving, and more. Get
                started instantly.
              </motion.p>

              {/* Search Bar */}
              <SearchBar onSearch={handleSearch} isLoading={searchLoading} />

              {/* Desktop Category Grid */}
              {!loading && categories.length > 0 && (
                <div className="hidden lg:block mt-12 lg:mt-14 pb-6 w-full">
                  <ServiceIconsGrid 
                    services={categories} 
                    className="grid grid-cols-4 gap-4 lg:grid-cols-8 justify-items-center"
                  />
                  <motion.div 
                    className="divider max-w-7xl mx-auto mb-10 max-h-px bg-gray-300"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="hidden lg:block mt-12 lg:mt-14 pb-6 w-full">
                  <div className="grid grid-cols-4 gap-4 lg:grid-cols-8 justify-items-center">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Category Scroll */}
        {!loading && categories.length > 0 && (
          <motion.div 
            className="block lg:hidden w-full bg-white py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-x-auto scrollbar-hide">
              <ServiceIconsGrid 
                services={categories} 
                className="flex gap-4 px-4 pb-2"
              />
            </div>
            <motion.div 
              className="divider max-w-7xl mx-auto mb-10 max-h-px bg-gray-300"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        )}
      </div>
      
      <Section1 />
      <BackToTop />
    </>
  );
}

export default Home;