/**
 * Simple utility function tests
 */

import { cn } from '../utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('should combine class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional class names', () => {
      const result = cn('class1', false && 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class3')
      expect(result).not.toContain('class2')
    })

    it('should handle undefined values', () => {
      const result = cn('class1', undefined, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should work with empty input', () => {
      const result = cn()
      expect(typeof result).toBe('string')
    })
  })
})