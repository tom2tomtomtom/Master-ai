'use client';

import { useEffect, useState } from 'react';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    async function processMarkdown() {
      try {
        const result = await remark()
          .use(remarkGfm)
          .use(remarkHtml, { sanitize: false })
          .process(content);

        setHtmlContent(result.toString());
      } catch (error) {
        console.error('Error processing markdown:', error);
        // Fallback to plain text with basic formatting
        setHtmlContent(`<div class="whitespace-pre-wrap">${content}</div>`);
      }
    }

    processMarkdown();
  }, [content]);

  if (!htmlContent) {
    return <div className="animate-pulse bg-gray-100 rounded h-64" />;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
