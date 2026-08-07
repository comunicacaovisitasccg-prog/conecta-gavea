import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Home from './pages/Home'
import Inscricao from './pages/Inscricao'
import MinhasInscricoes from './pages/MinhasInscricoes'
import Comprovantes from './pages/Comprovantes'

function RotaPrivada({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <TelaCarregando />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RotaPublica({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <TelaCarregando />
  if (user) return <Navigate to="/" replace />
  return children
}

function TelaCarregando() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50">
      <span className="text-sm text-navy-300">Carregando...</span>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <RotaPublica>
              <Login />
            </RotaPublica>
          }
        />
        <Route
          path="/cadastro"
          element={
            <RotaPublica>
              <Cadastro />
            </RotaPublica>
          }
        />
        <Route
          path="/"
          element={
            <RotaPrivada>
              <Home />
            </RotaPrivada>
          }
        />
        <Route
          path="/inscricao/:visitaId"
          element={
            <RotaPrivada>
              <Inscricao />
            </RotaPrivada>
          }
        />
        <Route
          path="/minhas-inscricoes"
          element={
            <RotaPrivada>
              <MinhasInscricoes />
            </RotaPrivada>
          }
        />
        <Route
          path="/comprovantes"
          element={
            <RotaPrivada>
              <Comprovantes />
            </RotaPrivada>
          }
        />
      </Routes>
    </AuthProvider>
  )
}