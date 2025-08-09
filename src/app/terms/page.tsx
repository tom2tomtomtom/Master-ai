import Link from 'next/link'
import { Brain } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Master AI',
  description: 'Terms of service for Master AI learning platform',
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using Master-AI's services, you accept and agree to be bound by the 
                terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-600 mb-4">
                Master-AI provides online AI education courses and learning materials. Our platform 
                offers:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Comprehensive AI tool tutorials</li>
                <li>Interactive learning experiences</li>
                <li>Progress tracking and certificates</li>
                <li>Community features and support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600">
                You are responsible for maintaining the confidentiality of your account and password 
                and for restricting access to your computer or device.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment Terms</h2>
              <p className="text-gray-600">
                Subscription fees are billed in advance and are non-refundable except as required by law. 
                We reserve the right to change our pricing with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-600">
                All course content, materials, and platform features are the intellectual property of 
                Master-AI and are protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-600">
                Master-AI shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
              <p className="text-gray-600">
                For questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@master-ai-learn.com" className="text-blue-600 hover:underline">
                  legal@master-ai-learn.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}