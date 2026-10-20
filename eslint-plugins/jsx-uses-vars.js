/**
 * ESLint's core no-unused-vars rule does not count JSX component names as
 * variable references. Mark component bindings used by JSX tags so the core
 * rule can still report genuinely unused variables without a React plugin.
 */
export default {
  rules: {
    'jsx-uses-vars': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Count component identifiers used in JSX as variable references',
        },
        schema: [],
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const markExpressionIdentifiers = (node) => {
          if (!node) return;
          if (node.type === 'Identifier') {
            sourceCode.markVariableAsUsed(node.name, node);
          }
          for (const key of sourceCode.visitorKeys[node.type] || []) {
            const child = node[key];
            if (Array.isArray(child)) child.forEach(markExpressionIdentifiers);
            else markExpressionIdentifiers(child);
          }
        };

        const markBaseIdentifier = (name, node) => {
          if (name.type === 'JSXIdentifier') {
            sourceCode.markVariableAsUsed(name.name, node);
            return;
          }

          if (name.type === 'JSXMemberExpression') {
            markBaseIdentifier(name.object, node);
          }
        };

        return {
          JSXExpressionContainer(node) {
            markExpressionIdentifiers(node.expression);
          },
          JSXOpeningElement(node) {
            const name = node.name;
            // Lowercase JSX names are normally HTML/SVG tags. Member expressions
            // such as <motion.div> still reference the `motion` JS binding.
            if (name.type === 'JSXMemberExpression' || /^[A-Z]/.test(name.name)) {
              markBaseIdentifier(name, node);
            }
          },
        };
      },
    },
  },
};
