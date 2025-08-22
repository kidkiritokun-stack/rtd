const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configure DOMPurify for rich text content
const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'width', 'height', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    KEEP_CONTENT: true
  });
};

// More restrictive sanitization for custom HTML
const sanitizeCustomHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'section', 'article', 'header', 'footer', 'nav', 'aside',
      'figure', 'figcaption', 'main'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'href', 'src', 'alt', 'title', 'target', 'rel',
      'width', 'height', 'data-*', 'aria-*', 'role'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'],
    FORBID_ATTR: ['on*'],
    KEEP_CONTENT: true
  });
};

// Sanitize CSS (basic - remove dangerous properties)
const sanitizeCSS = (css) => {
  if (!css || typeof css !== 'string') return '';
  
  // Remove potentially dangerous CSS
  const dangerous = [
    /@import/gi,
    /javascript:/gi,
    /expression\s*\(/gi,
    /behavior\s*:/gi,
    /binding\s*:/gi,
    /-moz-binding/gi,
    /url\s*\(\s*["']?\s*javascript:/gi
  ];

  let cleanCSS = css;
  dangerous.forEach(pattern => {
    cleanCSS = cleanCSS.replace(pattern, '');
  });

  return cleanCSS.trim();
};

// Sanitize JavaScript (very restrictive)
const sanitizeJS = (js) => {
  if (!js || typeof js !== 'string') return '';
  
  // Remove dangerous JavaScript patterns
  const dangerous = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\.write/gi,
    /document\.writeln/gi,
    /innerHTML\s*=/gi,
    /outerHTML\s*=/gi,
    /fetch\s*\(/gi,
    /XMLHttpRequest/gi,
    /ActiveXObject/gi,
    /import\s*\(/gi,
    /require\s*\(/gi,
    /process\./gi,
    /global\./gi,
    /window\./gi,
    /document\./gi,
    /location\./gi,
    /history\./gi
  ];

  let cleanJS = js;
  dangerous.forEach(pattern => {
    cleanJS = cleanJS.replace(pattern, '/* REMOVED */');
  });

  return cleanJS.trim();
};

// Validate content size limits
const validateContentSize = (content, type) => {
  const limits = {
    html: 100 * 1024, // 100KB
    css: 50 * 1024,   // 50KB
    js: 25 * 1024     // 25KB
  };

  const limit = limits[type];
  if (!limit) return true;

  return content.length <= limit;
};

module.exports = {
  sanitizeHTML,
  sanitizeCustomHTML,
  sanitizeCSS,
  sanitizeJS,
  validateContentSize
};