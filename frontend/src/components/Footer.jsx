import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="
        relative z-20
        bg-black/60 backdrop-blur-md
        text-gray-300
       
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Logo & About */}
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <img
              src="/robotech_nitk_logo.jpeg"
              alt="Robotech Logo"
              className="w-16 h-16 rounded-full border border-white/20 shadow-lg"
              loading="lazy"
              decoding="async"
            />
            <div>
              <h3 className="text-xl font-semibold text-white">
                Robotech Club
              </h3>
              <p className="text-cyan-400 text-sm">
                NITK | Est. 2025
              </p>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed text-sm">
            Empowering NITK students to explore robotics, automation, and AI
            through real-world projects, competitions, and collaboration.
            From simulation to reality — innovation starts here.
          </p>

          {/* Social Icons */}
          <div className="flex space-x-4 text-2xl mt-5">
            <a
              href="https://www.instagram.com/robotech_nitk/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>

            <a
              href="https://www.linkedin.com/company/robotech-nitk/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition"
              aria-label="LinkedIn"
            >
              <i className="fab fa-linkedin"></i>
            </a>

            <a
              href="mailto:robotech@nitk.edu.in"
              className="hover:text-red-400 transition"
              aria-label="Email"
            >
              <i className="fas fa-envelope"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { to: "/", label: "Home" },
              { to: "/events", label: "Events" },
              { to: "/team", label: "Team" },
              { to: "/#projects", label: "Projects" },
              { to: "/contactUs", label: "Contact" },
              { to: "/portal/dashboard", label: "Portal Login" }
            ].map(link => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="
                    flex items-center gap-2
                    hover:text-cyan-400 transition
                  "
                >
                  <i className="fas fa-chevron-right text-xs opacity-60"></i>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        {/* <div>
          <h4 className="text-lg font-semibold text-white mb-4">
            Resources
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="#"
                className="hover:text-cyan-400 transition flex items-center gap-2"
              >
                <i className="fas fa-chevron-right text-xs opacity-60"></i>
                Learning Resources
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-cyan-400 transition flex items-center gap-2"
              >
                <i className="fas fa-chevron-right text-xs opacity-60"></i>
                Workshop Materials
              </a>
            </li>
          </ul>
        </div> */}

        {/* Important Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">
            Important Links
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://nitk.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition"
              >
                NITK Website
              </a>
            </li>
            {/* <li>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition"
              >
                Students Portal
              </a>
            </li>
            <li>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition"
              >
                Technical Council
              </a>
            </li> */}
          </ul>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {currentYear} Robotech NITK — All Rights Reserved.
      </div>
    </footer>
  );
}
