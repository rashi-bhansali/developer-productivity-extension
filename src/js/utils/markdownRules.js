export function parseMarkdown(markdownText) {
  const rules = [
    { regex: /###### (.*?)(\n|$)/g, replacement: '<h6>$1</h6>' },
    { regex: /##### (.*?)(\n|$)/g, replacement: '<h5>$1</h5>' },
    { regex: /#### (.*?)(\n|$)/g, replacement: '<h4>$1</h4>' },
    { regex: /### (.*?)(\n|$)/g, replacement: '<h3>$1</h3>' },
    { regex: /## (.*?)(\n|$)/g, replacement: '<h2>$1</h2>' },
    { regex: /# (.*?)(\n|$)/g, replacement: '<h1>$1</h1>' },

    // Handle bold
    { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },

    // Handle italic
    { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },

    // Handle strikethrough
    { regex: /~~(.*?)~~/g, replacement: '<del>$1</del>' },

    // Multi-line code blocks
    {
      regex: /```([\s\S]*?)```/g,
      replacement: '<pre><code>$1</code></pre>',
    },

    // Inline code
    {
      regex: /`([^`\n]+)`/g,
      replacement: '<code>$1</code>',
    },

    // Handle horizontal rules
    // Handle --- after a heading (horizontal rule case)
    { regex: /(\n?)\n?---\n/g, replacement: '\n<hr />\n' },

    // Replace any remaining newlines carefully after horizontal rules
    { regex: /(?<!^)\n(?!$)/g, replacement: '<br />' },

    // Handle links
    {
      regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      replacement:
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    },

    {
      regex: /(?<!<\/li>|<\/ul>|<\/ol>|<\/h\d>|<\/pre>)\n/g,
      replacement: '<br />',
    },
  ];

  // Handle nested lists specifically
  function handleLists(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    const stack = [];

    function closeListsToIndent(indent, tag) {
      while (stack.length > 0) {
        const currentList = stack[stack.length - 1];
        if (
          currentList.indent > indent ||
          (currentList.indent === indent && currentList.tag !== tag)
        ) {
          html += `</${stack.pop().tag}>`;
          continue;
        }
        break;
      }
    }

    function closeAllLists() {
      while (stack.length > 0) {
        html += `</${stack.pop().tag}>`;
      }
    }

    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
      const unorderedListMatch = line.match(/^(\s*)(?:[-*+])\s+(.*)/);
      const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.*)/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];

        closeAllLists();

        html += `<h${level}>${content}</h${level}><br />`;
      } else if (unorderedListMatch || orderedListMatch) {
        const isOrdered = Boolean(orderedListMatch);
        const match = orderedListMatch || unorderedListMatch;
        const indent = match[1].length;
        const content = match[2];
        const tag = isOrdered ? 'ol' : 'ul';

        closeListsToIndent(indent, tag);

        if (
          stack.length === 0 ||
          stack[stack.length - 1].indent < indent ||
          stack[stack.length - 1].tag !== tag
        ) {
          html += `<${tag}>`;
          stack.push({ indent, tag });
        }

        html += `<li>${content}</li>`;
      } else {
        closeAllLists();
        html += line + '\n';
      }
    });

    closeAllLists();

    return html;
  }

  let htmlText = markdownText;

  // First, process nested lists
  htmlText = handleLists(htmlText);

  // Then, apply other markdown rules
  rules.forEach((rule) => {
    htmlText = htmlText.replace(rule.regex, rule.replacement);
  });
  return htmlText;
}
