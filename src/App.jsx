import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DiscountProvider } from './contexts/DiscountContext'
import { generateSessionId } from './services/supabase'
import { stopAudio } from './audio'
import { loadRemoteCart, saveRemoteCart, mergeCarts } from './services/cartService'

// ── Lazy-loaded pages — each gets its own JS chunk ────────────────────────────
// Landing is isolated so Three.js (~600KB) only downloads when needed
const Landing           = lazy(() => import('./components/Landing'))
const Sidebar           = lazy(() => import('./components/Sidebar'))
const AuthModal         = lazy(() => import('./components/AuthModal'))
const HomePage          = lazy(() => import('./pages/HomePage'))
const ShopPage          = lazy(() => import('./pages/ShopPage'))
const TshirtsPage       = lazy(() => import('./pages/TshirtsPage'))
const ChainsPage        = lazy(() => import('./pages/ChainsPage'))
const CartPage          = lazy(() => import('./pages/CartPage'))
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const AdminPage         = lazy(() => import('./pages/AdminPage'))

// Minimal fallback — invisible, no layout shift
const PageFallback = () => (
  <div style={{ minHeight: '100dvh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 20, height: 20, border: '1.5px solid #f0f0f0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

function AppInner() {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth()

  const [currentPage, setCurrentPage] = useState('landing')
  const [pageParams, setPageParams]   = useState({})
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  const syncTimeout   = useRef(null)
  const prevUserId    = useRef(null)
  const cartReady     = useRef(false)

  const [sessionId, setSessionId]         = useState(null)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!user) localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart, user])

  // Load remote cart when user is available — set cartReady only after load
  useEffect(() => {
    if (!user) { cartReady.current = false; return }
    cartReady.current = false
    loadRemoteCart(user.id)
      .then(remote => {
        setCart(prev => {
          const local  = prev.length ? prev : JSON.parse(localStorage.getItem('cart') || '[]')
          const merged = mergeCarts(local, remote)
          localStorage.removeItem('cart')
          return merged
        })
      })
      .catch(err => console.error('Failed to load remote cart:', err))
      .finally(() => { cartReady.current = true })
  }, [user?.id]) // eslint-disable-line

  // Debounced sync — only after initial remote load completes
  useEffect(() => {
    if (!user || !cartReady.current) return
    clearTimeout(syncTimeout.current)
    syncTimeout.current = setTimeout(() => {
      saveRemoteCart(user.id, cart).catch(console.error)
    }, 800)
    return () => clearTimeout(syncTimeout.current)
  }, [cart, user?.id]) // eslint-disable-line

  // Clear cart state on logout
  useEffect(() => {
    if (!user && prevUserId.current) setCart([])
    prevUserId.current = user?.id ?? null
  }, [user?.id]) // eslint-disable-line

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

    // Warm up Supabase connection
    import('./services/supabase').then(({ supabase }) => {
      supabase.from('settings').select('key').limit(1).then(() => {}).catch(() => {})
    })
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

  // Stop audio the moment user leaves landing
  useEffect(() => {
    if (currentPage !== 'landing') stopAudio();
  }, [currentPage])

  const goToPage = (page, params = {}) => {
    if (page !== 'landing') stopAudio();
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
    <Suspense fallback={<PageFallback />}>
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
            onSignOut={() => {
              setSidebarOpen(false)
              signOut()
              goToPage('home')
            }}
          />

          <div style={{ marginLeft: isMobile ? '0' : '44px' }}>

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
    </Suspense>
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
