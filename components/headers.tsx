"use client"; // Mark as client component for client-side interactivity

import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react"; // Import menu icons
import { useState, useEffect } from "react";
import { useUser } from '@clerk/nextjs'
import { createOrGetUser } from '@/lib/actions'

export default function Header() {
  const { user, isLoaded } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    async function syncUser() {
      if (user) {
        try {
          // Call the profile API endpoint instead of directly using the server action
          const response = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const profile = await response.json()
            console.log('User profile synced:', profile)
          } else {
            console.error('Failed to sync profile:', await response.text())
          }
        } catch (error) {
          console.error('Failed to sync profile:', error)
        }
      }
    }

    if (isLoaded) {
      syncUser()
    }
  }, [user, isLoaded])

  // Toggle function for mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex items-center space-x-4 justify-end mt-4 mr-4">
      {/* Show sign in button when user is signed out */}
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline">Sign in</Button>
        </SignInButton>
      </SignedOut>

      {/* Show user button when user is signed in */}
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>

      {/* Mobile menu button - only visible on mobile screens (md:hidden) */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {/* Show X icon when menu is open, hamburger menu when closed */}
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}
