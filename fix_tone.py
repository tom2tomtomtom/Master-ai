#!/usr/bin/env python3
"""
Master-AI Curriculum Tone Fixer
Automatically adjusts hyperbolic language to professional tone
"""

import os
import re
import argparse
from typing import Dict, List, Tuple

class ToneFixer:
    def __init__(self):
        # Define replacement patterns
        self.replacements = {
            # Overhyped words
            r'\b(ninja|wizard|superhero|rockstar|guru)\b': 'expert',
            r'\b(revolutionary|game-changing|mind-blowing)\b': 'advanced',
            r'\b(massive|insane|incredible) (time|results|ROI)\b': 'significant \\2',
            r'\b(transform you into|become a)\b': 'develop skills as',
            
            # Multiple exclamation points
            r'!!!+': '.',
            r'!!': '.',
            r'(\w)!(\s)': '\\1.\\2',
            
            # Unrealistic time claims
            r'save (\d+)\+ hours': 'save up to \\1 hours',
            r'(\d+)\+ hours per week': '\\1 hours per week',
            r'10\+ hours': '2-4 hours',
            r'5\+ hours': '1-3 hours',
            
            # Percentage claims
            r'90% less time': '50-70% less time',
            r'10x faster': '2-3x faster',
            r'(\d+)00% (productivity|ROI|improvement)': '\\g<1>0-\\g<1>00% \\2',
            
            # Guarantee language
            r'guaranteed results': 'typical results',
            r'will definitely': 'typically will',
            r'always works': 'consistently effective',
            
            # Overgeneralizations
            r'Everyone knows': 'Many professionals find',
            r'Nobody likes': 'Many people struggle with',
            r'We all hate': 'It\'s challenging when',
        }
        
        # Emoji reduction patterns
        self.emoji_patterns = {
            r'🚀🚀+': '🚀',
            r'🎉🎉+': '🎉',
            r'💪💪+': '💪',
            r'🔥🔥+': '🔥',
        }
        
    def fix_tone(self, content: str) -> Tuple[str, int]:
        """Fix tone issues in content and return fixed content with change count"""
        changes = 0
        
        # Apply text replacements
        for pattern, replacement in self.replacements.items():
            new_content, count = re.subn(pattern, replacement, content, flags=re.IGNORECASE)
            changes += count
            content = new_content
        
        # Reduce excessive emojis
        for pattern, replacement in self.emoji_patterns.items():
            new_content, count = re.subn(pattern, replacement, content)
            changes += count
            content = new_content
        
        # Fix specific phrases
        content = self.fix_specific_phrases(content)
        
        return content, changes
    
    def fix_specific_phrases(self, content: str) -> str:
        """Fix specific problematic phrases"""
        fixes = {
            "Save massive time": "Save significant time",
            "Incredible results": "Measurable results",
            "Mind-blowing features": "Advanced features",
            "Life-changing tool": "Productivity-enhancing tool",
            "Never struggle again": "Reduce common challenges",
            "Perfect every time": "Consistently effective",
            "Zero effort": "Minimal effort after setup",
        }
        
        for old, new in fixes.items():
            content = content.replace(old, new)
            content = content.replace(old.lower(), new.lower())
            
        return content
    
    def add_disclaimers(self, content: str) -> str:
        """Add appropriate disclaimers to sections"""
        # Add disclaimer after time-saving claims
        time_pattern = r'(save.{0,20}hours.{0,20}per week)'
        disclaimer = "\\1 (after initial learning period)"
        content = re.sub(time_pattern, disclaimer, content, count=1)
        
        # Add note about individual results
        if "Your Progress" in content and "individual results may vary" not in content:
            content = content.replace(
                "## 🎮 **Your Progress**",
                "## 🎮 **Your Progress**\n\n*Note: Individual results may vary based on use case and consistency.*"
            )
        
        return content
    
    def process_file(self, filepath: str) -> Dict:
        """Process a single file and return results"""
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Fix tone
        fixed, changes = self.fix_tone(original)
        
        # Add disclaimers
        fixed = self.add_disclaimers(fixed)
        
        # Calculate metrics
        exclamation_before = original.count('!')
        exclamation_after = fixed.count('!')
        
        results = {
            'file': os.path.basename(filepath),
            'changes': changes,
            'exclamation_reduction': exclamation_before - exclamation_after,
            'size_before': len(original),
            'size_after': len(fixed),
        }
        
        # Write fixed content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        
        return results

def main():
    parser = argparse.ArgumentParser(description='Fix tone in Master-AI curriculum')
    parser.add_argument('--path', default='/users/thomasdowuona-hyde/Master-AI', 
                        help='Path to curriculum directory')
    parser.add_argument('--lessons', nargs='+', 
                        help='Specific lesson numbers to process (e.g., 1 2 3)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show what would be changed without modifying files')
    
    args = parser.parse_args()
    
    fixer = ToneFixer()
    
    # Get lesson files to process
    if args.lessons:
        files = [f"lesson-{int(num):02d}-*.md" for num in args.lessons]
    else:
        files = ["lesson-*.md"]
    
    # Process files
    total_changes = 0
    total_exclamation_reduction = 0
    
    for pattern in files:
        for filepath in glob.glob(os.path.join(args.path, pattern)):
            if args.dry_run:
                print(f"Would process: {filepath}")
            else:
                results = fixer.process_file(filepath)
                total_changes += results['changes']
                total_exclamation_reduction += results['exclamation_reduction']
                print(f"Processed {results['file']}: {results['changes']} changes, "
                      f"{results['exclamation_reduction']} fewer exclamation points")
    
    print(f"\nTotal: {total_changes} changes, {total_exclamation_reduction} exclamation points removed")

if __name__ == "__main__":
    import glob
    main()
