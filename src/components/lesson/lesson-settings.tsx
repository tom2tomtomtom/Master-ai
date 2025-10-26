'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Settings, 
  Type, 
  Moon, 
  Sun,
  Minus,
  Plus,
  Monitor
} from 'lucide-react';

interface LessonSettingsProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  onClose: () => void;
}

export function LessonSettings({ 
  fontSize, 
  onFontSizeChange, 
  darkMode, 
  onDarkModeChange, 
  onClose 
}: LessonSettingsProps) {
  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    onFontSizeChange(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    onFontSizeChange(newSize);
  };

  const resetFontSize = () => {
    onFontSizeChange(16);
  };

  const fontSizeLabels: Record<number, string> = {
    12: 'Small',
    14: 'Small',
    16: 'Medium',
    18: 'Medium',
    20: 'Large', 
    22: 'Large',
    24: 'Extra Large'
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold">Reading Settings</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Font Size Settings */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-medium">Font Size</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseFontSize}
                disabled={fontSize <= 12}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl font-medium">{fontSize}px</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {fontSizeLabels[fontSize] || 'Custom'}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={increaseFontSize}
                disabled={fontSize >= 24}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFontSize}
              >
                Reset to Default
              </Button>
            </div>

            {/* Font Size Preview */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p 
                className="text-gray-700 dark:text-gray-300"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
              >
                This is how your lesson text will appear with the current font size setting.
              </p>
            </div>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-medium">Theme</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {darkMode ? (
                    <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">
                      {darkMode ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {darkMode 
                        ? 'Easier on the eyes in low light' 
                        : 'Better for bright environments'
                      }
                    </p>
                  </div>
                </div>
                <Toggle
                  pressed={darkMode}
                  onPressedChange={onDarkModeChange}
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Toggle>
              </div>
            </div>
          </div>
        </Card>

        {/* Reading Tips */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Reading Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Take breaks every 20-30 minutes</li>
              <li>• Use notes to capture key insights</li>
              <li>• Bookmark lessons for later review</li>
              <li>• Adjust font size for comfortable reading</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Settings are saved automatically and applied across all lessons
        </p>
      </div>
    </div>
  );
}