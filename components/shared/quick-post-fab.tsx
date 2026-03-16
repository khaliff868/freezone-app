'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, DollarSign, ArrowRightLeft, Gift, Megaphone, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface QuickPostFABProps {
  onListingCreated?: () => void;
}

const SPEED_DIAL_OPTIONS = [
  {
    id: 'banner',
    label: 'Post Banner Ad',
    icon: Megaphone,
    href: '/dashboard/banners?create=true',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'free',
    label: 'Free Item',
    icon: Gift,
    href: '/dashboard/listings/create?category=Free%20Items',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'swap',
    label: 'Swap Item',
    icon: ArrowRightLeft,
    href: '/dashboard/listings/create?type=SWAP',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'sell',
    label: 'Sell Item',
    icon: DollarSign,
    href: '/dashboard/listings/create?type=SELL',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
];

export default function QuickPostFAB({ onListingCreated }: QuickPostFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { data: session } = useSession() || {};
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show on home, browse pages (not on login/signup)
  const showFAB = pathname === '/' || pathname === '/browse' || pathname?.startsWith('/browse');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!showFAB) return null;

  const handleMainButtonClick = () => {
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // Determine if pulse should be active (not open and not hovering)
  const showPulse = !isOpen && !isHovering;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bottom-5 right-5 md:bottom-6 md:right-6 flex flex-col items-end"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Speed Dial Options */}
      <div
        className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {SPEED_DIAL_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.href)}
              className={`flex items-center gap-3 rounded-full shadow-lg text-white transition-all duration-200 px-4 py-2.5 ${option.color}`}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                transform: isOpen ? 'scale(1)' : 'scale(0.8)',
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="whitespace-nowrap font-medium text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main FAB Button - Styling unchanged */}
      <button
        onClick={handleMainButtonClick}
        className={`relative rounded-full shadow-lg bg-orange-500 text-white hover:brightness-110 transition flex items-center gap-2 font-semibold px-4 py-3 md:px-5 md:py-3 ${
          showPulse ? 'animate-fab-pulse' : ''
        }`}
      >
        <span
          className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
        >
          <Plus className="w-5 h-5" />
        </span>
        <span className="hidden sm:inline">Sell / Swap</span>
      </button>

      {/* Pulse Animation Styles */}
      <style jsx>{`
        @keyframes fab-pulse {
          0%, 85% {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          90% {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(249, 115, 22, 0.7);
          }
          95% {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 10px rgba(249, 115, 22, 0);
          }
          100% {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(249, 115, 22, 0);
          }
        }
        .animate-fab-pulse {
          animation: fab-pulse 7s infinite;
        }
      `}</style>
    </div>
  );
}
