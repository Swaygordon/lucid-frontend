import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ crumbs }) => (
  <nav
    className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    aria-label="Breadcrumb"
  >
    {crumbs.map((crumb, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight size={14} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />}
        {crumb.href ? (
          <Link
            to={crumb.href}
            className="hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            {crumb.label}
          </Link>
        ) : (
          <span className="text-gray-900 dark:text-slate-100 font-medium whitespace-nowrap flex-shrink-0">
            {crumb.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default Breadcrumb;
