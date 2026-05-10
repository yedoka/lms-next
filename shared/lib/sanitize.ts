import sanitizeHtmlLib from "sanitize-html";

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Uses sanitize-html which works natively on Node.js without jsdom issues.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  
  return sanitizeHtmlLib(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "p", "a", "ul", "ol",
      "nl", "li", "b", "i", "strong", "em",
      "strike", "code", "hr", "br", "div",
      "table", "thead", "caption", "tbody",
      "tr", "th", "td", "pre", "iframe",
      "img", "span", "sub", "sup"
    ],
    allowedAttributes: {
      "*": ["href", "name", "target", "src", "alt", "title", "class", "style"]
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'youtube.com', 'vimeo.com'],
  });
}
