export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Master-AI</h1>
        <p className="text-xl text-center mb-8 text-gray-700">AI Learning Platform with 89 Lessons</p>
        <div className="text-center">
          <a href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  )
}