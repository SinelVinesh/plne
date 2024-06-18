import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import Plne from "./plne/Plne.tsx";
import Coloration from "./coloration/Coloration.tsx";
import MooreDjikstra from "./moore-djikstra/MooreDjikstra.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Plne />
      },
      {
        path: "/plne",
        element: <Plne />
      },
      {
        path: "/coloration",
        element: <Coloration />
      },
      {
        path: "/moore-djikstra",
        element: <MooreDjikstra />
      },
    ]
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
