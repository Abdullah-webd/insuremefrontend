import { Link } from "react-router-dom";
import "./LandingPage.css";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("insureme_user") || "null");
  } catch {
    return null;
  }
};

export default function LandingPage() {
  const user = getUser();
  const isStandardUser = user && user.role === "user";

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-icon">IM</div>
          <span>InsureMe</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          {isStandardUser ? (
            <Link to="/chat" className="nav-cta">Chat with AI</Link>
          ) : (
            <>
              <Link to="/login" className="nav-login">Login</Link>
              <Link to="/chat" className="nav-cta">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="badge">New: AI-Powered Claims Review</div>
          <h1>Insurance that <span>actually</span> works for you.</h1>
          <p>
            Experience the future of insurance. Fast, transparent, and driven by 
            advanced AI to ensure you get covered in minutes, not days.
          </p>
          <div className="hero-actions">
            <Link to="/chat" className="btn-primary">Start Your Application</Link>
            <Link to="/chat" className="btn-secondary">Talk to our AI Agent</Link>
          </div>
          <div className="hero-trust">
            <div className="trust-item">
              <strong>10k+</strong>
              <span>Active Policies</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <strong>99%</strong>
              <span>Claims Approved</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="mobile-mockup">
            <div className="mockup-header">
              <div className="mockup-user">
                <div className="avatar-small">AI</div>
                <div>
                  <p className="name">InsureMe Agent</p>
                  <p className="status">Online</p>
                </div>
              </div>
            </div>
            <div className="mockup-chat">
              <div className="bubble bot">Hello! How can I help you today?</div>
              <div className="bubble user">I want to file a car insurance claim.</div>
              <div className="bubble bot">I'm sorry to hear that. I can help. Upload a photo of the damage.</div>
            </div>
          </div>
          <div className="visual-card floating-card policy-card">
            <div className="policy-header">
              <div className="policy-icon">🚗</div>
              <span>Car Policy</span>
            </div>
            <div className="policy-body">
              <p className="p-label">ID: POL-4921</p>
              <p className="p-status active">ACTIVE</p>
            </div>
          </div>
          <div className="visual-card floating-card notification-card">
            <div className="check-icon">✓</div>
            <span>Claim Approved!</span>
          </div>
          <div className="abstract-shape"></div>
        </div>
      </header>

      {/* Why InsureMe Section */}
      <section className="why-insureme">
        <div className="section-content">
          <div className="text-box">
            <span className="badge">Why Choose Us?</span>
            <h2>The Intelligent Choice for Modern Living</h2>
            <p>
              Traditional insurance is slow, bureaucratic, and confusing. 
              We've rebuilt the entire experience from the ground up to be 
              transparent, fast, and accessible right from your phone.
            </p>
            <ul className="value-list">
              <li>
                <strong>Instant Underwriting:</strong> Our AI assesses risk in seconds, providing you with real-time quotes.
              </li>
              <li>
                <strong>Human-Centric AI:</strong> A bot that actually understands you, trained on thousands of real-world scenarios.
              </li>
              <li>
                <strong>24/7 Availability:</strong> No more waiting for office hours. Start a claim or buy a policy at 3 AM.
              </li>
            </ul>
          </div>
          <div className="visual-box">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>60s</h3>
                <p>Avg. Approval</p>
              </div>
              <div className="stat-card">
                <h3>0%</h3>
                <p>Hidden Fees</p>
              </div>
              <div className="stat-card">
                <h3>24h</h3>
                <p>Claim Payout</p>
              </div>
              <div className="stat-card">
                <h3>100%</h3>
                <p>Digital</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2>Everything you need in one place</h2>
          <p>We've simplified insurance so you can focus on what matters most.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon car-icon">🚗</div>
            <h3>Car Insurance</h3>
            <p>Comprehensive coverage for your vehicle with instant roadside assistance, fire damage protection, and third-party liability coverage.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon health-icon">🏥</div>
            <h3>Health & Life</h3>
            <p>Protect your family's future with our flexible and affordable plans covering hospitalization, emergencies, and life-long security.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon home-icon">🏠</div>
            <h3>Property Insurance</h3>
            <p>Shield your home and assets against unexpected events, natural disasters, theft, and accidental damage with real-time verification.</p>
          </div>
        </div>
      </section>

      {/* AI Deep Dive */}
      <section className="ai-deep-dive">
        <div className="section-header">
          <h2>Our Intelligence is Your Advantage</h2>
          <p>How our advanced AI makes insurance feel like magic.</p>
        </div>
        <div className="ai-grid">
          <div className="ai-item">
            <div className="ai-number">01</div>
            <h4>Visual Verification</h4>
            <p>Our computer vision models analyze your car and property photos to verify condition and identify damage instantly.</p>
          </div>
          <div className="ai-item">
            <div className="ai-number">02</div>
            <h4>Fraud Prevention</h4>
            <p>Sophisticated algorithms detect anomalies in claim submissions, ensuring a fair and honest system for all our users.</p>
          </div>
          <div className="ai-item">
            <div className="ai-number">03</div>
            <h4>Natural Language</h4>
            <p>Communicate in plain English or local languages. Our agent understands context, intent, and emotion to provide better support.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="works-content">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <div className="step-text">
                <h4>Tell us about yourself</h4>
                <p>Chat with our AI agent to quickly identify the best coverage for your needs.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <div className="step-text">
                <h4>Submit your data</h4>
                <p>Upload basic information and photos. Our AI verifies everything in real-time.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <div className="step-text">
                <h4>Get Covered</h4>
                <p>Once approved, pay your premium and your policy becomes active instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="section-header">
          <h2>Loved by thousands</h2>
          <p>Don't just take our word for it. See what our community has to say.</p>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p className="testimonial-text">"InsureMe changed my perspective on insurance. I got my car covered in less than 5 minutes while drinking coffee."</p>
            <div className="testimonial-user">
              <div className="user-avatar">AD</div>
              <div>
                <h6>Amaka David</h6>
                <span>Lagos, Nigeria</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="testimonial-text">"The AI agent is actually smart. It understood exactly what I needed for my health plan without the usual jargon."</p>
            <div className="testimonial-user">
              <div className="user-avatar">JO</div>
              <div>
                <h6>John Okafor</h6>
                <span>Abuja, Nigeria</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="section-header">
          <h2>Common Questions</h2>
          <p>Everything you need to know about getting started.</p>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <h4>How fast is the approval process?</h4>
            <p>Our AI processes standard applications in under 60 seconds. Claims are typically reviewed within 24 hours.</p>
          </div>
          <div className="faq-item">
            <h4>Is my data secure?</h4>
            <p>We use bank-grade encryption and secure Cloudinary storage for all your sensitive documents and photos.</p>
          </div>
          <div className="faq-item">
            <h4>Can I talk to a human?</h4>
            <p>Absolutely. If our AI agent can't resolve your request, you can escalate it to our admin team with one click.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="cta-box">
          <h2>Ready to secure your future?</h2>
          <p>Join thousands of users who have switched to a smarter way of insurance.</p>
          <Link to="/chat" className="btn-white">Launch InsureMe Chat</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="logo-icon">IM</div>
              <span>InsureMe</span>
            </div>
            <p>Making insurance accessible for everyone.</p>
          </div>
          <div className="footer-links">
            <div className="link-col">
              <h5>Product</h5>
              <Link to="/chat">Chat</Link>
              <a href="#">Pricing</a>
              <a href="#">Security</a>
            </div>
            <div className="link-col">
              <h5>Company</h5>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} InsureMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
