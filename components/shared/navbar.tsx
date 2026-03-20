'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Package, Settings, Shield, User, Home, ShoppingBag, Sparkles, MessageSquare, RefreshCw, Bell, Search, Heart, Mail } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  if (!session?.user) return null;

  const isAdmin = session.user.role === 'ADMIN';

  return (
    <nav className="bg-gradient-to-r from-trini-red via-trini-black to-trini-red sticky top-0 z-50 shadow-lg w-full relative">
      <div className="flex items-center justify-between w-full h-16 px-4">
        {/* Left Section: Logo + Brand Name */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white hidden sm:block whitespace-nowrap">Freezone Swap or Sell</span>
        </Link>

        {/* Center Section: Navigation Tabs - Desktop Only */}
        <div className="hidden md:flex items-center gap-1 flex-nowrap whitespace-nowrap">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname === '/'
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            Home
          </Link>

          <Link
            href="/browse"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname === '/browse' || pathname?.startsWith('/browse')
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            Browse
          </Link>

          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname === '/dashboard' || (pathname?.startsWith('/dashboard') && !pathname?.includes('/messages') && !pathname?.includes('/swaps') && !pathname?.includes('/wishlist') && !pathname?.includes('/settings'))
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 flex-shrink-0" />
            Listings
          </Link>

          <Link
            href="/dashboard/messages"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname?.startsWith('/dashboard/messages')
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            Messages
          </Link>

          <Link
            href="/dashboard/swaps"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname?.startsWith('/dashboard/swaps')
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            Swaps
          </Link>

          <Link
            href="/dashboard/wishlist"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname?.startsWith('/dashboard/wishlist')
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 flex-shrink-0" />
            Wishlist
          </Link>

          <Link
            href="/dashboard/settings"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname?.startsWith('/dashboard/settings')
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>

          <Link
            href="/contact"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
              pathname === '/contact' || pathname?.startsWith('/contact')
                ? 'bg-trini-gold text-trini-black'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            Contact Us
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                pathname?.startsWith('/admin')
                  ? 'bg-trini-gold text-trini-black'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              Admin
            </Link>
          )}
        </div>

        {/* Right Section: User Profile + Logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-trini-gold text-trini-black text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-xl shadow-lg border border-white/10 z-50 overflow-hidden">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAsRead}
                      className="text-xs text-trini-gold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-400 text-sm">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.linkUrl || '#'}
                        onClick={() => setShowNotifications(false)}
                        className={`block p-3 border-b border-white/5 hover:bg-white/5 transition ${!notif.read ? 'bg-trini-gold/10' : ''}`}
                      >
                        <p className="font-medium text-white text-sm">{notif.title}</p>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{notif.message}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
            <User className="w-4 h-4 text-trini-gold" />
            <span className="text-sm font-medium text-white">{session.user.name}</span>
            {isAdmin && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-trini-gold text-trini-black">
                Admin
              </span>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Hamburger Button - Mobile Only */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-red-700 flex flex-col p-4 md:hidden z-50">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link href="/browse" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <Search className="w-4 h-4" /> Browse
          </Link>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <Package className="w-4 h-4" /> Listings
          </Link>
          <Link href="/dashboard/messages" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <MessageSquare className="w-4 h-4" /> Messages
          </Link>
          <Link href="/dashboard/swaps" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <RefreshCw className="w-4 h-4" /> Swaps
          </Link>
          <Link href="/dashboard/wishlist" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <Heart className="w-4 h-4" /> Wishlist
          </Link>
          <Link href="/dashboard/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <Link href="/contact" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
            <Mail className="w-4 h-4" /> Contact Us
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 text-white font-medium">
              <Shield className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
