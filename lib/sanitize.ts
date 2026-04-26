import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Uses isomorphic-dompurify which works on both server and client.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "p", "a", "ul", "ol",
      "nl", "li", "b", "i", "strong", "em",
      "strike", "code", "hr", "br", "div",
      "table", "thead", "caption", "tbody",
      "tr", "th", "td", "pre", "iframe",
      "img", "span", "sub", "sup"
    ],
    ALLOWED_ATTR: ["href", "name", "target", "src", "alt", "title", "class", "style"],
  });
}
