import { createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import Setting from './pages/Setting'
import Ready from './pages/Ready'
import Queue from './pages/Queue'
import Zone from './pages/Zone'
import Seat from './pages/Seat'
import Captcha from './pages/Captcha'
import Result from './pages/Result'

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Setting /> },
      { path: '/ready', element: <Ready /> },
      { path: '/queue', element: <Queue /> },
      { path: '/captcha', element: <Captcha /> },
      { path: '/zone', element: <Zone /> },
      { path: '/seat', element: <Seat /> },
      { path: '/result', element: <Result /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
