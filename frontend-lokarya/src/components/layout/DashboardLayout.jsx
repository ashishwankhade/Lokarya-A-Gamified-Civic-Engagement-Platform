import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, Users, FileText, Map, LogOut, Menu, X, 
  ShieldCheck, Activity, PlusCircle, CheckCircle, Inbox 
} from "lucide-react";
import logo from "../../assets/icon22.png"; // Your existing logo

const DashboardLayout = ({ role }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safely get user info
  const user = JSON.parse(localStorage.getItem("userInfo") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload(); 
  };

  // --- MENU CONFIGURATION ---
  const menus = {
    super_admin: [
      { name: "Overview", path: "/dashboard/super-admin", icon: LayoutDashboard },
      { name: "Approvals", path: "/dashboard/super-admin/approvals", icon: Users },
      { name: "System Logs", path: "/dashboard/super-admin/logs", icon: FileText },
    ],
    ngo_admin: [
      { name: "Overview", path: "/dashboard/ngo", icon: LayoutDashboard },
      { name: "Create Mission", path: "/dashboard/ngo/create", icon: PlusCircle },
      { name: "Verify Volunteers", path: "/dashboard/ngo/verify", icon: CheckCircle },
    ],
    local_authority: [
      { name: "Overview", path: "/dashboard/authority", icon: LayoutDashboard },
      { name: "Inbox", path: "/dashboard/authority/inbox", icon: Inbox },
      { name: "City Map", path: "/dashboard/authority/map", icon: Map },
    ]
  };

  const currentMenu = menus[role] || [];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* 1. Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Sidebar */}
      <aside className={`
        fixed md:relative z-50 w-64 h-full bg-[#0f4c75] text-white transition-transform duration-300 ease-out shadow-xl
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto brightness-0 invert" />
            <span className="font-bold text-lg tracking-wide">Lokarya</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 mt-4">
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-white text-[#0f4c75] font-bold shadow-lg translate-x-1" 
                    : "text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1"}
                `}
              >
                <item.icon size={20} className={isActive ? "text-[#0f4c75]" : "text-blue-300 group-hover:text-white"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-white/10 bg-[#0b3a5b]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-200 hover:bg-red-500/20 hover:text-white rounded-xl transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col h-full w-full">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-[#0f4c75]">
              <Menu size={24} />
            </button>
            <h2 className="text-gray-400 text-xs uppercase tracking-wider font-bold hidden md:block">
              {role.replace("_", " ")} DASHBOARD
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-700">{user.name || "User"}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0f4c75] font-bold text-lg">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          </div>
        </header>

        {/* Page Content Slot (The Outlet) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;