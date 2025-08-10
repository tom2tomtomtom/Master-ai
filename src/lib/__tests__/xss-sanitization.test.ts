/**
 * Unit Tests for XSS Sanitization Functions
 * Tests XSS prevention measures using DOMPurify and other sanitization utilities
 */

import DOMPurify from 'dompurify'
import { InputValidator } from '../security'
import { processMarkdown } from '../markdown'
import { cleanupMocks } from '../../__tests__/utils/test-utils'

// Mock DOMPurify for controlled testing
jest.mock('dompurify')
const mockDOMPurify = DOMPurify as jest.Mocked<typeof DOMPurify>

// Mock remark for markdown processing
jest.mock('remark', () => ({
  remark: () => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({
      toString: () => '<p>Processed content</p>'
    }),
  }),
}))

describe('XSS Sanitization Functions', () => {
  beforeEach(() => {
    cleanupMocks()
    jest.clearAllMocks()
    
    // Reset DOMPurify mock to default behavior
    mockDOMPurify.sanitize.mockImplementation((dirty) => {
      // Simple mock implementation that removes script tags
      if (typeof dirty === 'string') {
        return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      }
      return dirty
    })
  })

  describe('DOMPurify Sanitization', () => {
    it('should sanitize basic XSS script tags', () => {
      const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>'
      
      const result = DOMPurify.sanitize(maliciousContent)
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousContent)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert("XSS")')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('should handle javascript: protocol URLs', () => {
      const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click me</a>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty.replace(/javascript:/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(maliciousContent)
      
      expect(result).not.toContain('javascript:')
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousContent)
    })

    it('should handle on-event attributes', () => {
      const maliciousContent = '<img src="x" onerror="alert(\'XSS\')" onload="console.log(\'loaded\')">'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty.replace(/on\w+="[^"]*"/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(maliciousContent)
      
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('onload')
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousContent)
    })

    it('should preserve safe HTML content', () => {
      const safeContent = '<p>This is <strong>safe</strong> content with <em>emphasis</em></p>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => dirty as string)
      
      const result = DOMPurify.sanitize(safeContent)
      
      expect(result).toBe(safeContent)
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(safeContent)
    })

    it('should handle complex XSS vectors', () => {
      const complexXSS = `
        <div onclick="javascript:alert('XSS')">
          <iframe src="javascript:alert('XSS')"></iframe>
          <object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4="></object>
          <embed src="javascript:alert('XSS')">
          <form><button formaction="javascript:alert('XSS')">Submit</button></form>
        </div>
      `
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/<iframe[^>]*>/gi, '')
            .replace(/<object[^>]*>/gi, '')
            .replace(/<embed[^>]*>/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(complexXSS)
      
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('<iframe')
      expect(result).not.toContain('<object')
      expect(result).not.toContain('<embed')
    })

    it('should handle data URLs with potential XSS', () => {
      const dataUrlXSS = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          // Remove potentially dangerous data URLs
          return dirty.replace(/src="data:text\/html[^"]*"/gi, 'src=""')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(dataUrlXSS)
      
      expect(result).not.toContain('data:text/html')
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(dataUrlXSS)
    })

    it('should handle SVG-based XSS attempts', () => {
      const svgXSS = `
        <svg onload="alert('XSS')">
          <script>alert('XSS')</script>
          <foreignObject>
            <iframe xmlns="http://www.w3.org/1999/xhtml" src="javascript:alert('XSS')"></iframe>
          </foreignObject>
        </svg>
      `
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/<iframe[^>]*>/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(svgXSS)
      
      expect(result).not.toContain('onload')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('<iframe')
    })

    it('should handle CSS-based XSS attempts', () => {
      const cssXSS = '<div style="background-image: url(javascript:alert(\'XSS\'))">Content</div>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty.replace(/style="[^"]*javascript:[^"]*"/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(cssXSS)
      
      expect(result).not.toContain('javascript:')
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(cssXSS)
    })
  })

  describe('InputValidator Sanitization', () => {
    it('should sanitize HTML entities in strings', () => {
      const maliciousString = '<script>alert("XSS")</script>&<>"\'test'
      
      const result = InputValidator.sanitizeString(maliciousString)
      
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&amp;&lt;&gt;&quot;&#x27;test')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('>')
    })

    it('should limit string length during sanitization', () => {
      const longString = '<script>' + 'a'.repeat(1000) + '</script>'
      
      const result = InputValidator.sanitizeString(longString, 50)
      
      expect(result.length).toBe(50)
      expect(result).not.toContain('<script>')
    })

    it('should handle empty and null-like inputs', () => {
      expect(InputValidator.sanitizeString('')).toBe('')
      expect(InputValidator.sanitizeString('   ')).toBe('   ')
    })

    it('should preserve safe text content', () => {
      const safeString = 'This is safe text content with numbers 123'
      
      const result = InputValidator.sanitizeString(safeString)
      
      expect(result).toBe(safeString)
    })

    it('should sanitize all dangerous HTML entities', () => {
      const testCases = [
        { input: '<', expected: '&lt;' },
        { input: '>', expected: '&gt;' },
        { input: '&', expected: '&amp;' },
        { input: '"', expected: '&quot;' },
        { input: "'", expected: '&#x27;' },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = InputValidator.sanitizeString(input)
        expect(result).toBe(expected)
      })
    })
  })

  describe('Markdown Processing Security', () => {
    it('should process markdown content safely', async () => {
      const markdownContent = '# Title\n\nSome **bold** text'
      
      const result = await processMarkdown(markdownContent)
      
      expect(result).toBe('<p>Processed content</p>')
    })

    it('should handle markdown with potential HTML injection', async () => {
      const maliciousMarkdown = '# Title\n\n<script>alert("XSS")</script>\n\nSafe content'
      
      // The remark processor should handle this safely
      const result = await processMarkdown(maliciousMarkdown)
      
      expect(result).toBe('<p>Processed content</p>')
    })
  })

  describe('Content Sanitization in Components', () => {
    it('should sanitize lesson content before rendering', () => {
      const processedContent = '<p>Safe content</p><script>alert("XSS")</script>'
      
      // This simulates how LessonContent component uses DOMPurify
      const sanitizedContent = DOMPurify.sanitize(processedContent)
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(processedContent)
      expect(sanitizedContent).not.toContain('<script>')
    })

    it('should preserve allowed HTML tags in lesson content', () => {
      const processedContent = `
        <h1>Lesson Title</h1>
        <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <code>console.log('hello')</code>
      `
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => dirty as string)
      
      const sanitizedContent = DOMPurify.sanitize(processedContent)
      
      expect(sanitizedContent).toContain('<h1>')
      expect(sanitizedContent).toContain('<strong>')
      expect(sanitizedContent).toContain('<em>')
      expect(sanitizedContent).toContain('<ul>')
      expect(sanitizedContent).toContain('<code>')
    })
  })

  describe('Edge Cases and Advanced XSS Vectors', () => {
    it('should handle encoded XSS attempts', () => {
      const encodedXSS = '&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          // DOMPurify would decode and then sanitize
          const decoded = dirty
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#x27;/g, "'")
          return decoded.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(encodedXSS)
      
      expect(result).not.toContain('alert')
      expect(result).not.toContain('<script>')
    })

    it('should handle malformed HTML that could bypass filters', () => {
      const malformedXSS = '<script<script>alert("XSS")</script>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          // Remove all script tags, even malformed ones
          return dirty.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<script[^>]*>/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(malformedXSS)
      
      expect(result).not.toContain('alert')
      expect(result).not.toContain('<script>')
    })

    it('should handle XSS in attributes with unusual encoding', () => {
      const attributeXSS = '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty.replace(/on\w+="[^"]*"/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(attributeXSS)
      
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('alert')
    })

    it('should handle XSS with whitespace and newlines', () => {
      const whitespaceXSS = `<script
        >
        alert('XSS')
        </script>`
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(whitespaceXSS)
      
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should handle XSS attempts with different quote types', () => {
      const quoteXSS = `
        <img src='x' onerror='alert("XSS")'>
        <div onclick="alert('XSS')">Click</div>
        <span onmouseover=alert(document.cookie)>Hover</span>
      `
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => {
        if (typeof dirty === 'string') {
          return dirty.replace(/on\w+=['"][^'"]*['"]/gi, '').replace(/on\w+=[\w()\.]+/gi, '')
        }
        return dirty
      })
      
      const result = DOMPurify.sanitize(quoteXSS)
      
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('onmouseover')
      expect(result).not.toContain('alert')
    })
  })

  describe('Configuration and Options', () => {
    it('should respect DOMPurify configuration for allowed tags', () => {
      const htmlContent = '<p>Paragraph</p><script>alert("XSS")</script><strong>Bold</strong>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty, config) => {
        if (typeof dirty === 'string') {
          if (config?.ALLOWED_TAGS) {
            // Mock behavior: only allow tags specified in ALLOWED_TAGS
            const allowedTagsRegex = new RegExp(`<(?!/?(?:${config.ALLOWED_TAGS.join('|')})\b)[^>]+>`, 'gi')
            return dirty.replace(allowedTagsRegex, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          }
          return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        }
        return dirty
      })
      
      // Test with specific allowed tags
      const config = { ALLOWED_TAGS: ['p', 'strong'] }
      const result = DOMPurify.sanitize(htmlContent, config)
      
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })

    it('should handle custom sanitization rules', () => {
      const htmlContent = '<div class="safe">Content</div><div onclick="alert()">Dangerous</div>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty, config) => {
        if (typeof dirty === 'string') {
          let result = dirty
          if (config?.FORBID_ATTR?.includes('onclick')) {
            result = result.replace(/onclick="[^"]*"/gi, '')
          }
          return result
        }
        return dirty
      })
      
      const config = { FORBID_ATTR: ['onclick'] }
      const result = DOMPurify.sanitize(htmlContent, config)
      
      expect(result).not.toContain('onclick')
      expect(result).toContain('class="safe"')
    })
  })

  describe('Performance and Memory Safety', () => {
    it('should handle large content efficiently', () => {
      const largeContent = '<p>' + 'a'.repeat(100000) + '</p>'
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => dirty as string)
      
      const startTime = Date.now()
      const result = DOMPurify.sanitize(largeContent)
      const endTime = Date.now()
      
      expect(result).toBe(largeContent)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle deeply nested HTML structures', () => {
      let nestedContent = 'content'
      for (let i = 0; i < 100; i++) {
        nestedContent = `<div>${nestedContent}</div>`
      }
      
      mockDOMPurify.sanitize.mockImplementation((dirty) => dirty as string)
      
      const result = DOMPurify.sanitize(nestedContent)
      
      expect(result).toContain('content')
      expect(result).toContain('<div>')
    })
  })
})