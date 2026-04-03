import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import LandingPage from './LandingPage.jsx'
import App from './App.jsx'

function Root() {
  // Show landing page by default unless user has visited before
  const [page, setPage] = useState(() => {
    try { return localStorage.getItem("nse_visited") ? "app" : "landing"; }
    catch { return "landing"; }
  });

  const handleLaunch = () => {
    try { localStorage.setItem("nse_visited", "1"); } catch {}
    setPage("app");
  };

  const handleBack = () => setPage("landing");

  if (page === "landing") {
    return <LandingPage onLaunch={handleLaunch} />;
  }

  return <App onBack={handleBack} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
