export default function Home() {
  return (
    <div className="page hero-bg">
      <div className="container">
        <nav className="nav nav-hero">
          <div className="brand">AI PDF Study Assistant</div>
          <div className="nav-actions">
            <a className="link" href="/sign-in">
              Sign In
            </a>
            <a className="button" href="/sign-up">
              Create Account
            </a>
          </div>
        </nav>
        <main className="hero">
          <div className="hero-copy">
            <h1>Turn dense PDFs into study-ready material.</h1>
            <p className="muted">
              Upload a PDF, get per-page summaries, chat with citations, and
              auto-generate flashcards.
            </p>
            <div className="hero-cta">
              <a className="button" href="/sign-up">
                Get Started
              </a>
              <a className="button secondary" href="/dashboard">
                Go to Dashboard
              </a>
            </div>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <strong>Summaries per page</strong>
              <p className="muted">
                Fast study flow by skimming key points page-by-page.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <strong>Chat with citations</strong>
              <p className="muted">
                Answers grounded in your PDF with page references.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <strong>Flashcards</strong>
              <p className="muted">
                Auto-generated Q&A cards from relevant chunks.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <strong>Private by default</strong>
              <p className="muted">
                Row-level security keeps documents isolated per user.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
