import { Car, CarFront, Droplets, Hammer, HardHat, Sparkles, Wrench, Zap } from 'lucide-react';
import constructionImage from '../../assets/catalog/building-construction.webp';
import cleanerImage from '../../assets/catalog/office-cleaning.webp';
import { LAUNCH_CATEGORIES } from './launchServices.js';

const ICONS = { hammer: Hammer, car: Car, sparkles: Sparkles, hardhat: HardHat };
const SERVICE_ICONS = { droplets: Droplets, zap: Zap, hammer: Hammer, wrench: Wrench, 'car-front': CarFront, sparkles: Sparkles, hardhat: HardHat };
const IMAGES = {
  homeRepairs: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format',
  autoRepairs: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format',
  cleaning: cleanerImage,
  construction: constructionImage,
  plumber: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&auto=format',
  electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format',
  carpenter: 'https://images.unsplash.com/photo-1767389193137-77d6f9b8b56a?auto=format&fit=crop&w=800&q=80',
  handyman: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format',
  autoMechanic: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&auto=format',
  cleaner: cleanerImage,
  constructionWorker: constructionImage,
};

export const ALL_CATEGORIES = LAUNCH_CATEGORIES.map(category => ({
  ...category,
  icon: ICONS[category.iconKey],
  image: IMAGES[category.imageKey],
  services: category.services.map(service => ({ ...service, icon: SERVICE_ICONS[service.iconKey], image: IMAGES[service.imageKey] })),
}));

export const getCategoryBySlug = slug => ALL_CATEGORIES.find(category => category.slug === slug) ?? null;
export const getServiceBySlug = (categorySlug, serviceSlug) =>
  getCategoryBySlug(categorySlug)?.services.find(service => service.slug === serviceSlug) ?? null;
