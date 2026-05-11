import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './Button';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const EmptyState = ({ icon: Icon, heading, description, action }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="bg-white rounded-xl p-12 shadow-md text-center">
        {Icon && <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{heading}</h3>
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}
        {action && (
          <Link to={action.to}>
            <Button variant="primary" size="md">
              {action.label}
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};
