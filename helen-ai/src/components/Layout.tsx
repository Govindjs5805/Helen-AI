import React from 'react'
import { Navbar } from './Navbar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 lg:px-12">
        {children}
      </main>
    </div>
  )
}
