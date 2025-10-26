'use client';

import { useEffect, forwardRef } from 'react';
import { appLogger } from '@/lib/logger';

interface EnhancedContentProps {
  content: string;
  fontSize: number;
  onScroll: () => void;
}

export const EnhancedContent = forwardRef<HTMLDivElement, EnhancedContentProps>(
  ({ content, fontSize, onScroll }, ref) => {

  useEffect(() => {
    const element = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!element) return;

    // Find all code blocks and add copy buttons
    const codeBlocks = element.querySelectorAll('pre code, code');
    
    codeBlocks.forEach((codeBlock) => {
      const text = codeBlock.textContent || '';
      
      // Skip if it's just a short inline code snippet (less than 20 characters)
      if (text.length < 20 && codeBlock.tagName === 'CODE' && codeBlock.parentElement?.tagName !== 'PRE') {
        return;
      }

      // Skip if copy button already exists
      if (codeBlock.parentElement?.querySelector('.copy-button-wrapper')) {
        return;
      }

      // Create wrapper for copy button
      const parent = codeBlock.parentElement;
      if (!parent) return;

      // Make parent relative positioned
      parent.style.position = 'relative';
      parent.style.background = '#f8f9fa';
      parent.style.border = '1px solid #e9ecef';
      parent.style.borderRadius = '8px';
      parent.style.padding = '16px';
      parent.style.marginBottom = '16px';

      // Create copy button wrapper
      const copyWrapper = document.createElement('div');
      copyWrapper.className = 'copy-button-wrapper';
      copyWrapper.style.position = 'absolute';
      copyWrapper.style.top = '8px';
      copyWrapper.style.right = '8px';
      copyWrapper.style.zIndex = '10';

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'inline-flex items-center justify-center h-8 w-8 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors';
      copyButton.title = 'Copy to clipboard';
      copyButton.innerHTML = `
        <svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      `;

      // Add copy functionality
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text);
          
          // Show success state
          copyButton.innerHTML = `
            <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          `;
          copyButton.title = 'Copied!';
          
          // Reset after 2 seconds
          setTimeout(() => {
            copyButton.innerHTML = `
              <svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            `;
            copyButton.title = 'Copy to clipboard';
          }, 2000);
        } catch (err) {
          appLogger.error('Failed to copy:', { error: err, component: 'enhanced-content' });
          // Fallback method
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      });

      copyWrapper.appendChild(copyButton);
      parent.appendChild(copyWrapper);
    });

    // Also enhance any blockquotes that might contain prompts
    const blockquotes = element.querySelectorAll('blockquote');
    blockquotes.forEach((blockquote) => {
      const text = blockquote.textContent || '';
      
      // Only add copy to blockquotes that look like prompts (contain certain keywords)
      if (text.length > 30 && (
        text.toLowerCase().includes('copy this') ||
        text.toLowerCase().includes('paste this') ||
        text.toLowerCase().includes('prompt') ||
        text.toLowerCase().includes('try this') ||
        text.length > 100 // Long blockquotes are likely prompts
      )) {
        // Skip if copy button already exists
        if (blockquote.querySelector('.copy-button-wrapper')) {
          return;
        }

        blockquote.style.position = 'relative';
        blockquote.style.background = '#f0f9ff';
        blockquote.style.border = '1px solid #0ea5e9';
        blockquote.style.borderLeftWidth = '4px';
        blockquote.style.padding = '16px';
        blockquote.style.borderRadius = '8px';

        // Create copy button for blockquote
        const copyWrapper = document.createElement('div');
        copyWrapper.className = 'copy-button-wrapper';
        copyWrapper.style.position = 'absolute';
        copyWrapper.style.top = '8px';
        copyWrapper.style.right = '8px';

        const copyButton = document.createElement('button');
        copyButton.className = 'inline-flex items-center justify-center h-8 w-8 rounded-md bg-white border border-blue-300 hover:bg-blue-50 transition-colors';
        copyButton.title = 'Copy prompt to clipboard';
        copyButton.innerHTML = `
          <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        `;

        copyButton.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(text);
            copyButton.innerHTML = `
              <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            `;
            setTimeout(() => {
              copyButton.innerHTML = `
                <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              `;
            }, 2000);
          } catch (err) {
            appLogger.error('Failed to copy:', { error: err, component: 'enhanced-content' });
          }
        });

        copyWrapper.appendChild(copyButton);
        blockquote.appendChild(copyWrapper);
      }
    });
  }, [content]);

  return (
    <div
      ref={ref}
      className="overflow-y-auto lesson-enhanced-content"
      style={{ 
        fontSize: `${fontSize}px`, 
        lineHeight: 1.7
      }}
      onScroll={onScroll}
    >
      <div 
        className="lesson-text-content"
        style={{
          color: '#1f2937',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        dangerouslySetInnerHTML={{ 
          __html: content.replace(
            /style="[^"]*color[^"]*"/g, 
            'style="color: #1f2937 !important"'
          )
        }}
      />
    </div>
  );
});

EnhancedContent.displayName = 'EnhancedContent';
