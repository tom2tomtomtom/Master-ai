'use client';

import Link from 'next/link';
import { 
  Brain, 
  Sparkles, 
  Users, 
  CheckCircle,
  ArrowRight,
  Star,
  Play,
  Target,
  BookOpen,
  Award
} from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';

const aiTools = [
  { name: 'ChatGPT', logo: '🤖', color: 'from-green-400 to-green-600' },
  { name: 'Claude', logo: '🧠', color: 'from-orange-400 to-orange-600' },
  { name: 'Gemini', logo: '✨', color: 'from-blue-400 to-blue-600' },
  { name: 'Midjourney', logo: '🎨', color: 'from-purple-400 to-purple-600' },
  { name: 'DALL-E', logo: '🖼️', color: 'from-pink-400 to-pink-600' },
  { name: 'Copilot', logo: '💻', color: 'from-indigo-400 to-indigo-600' },
];

const features = [
  {
    icon: BookOpen,
    title: '89 Comprehensive Lessons',
    description: 'Master every major AI tool with our structured curriculum designed by industry experts.'
  },
  {
    icon: Target,
    title: 'Hands-On Practice',
    description: 'Learn by doing with real-world projects and interactive exercises for immediate skill application.'
  },
  {
    icon: Award,
    title: 'Professional Certification',
    description: 'Earn recognized certificates that validate your AI expertise to employers and clients.'
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Join thousands of professionals accelerating their careers with AI mastery.'
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    company: "TechCorp",
    image: "/api/placeholder/64/64",
    quote: "Master-AI transformed how I approach marketing campaigns. I've increased my productivity by 300% using these AI tools.",
    rating: 5
  },
  {
    name: "Michael Rodriguez", 
    role: "Freelance Designer",
    company: "Independent",
    image: "/api/placeholder/64/64", 
    quote: "The structured lessons helped me master AI design tools. My income doubled within 3 months of completing the course.",
    rating: 5
  },
  {
    name: "Dr. Emily Watson",
    role: "Research Scientist",
    company: "BioTech Labs",
    image: "/api/placeholder/64/64",
    quote: "Finally, a comprehensive AI education platform that covers all the tools I need. The quality is exceptional.",
    rating: 5
  }
];

const stats = [
  { label: 'Students Enrolled', value: 12500, suffix: '+' },
  { label: 'Lessons Completed', value: 150000, suffix: '+' },
  { label: 'AI Tools Covered', value: 15, suffix: '+' },
  { label: 'Satisfaction Rate', value: 98, suffix: '%' }
];

function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {aiTools.map((tool, index) => (
        <div
          key={tool.name}
          className={cn(
            "absolute animate-float rounded-xl bg-gradient-to-r p-3 shadow-lg",
            tool.color,
            index === 0 && "top-20 right-20 animation-delay-0",
            index === 1 && "top-40 left-20 animation-delay-1000",
            index === 2 && "bottom-40 right-32 animation-delay-2000",
            index === 3 && "bottom-20 left-32 animation-delay-3000",
            index === 4 && "top-60 right-60 animation-delay-4000",
            index === 5 && "bottom-60 left-60 animation-delay-5000"
          )}
          style={{
            animationDelay: `${index * 1000}ms`
          }}
        >
          <div className="text-2xl">{tool.logo}</div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-glass border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-white" />
              <span className="font-bold text-xl text-white">Master-AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-white/80 hover:text-white transition-colors">Features</Link>
              <Link href="#curriculum" className="text-white/80 hover:text-white transition-colors">Curriculum</Link>
              <Link href="#testimonials" className="text-white/80 hover:text-white transition-colors">Reviews</Link>
              <Link href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
              <GradientButton asChild variant="glass">
                <Link href="/auth/signup">Start Learning</Link>
              </GradientButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
        <FloatingElements />
        
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Master Every
              <span className="block bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-shimmer">
                AI Tool
              </span>
              in 2024
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your career with our comprehensive AI education platform. 
              <span className="font-semibold text-white"> 89 hands-on lessons</span> covering 
              ChatGPT, Claude, Midjourney, and every essential AI tool.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <GradientButton size="xl" variant="shimmer" asChild>
                <Link href="/auth/signup">
                  <Sparkles className="w-5 h-5" />
                  Start Free Trial
                </Link>
              </GradientButton>

              <GradientButton size="xl" variant="glass" asChild>
                <Link href="#demo">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Link>
              </GradientButton>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-white/70">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-medium">4.9/5 from 2,500+ students</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <AnimatedCounter end={12500} suffix="+ active learners" className="font-medium" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/5 backdrop-blur-glass border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-scale-in" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Master-AI?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              The most comprehensive AI education platform designed for busy professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <GlassCard 
                key={feature.title}
                variant="interactive"
                className="p-6 text-center animate-slide-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-ai-blue-500 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white/5 backdrop-blur-glass">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-white/70">
              Join thousands who've accelerated their careers with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <GlassCard 
                key={testimonial.name}
                variant="strong"
                className="p-6 animate-scale-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-ai-blue-500 to-ai-purple-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-white/70 text-sm">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <GlassCard variant="colored" className="p-12 max-w-4xl mx-auto glow">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Master AI?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join 12,500+ professionals who've already transformed their careers with AI skills. 
              Start your free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <GradientButton size="xl" variant="shimmer" asChild>
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </GradientButton>

              <GradientButton size="xl" variant="glass" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </GradientButton>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-400" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-glass border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-8 w-8 text-white" />
              <span className="font-bold text-xl text-white">Master-AI</span>
            </div>
            
            <div className="text-white/60 text-center md:text-right">
              <p>&copy; 2024 Master-AI. All rights reserved.</p>
              <p className="text-sm">Transform your career with AI mastery.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}