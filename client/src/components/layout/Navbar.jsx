import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const { isAuthenticated, user, logout, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="bg-dark text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span>💍</span>
            <span className="text-secondary">WeddingLawn</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-secondary transition-colors">
              Browse Lawns
            </Link>

            {isAuthenticated ? (
              <>
                {/* Owner links */}
                {isOwner && (
                  <>
                    <Link to="/dashboard/owner" className="hover:text-secondary transition-colors">
                      My Dashboard
                    </Link>
                    <Link to="/bookings/owner" className="hover:text-secondary transition-colors">
                      Bookings
                    </Link>
                    <Link to="/chat" className="hover:text-secondary transition-colors">
                      Messages
                    </Link>
                  </>
                )}

                {/* Admin links */}
                {isAdmin && (
                  <Link to="/admin" className="hover:text-secondary transition-colors">
                    Admin Panel
                  </Link>
                )}

                {/* User links */}
                {!isOwner && !isAdmin && (
                  <>
                    <Link to="/bookings/my" className="hover:text-secondary transition-colors">
                      My Bookings
                    </Link>
                    <Link to="/chat" className="hover:text-secondary transition-colors">
                      Messages
                    </Link>
                    <Link to="/payment/history" className="hover:text-secondary transition-colors">
                      Payments
                    </Link>
                  </>
                )}

                {/* User avatar + links */}
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="text-secondary hover:text-white transition-colors font-medium"
                  >
                    👤 {user?.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-primary hover:bg-opacity-80 text-white px-4 py-1.5 rounded-lg text-sm transition-all"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hover:text-secondary transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary hover:bg-opacity-80 text-white px-4 py-1.5 rounded-lg transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;