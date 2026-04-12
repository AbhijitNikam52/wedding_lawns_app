import { Link } from "react-router-dom";

// Full implementation: Day 6 (Lawn Listing Frontend)
const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dark via-primary to-purple-900 text-white py-24 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          💍 Book Your Dream <span className="text-secondary">Wedding Lawn</span>
        </h1>
        <p className="text-lg text-purple-200 mb-8 max-w-xl mx-auto">
          Discover beautiful venues, check real-time availability, chat with
          owners, and book securely — all in one place.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/lawns" className="btn-primary text-lg px-8 py-3">
            Browse Lawns
          </Link>
          <Link to="/register?role=owner" className="btn-outline text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-dark">
            List Your Lawn
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-dark mb-10">
          Why Choose WeddingLawn?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "📸", title: "Real Photos",         desc: "Browse high-quality photos of every venue before you visit." },
            { icon: "📅", title: "Live Availability",   desc: "See exactly which dates are free — no more calling to check." },
            { icon: "💬", title: "Chat with Owners",    desc: "Ask questions directly via real-time chat before booking." },
            { icon: "💳", title: "Secure Payments",     desc: "Pay safely via UPI, cards, or net banking with Razorpay." },
            { icon: "🔔", title: "Instant Confirmation",desc: "Get email confirmation as soon as your booking is accepted." },
            { icon: "⭐", title: "Verified Venues",     desc: "All lawns are reviewed and approved by our team." },
          ].map((f) => (
            <div key={f.title} className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold text-dark mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
