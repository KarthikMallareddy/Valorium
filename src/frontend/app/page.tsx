import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">Valorium</div>
            <div className="space-x-4">
              <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
              <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Welcome to <span className="text-blue-600">Valorium</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The next-generation cryptocurrency built on the Internet Computer. 
            Secure, fast, and completely decentralized.
          </p>
          <div className="space-x-4">
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Get Started
            </Link>
            <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg hover:bg-blue-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose Valorium?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-gray-600">Built on Internet Computer with quantum-resistant security</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast</h3>
              <p className="text-gray-600">Near-instant transactions with minimal fees</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Decentralized</h3>
              <p className="text-gray-600">No central authority, completely peer-to-peer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10M+</div>
              <div className="text-gray-600">Transactions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-gray-600">Active Wallets</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">&lt;1s</div>
              <div className="text-gray-600">Transaction Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-6">
        <div className="container mx-auto text-center">
          <div className="text-xl font-bold mb-4">Valorium</div>
          <p className="text-gray-400">
            Built with ❤️ on the Internet Computer
          </p>
        </div>
      </footer>
    </div>
  );
}
