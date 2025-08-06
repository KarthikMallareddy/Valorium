import React from 'react';

export default function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Valorium Currency</h1>
        <nav>
          <a href="/" className="mr-4 hover:underline">Home</a>
          <a href="/dashboard" className="hover:underline">Dashboard</a>
        </nav>
      </div>
    </header>
  );
}