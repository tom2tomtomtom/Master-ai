#!/bin/bash

# Master-AI Design Overhaul Implementation Script
# This script applies the warm, engaging design system to the project

set -e

echo "🎨 Starting Master-AI Design Overhaul..."
echo "This will transform the UI from cold/white to warm/engaging dark theme"

# Create backup directory
BACKUP_DIR="backups/design-overhaul-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Files to update
FILES_TO_BACKUP=(
    "src/app/globals.css"
    "tailwind.config.js"
    "src/app/page.tsx"
    "src/components/lesson-cards/enhanced-lesson-card.tsx"
    "src/components/dashboard/sidebar.tsx"
)

# Backup existing files
echo "📦 Backing up existing files..."
for file in "${FILES_TO_BACKUP[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
        echo "  ✓ Backed up $file"
    fi
done

# Apply the new design files
echo "🎨 Applying new design system..."

# 1. Update globals.css
echo "  → Updating globals.css with warm dark theme..."
cp design-overhaul/globals.css src/app/globals.css

# 2. Update tailwind.config.js
echo "  → Updating Tailwind configuration..."
cat > tailwind.config.js << 'EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        
        "bg-primary": "rgb(var(--bg-primary) / <alpha-value>)",
        "bg-secondary": "rgb(var(--bg-secondary) / <alpha-value>)",
        "bg-tertiary": "rgb(var(--bg-tertiary) / <alpha-value>)",
        "bg-elevated": "rgb(var(--bg-elevated) / <alpha-value>)",
        
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--text-tertiary) / <alpha-value>)",
        
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--error) / <alpha-value>)",
          foreground: "rgb(255 255 255 / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%": { transform: "translateY(-10px) rotate(1deg)" },
          "66%": { transform: "translateY(5px) rotate(-1deg)" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "pulse-glow": {
          "0%": { boxShadow: "0 0 0 0 rgba(139, 92, 246, 0.4)" },
          "70%": { boxShadow: "0 0 0 20px rgba(139, 92, 246, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        gradient: "gradient 3s ease infinite",
        "pulse-glow": "pulse-glow 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config;
EOF

# 3. Install required dependencies if not present
echo "📦 Checking dependencies..."
if ! grep -q "framer-motion" package.json; then
    echo "  → Installing framer-motion..."
    npm install framer-motion
fi

# 4. Update components
echo "🔧 Updating components..."

# Copy new components if they exist in design-overhaul
if [ -f "design-overhaul/lesson-card.tsx" ]; then
    echo "  → Updating lesson card component..."
    mkdir -p src/components/lesson-cards
    cp design-overhaul/lesson-card.tsx src/components/lesson-cards/enhanced-lesson-card.tsx
fi

if [ -f "design-overhaul/dashboard-sidebar.tsx" ]; then
    echo "  → Updating dashboard sidebar..."
    mkdir -p src/components/dashboard
    cp design-overhaul/dashboard-sidebar.tsx src/components/dashboard/sidebar.tsx
fi

# 5. Create a sample updated home page (optional - user can review and apply)
if [ -f "design-overhaul/home-page.tsx" ]; then
    echo "  → Created sample home page in design-overhaul/home-page.tsx"
    echo "    Review and copy to src/app/page.tsx when ready"
fi

# 6. Build to verify
echo "🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Design overhaul applied successfully!"
    echo ""
    echo "🎨 What's changed:"
    echo "  • Warm dark theme as default (no more cold white)"
    echo "  • Gradient accents and animations"
    echo "  • Glassmorphic effects and depth"
    echo "  • Enhanced hover states and micro-interactions"
    echo "  • Modern card designs with elevation"
    echo "  • Animated backgrounds and floating elements"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Review the changes in your local development server"
    echo "  2. Update remaining components to match the new design system"
    echo "  3. Test responsive behavior on mobile devices"
    echo "  4. Consider adding sound effects for interactions (optional)"
    echo ""
    echo "🔄 To rollback:"
    echo "  cp $BACKUP_DIR/*.backup src/"
else
    echo "❌ Build failed. Rolling back changes..."
    # Restore backups
    for file in "${FILES_TO_BACKUP[@]}"; do
        backup_file="$BACKUP_DIR/$(basename $file).backup"
        if [ -f "$backup_file" ]; then
            cp "$backup_file" "$file"
        fi
    done
    echo "🔄 Changes rolled back."
    exit 1
fi