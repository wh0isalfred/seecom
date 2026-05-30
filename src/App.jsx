import { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import TshirtsPage from './pages/TshirtsPage'
import ChainsPage from './pages/ChainsPage'
import ShopPage from './pages/ShopPage'
import CartPage from './pages/CartPage'
import AuthModal from './components/AuthModal'
import ProductDetailPage from './pages/ProductDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminPage from './pages/AdminPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DiscountProvider } from './contexts/DiscountContext'
import { generateSessionId } from './services/supabase'

function AppInner() {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth()

  const [currentPage, setCurrentPage] = useState('landing')
  const [pageParams, setPageParams]   = useState({})
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })
  const [sessionId, setSessionId]     = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    let stored = localStorage.getItem('session_id')
    if (!stored) {
      stored = generateSessionId()
      localStorage.setItem('session_id', stored)
    }
    setSessionId(stored)

    if (window.history.state?.page) {
      setCurrentPage(window.history.state.page)
      setPageParams(window.history.state.params || {})
    }
  }, [])

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.page) {
        setCurrentPage(e.state.page)
        setPageParams(e.state.params || {})
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Stop any playing audio the moment user leaves landing
  useEffect(() => {
    if (currentPage !== 'landing') {
      document.querySelectorAll('audio').forEach(a => {
        a.pause();
        a.currentTime = 0;
      });
    }
  }, [currentPage])

  const goToPage = (page, params = {}) => {
    setCurrentPage(page)
    setPageParams(params)
    window.history.pushState(
      { page, params },
      `See.com - ${page}`,
      window.location.pathname
    )
    window.scrollTo(0, 0)
  }

  const handleSidebarNavigate = (category) => {
    let page   = 'home'
    let params = {}

    if (category === 'home')         { page = 'home' }
    else if (category === 'cart')    { page = 'cart' }
    else if (category === 'admin') {
      if (isAdmin) { page = 'admin' }
      else { setSidebarOpen(false); setAuthModalOpen(true); return; }
    }
    else if (category === 'tshirts') { page = 'tshirts' }
    else if (category === 'chains')  { page = 'chains' }
    else if (category === 'all') {
      page   = 'shop'
      params = { category: 'all' }
    } else {
      page   = 'shop'
      params = { category }
    }

    goToPage(page, params)
    setSidebarOpen(false)
  }

  if (!sessionId && currentPage !== 'landing') return null

  return (
    <div style={{ margin: 0, padding: 0, width: '100%' }}>

      {currentPage === 'landing' && (
        <Landing onNavigate={goToPage} />
      )}

      {currentPage !== 'landing' && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={setSidebarOpen}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onNavigate={handleSidebarNavigate}
            isAdmin={isAdmin}
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSignOut={async () => {
              await signOut()
              goToPage('home')
            }}
          />

          <div style={{ marginLeft: '40px' }}>

            {currentPage === 'home' && sessionId && (
              <HomePage
                sessionId={sessionId}
                cart={cart}
                setCart={setCart}
                onLogoClick={() => goToPage('landing')}
                onNavigate={goToPage}
              />
            )}

            {currentPage === 'tshirts' && sessionId && (
              <TshirtsPage
                sessionId={sessionId}
                cart={cart}
                setCart={setCart}
                onLogoClick={() => goToPage('landing')}
                onNavigate={goToPage}
              />
            )}

            {currentPage === 'chains' && sessionId && (
              <ChainsPage
                sessionId={sessionId}
                cart={cart}
                setCart={setCart}
                onLogoClick={() => goToPage('landing')}
                onNavigate={goToPage}
              />
            )}

            {currentPage === 'shop' && sessionId && (
              <ShopPage
                sessionId={sessionId}
                cart={cart}
                setCart={setCart}
                onLogoClick={() => goToPage('landing')}
                onNavigate={goToPage}
                gender={pageParams.gender || 'all'}
                category={pageParams.category || 'all'}
              />
            )}

            {currentPage === 'cart' && sessionId && (
              <CartPage
                cart={cart}
                setCart={setCart}
                onNavigate={goToPage}
              />
            )}

            {currentPage === 'checkout' && sessionId && (
              <CheckoutPage
                cart={cart}
                setCart={setCart}
                onNavigate={goToPage}
              />
            )}

            {currentPage === 'product' && sessionId && (
              <ProductDetailPage
                productId={pageParams.productId}
                cart={cart}
                setCart={setCart}
                onNavigate={goToPage}
              />
            )}

            {currentPage === 'admin' && !authLoading && (
              isAdmin
                ? <AdminPage onNavigate={goToPage} />
                : (() => { setAuthModalOpen(true); goToPage('home'); return null; })()
            )}

          </div>

          {/* Auth modal — rendered above everything, any page */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={() => setAuthModalOpen(false)}
          />
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DiscountProvider>
        <AppInner />
      </DiscountProvider>
    </AuthProvider>
  )
}
