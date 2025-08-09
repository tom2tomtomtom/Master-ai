import Link from 'next/link'
import { Brain } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Master AI',
  description: 'Privacy policy for Master AI learning platform',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">Master-AI</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString()} - v2.1
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-600 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                enroll in lessons, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Account information (email, name)</li>
                <li>Learning progress and lesson completion data</li>
                <li>Communication preferences</li>
                <li>Payment information (processed by Stripe)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide and improve our educational services</li>
                <li>Track your learning progress</li>
                <li>Send you course updates and notifications</li>
                <li>Process payments and billing</li>
                <li>Provide customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-600">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                except as described in this policy. We may share your information with trusted service 
                providers who assist us in operating our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:support@master-ai-learn.com" className="text-blue-600 hover:underline">
                  support@master-ai-learn.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}