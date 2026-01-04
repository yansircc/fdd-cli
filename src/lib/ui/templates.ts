import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// CSS styles - Craigslist-inspired minimal design
const STYLES = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background: #fff;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

a {
  color: #0000cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

a:visited {
  color: #551a8b;
}

h1 {
  font-size: 18px;
  font-weight: normal;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ccc;
}

.header {
  margin-bottom: 20px;
}

.header a {
  font-size: 12px;
  color: #666;
}

/* List page */
.spec-list {
  list-style: none;
}

.spec-list li {
  padding: 8px 0;
  border-bottom: 1px dotted #ddd;
}

.spec-list li:last-child {
  border-bottom: none;
}

.spec-name {
  font-weight: 500;
}

.empty-message {
  color: #666;
  font-style: italic;
}

/* Detail page */
.section {
  margin-bottom: 30px;
}

.section-header {
  font-size: 14px;
  font-weight: bold;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.section-content {
  padding-left: 0;
}

/* Markdown content styling */
.section-content h1 { font-size: 16px; margin: 15px 0 10px; font-weight: 600; }
.section-content h2 { font-size: 14px; margin: 12px 0 8px; font-weight: 600; }
.section-content h3 { font-size: 13px; margin: 10px 0 6px; font-weight: 600; }
.section-content p { margin: 8px 0; }
.section-content ul, .section-content ol { margin: 8px 0; padding-left: 20px; }
.section-content li { margin: 4px 0; }
.section-content pre {
  background: #f5f5f5;
  padding: 10px;
  overflow-x: auto;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 12px;
  border-radius: 3px;
}
.section-content code {
  background: #f5f5f5;
  padding: 1px 4px;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 12px;
  border-radius: 2px;
}
.section-content pre code {
  background: none;
  padding: 0;
}
.section-content blockquote {
  border-left: 3px solid #ddd;
  padding-left: 10px;
  color: #666;
  margin: 8px 0;
}
.section-content table {
  border-collapse: collapse;
  margin: 10px 0;
  width: 100%;
}
.section-content th, .section-content td {
  border: 1px solid #ddd;
  padding: 6px 10px;
  text-align: left;
}
.section-content th {
  background: #f5f5f5;
}

/* Related pits */
.related-pits {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.related-pits h2 {
  font-size: 14px;
  font-weight: bold;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.pit-list {
  list-style: none;
}

.pit-list li {
  padding: 6px 0;
}

.pit-id {
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 12px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 8px;
}

.loading {
  color: #666;
  font-style: italic;
}
`;

/**
 * Get the list page template
 */
export function getListTemplate(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FDD Specs</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="header">
    <h1>FDD Specs</h1>
  </div>

  <ul class="spec-list" id="spec-list">
    <li class="loading">Loading...</li>
  </ul>

  <script>
    async function loadSpecs() {
      try {
        const response = await fetch('/api/specs');
        const specs = await response.json();
        const list = document.getElementById('spec-list');

        if (specs.length === 0) {
          list.innerHTML = '<li class="empty-message">No specs found in .fdd/specs/</li>';
          return;
        }

        list.innerHTML = specs.map(spec =>
          '<li><a href="/spec/' + spec.name + '" class="spec-name">' + escapeHtml(spec.title) + '</a></li>'
        ).join('');
      } catch (error) {
        console.error('Failed to load specs:', error);
        document.getElementById('spec-list').innerHTML =
          '<li class="empty-message">Failed to load specs</li>';
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    loadSpecs();
  </script>
</body>
</html>`;
}

/**
 * Get the detail page template
 */
export function getDetailTemplate(specName: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spec: ${escapeHtml(specName)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="header">
    <a href="/">&larr; Back to list</a>
    <h1 id="spec-title">${escapeHtml(specName)}</h1>
  </div>

  <div id="content">
    <p class="loading">Loading...</p>
  </div>

  <div class="related-pits" id="related-pits" style="display: none;">
    <h2>Related Pits</h2>
    <ul class="pit-list" id="pit-list"></ul>
  </div>

  <script src="/vendor/marked.min.js"></script>
  <script src="/vendor/dompurify.min.js"></script>
  <script>
    const SPEC_NAME = ${JSON.stringify(specName)};

    // Configure marked with safe options
    marked.setOptions({
      gfm: true,
      breaks: false
    });

    // Safe render function - sanitize output with DOMPurify
    function renderMarkdown(md) {
      const html = marked.parse(md);
      return DOMPurify.sanitize(html);
    }

    // Convert relative links to anchors
    function convertLinksToAnchors(html, relatedPits) {
      const div = document.createElement('div');
      div.innerHTML = html;

      div.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Convert section links (stories.md -> #stories)
        const sectionMatch = href.match(/^(SPEC|stories|flows|context|constraints)\\.md$/i);
        if (sectionMatch) {
          link.setAttribute('href', '#' + sectionMatch[1].toLowerCase());
          return;
        }

        // Convert pit links to #related-pits anchor
        if (href.includes('/pits/') || href.includes('pit-')) {
          link.setAttribute('href', '#related-pits');
          return;
        }
      });

      return div.innerHTML;
    }

    async function loadSpec() {
      try {
        const response = await fetch('/api/spec/' + encodeURIComponent(SPEC_NAME));
        if (!response.ok) {
          throw new Error('Spec not found');
        }

        const spec = await response.json();
        const content = document.getElementById('content');

        // Render sections with id for anchor navigation
        // Skip section-header since markdown content already has its own h1 title
        content.innerHTML = spec.sections.map((section, index) => {
          const sectionId = section.name.toLowerCase();
          let rendered = renderMarkdown(section.content);

          // Remove first h1 from SPEC section (already shown in page header)
          if (index === 0) {
            const temp = document.createElement('div');
            temp.innerHTML = rendered;
            const firstH1 = temp.querySelector('h1');
            if (firstH1) firstH1.remove();
            rendered = temp.innerHTML;
          }

          const withAnchors = convertLinksToAnchors(rendered, spec.relatedPits);
          return '<div class="section" id="' + sectionId + '">' +
            '<div class="section-content">' + withAnchors + '</div>' +
          '</div>';
        }).join('');

        // Render related pits
        if (spec.relatedPits && spec.relatedPits.length > 0) {
          const pitsSection = document.getElementById('related-pits');
          const pitList = document.getElementById('pit-list');

          pitList.innerHTML = spec.relatedPits.map(pit =>
            '<li id="pit-' + escapeHtml(pit.id.toLowerCase()) + '">' +
              '<span class="pit-id">' + escapeHtml(pit.id) + '</span>' +
              '<span>' + escapeHtml(pit.title) + '</span>' +
            '</li>'
          ).join('');

          pitsSection.style.display = 'block';
        }

        // Update title
        const titleMatch = spec.sections[0]?.content.match(/^#\\s+(.+)/m);
        if (titleMatch) {
          document.getElementById('spec-title').textContent = titleMatch[1];
          document.title = 'Spec: ' + titleMatch[1];
        }
      } catch (error) {
        console.error('Failed to load spec:', error);
        document.getElementById('content').innerHTML =
          '<p class="empty-message">Failed to load spec: ' + escapeHtml(error.message) + '</p>';
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    loadSpec();
  </script>
</body>
</html>`;
}

/**
 * Escape HTML for template interpolation
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Get vendor script content (bundled for offline use)
 */
export async function getVendorScript(
	name: "marked" | "dompurify",
): Promise<string> {
	try {
		if (name === "marked") {
			// Use UMD build from node_modules
			const possiblePaths = [
				join(
					__dirname,
					"..",
					"..",
					"..",
					"node_modules",
					"marked",
					"lib",
					"marked.umd.js",
				),
				join(
					__dirname,
					"..",
					"..",
					"..",
					"..",
					"node_modules",
					"marked",
					"lib",
					"marked.umd.js",
				),
				join(process.cwd(), "node_modules", "marked", "lib", "marked.umd.js"),
			];

			for (const path of possiblePaths) {
				try {
					const file = Bun.file(path);
					if (await file.exists()) {
						return await file.text();
					}
				} catch {}
			}

			throw new Error("marked.js not found");
		}

		if (name === "dompurify") {
			const possiblePaths = [
				join(
					__dirname,
					"..",
					"..",
					"..",
					"node_modules",
					"dompurify",
					"dist",
					"purify.min.js",
				),
				join(
					__dirname,
					"..",
					"..",
					"..",
					"..",
					"node_modules",
					"dompurify",
					"dist",
					"purify.min.js",
				),
				join(
					process.cwd(),
					"node_modules",
					"dompurify",
					"dist",
					"purify.min.js",
				),
			];

			for (const path of possiblePaths) {
				try {
					const file = Bun.file(path);
					if (await file.exists()) {
						return await file.text();
					}
				} catch {}
			}

			throw new Error("dompurify not found");
		}

		throw new Error(`Unknown vendor: ${name}`);
	} catch (error) {
		console.error(`Failed to load vendor script ${name}:`, error);
		// Return a stub that logs an error
		return `console.error("Failed to load ${name}. XSS protection may not work properly.");`;
	}
}
