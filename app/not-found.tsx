import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-black text-slate-900 mb-2">404</h1>
          <h2 className="text-3xl font-bold text-slate-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-600 max-w-md mx-auto">
            The company or page you're looking for doesn't exist. Please check
            the URL and try again.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
