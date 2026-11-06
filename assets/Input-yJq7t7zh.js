import{r as x,j as e}from"./index-CQ3hDsGH.js";const b=({label:a,error:r,helperText:l,required:o=!1,endIcon:s,className:i="",id:n,...t})=>{const c=x.useId(),d=n||c;return e.jsxs("div",{className:"flex flex-col gap-2",children:[a&&e.jsxs("label",{htmlFor:d,className:"label font-medium text-gray-700 dark:text-slate-300",children:[a,o&&e.jsx("span",{className:"text-error ml-1",children:"*"})]}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{id:d,"aria-label":a?void 0:t.placeholder||t.name,className:`
            w-full px-4 py-2.5 border-2 rounded-xl text-gray-700 dark:text-slate-200
            transition-all duration-200
            bg-white dark:bg-[#252b3b] focus:outline-none focus:ring-2
            disabled:bg-gray-100 dark:disabled:bg-[#1a1f2e] disabled:cursor-not-allowed
            dark:placeholder-slate-500
            ${r?"border-error focus:border-error focus:ring-error/20":"border-gray-300 dark:border-[#2d3748] focus:border-primary focus:ring-blue-100 dark:focus:ring-blue-900/40"}
            ${s?"pr-12":""}
            ${i}
          `,...t}),s&&e.jsx("div",{className:"absolute right-3 top-1/2 -translate-y-1/2",children:s})]}),r&&e.jsx("span",{className:"text-error text-sm",children:r}),l&&!r&&e.jsx("span",{className:"text-gray-600 dark:text-slate-400 text-sm",children:l})]})};export{b as I};
