import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

const NewRequest = lazy(() => import('@/pages/NewRequest'))
const TicketDetail = lazy(() => import('@/pages/TicketDetail'))
const TeamQueue = lazy(() => import('@/pages/TeamQueue'))
const MyTickets = lazy(() => import('@/pages/MyTickets'))
const Partners = lazy(() => import('@/pages/Partners'))
const Notifications = lazy(() => import('@/pages/Notifications'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="new-request" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><NewRequest /></Suspense>} />
          <Route path="tickets/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><TicketDetail /></Suspense>} />
          <Route path="team-queue" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><TeamQueue /></Suspense>} />
          <Route path="my-tickets" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><MyTickets /></Suspense>} />
          <Route path="partners" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><Partners /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><Notifications /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
