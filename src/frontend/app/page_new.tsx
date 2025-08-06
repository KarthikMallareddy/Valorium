import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Valorium</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The next-generation cryptocurrency built on the Internet Computer. 
            Secure, fast, and decentralized digital currency for everyone.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
            <Link href="/dashboard" className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure</h3>
            <p className="text-gray-600">Built on Internet Computer with advanced cryptography</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Fast</h3>
            <p className="text-gray-600">Near-instant transactions with minimal fees</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Decentralized</h3>
            <p className="text-gray-600">Fully decentralized with community governance</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Valorium Stats</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600">1,000+</div>
              <div className="text-gray-600">Active Wallets</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">50,000</div>
              <div className="text-gray-600">Total VAL Minted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">5,000+</div>
              <div className="text-gray-600">Transactions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
