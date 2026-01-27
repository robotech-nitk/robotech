import { useEffect, useState } from "react";
import Navigation from "../components/Navbar";
import Footer from "../components/Footer";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";
import GalleryMarquee from "../components/GalleryMarquee";
import GalleryModal from "../components/GalleryModal";
import api from "../api/axios";

export default function LandingPage() {
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [recruitment, setRecruitment] = useState(null);

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  /* ================= LOAD DATA ================= */
  /* ================= LOAD DATA ================= */
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [projRes, galRes, recRes] = await Promise.all([
          api.get("/projects/"),
          api.get("/gallery/"),
          api.get("/recruitment/drives/active_public/").catch(() => ({ data: null }))
        ]);

        if (isMounted) {
          // Filter only public projects
          setProjects(projRes.data.filter(p => p.is_public));
          setGallery(galRes.data);
          if (recRes.data) {
            setRecruitment(recRes.data);
          }
        }
      } catch (err) {
        console.error("Landing page load error:", err);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {/* ================= SPLASH ================= */}
      {showSplash && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <img
            src="/robotech_nitk_logo.jpeg"
            alt="RoboTech Logo"
            className="w-64 h-64 rounded-full animate-logoBoot"
          />
        </div>
      )}

      <Navigation />

      {/* ================= CONTINUOUS BACKGROUND VIDEO ================= */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/landingBg2.mp4" type="video/mp4" />
      </video>


      {/* ================= HERO ================= */}
      <section className="relative h-screen w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/landingBg1.mp4" type="video/mp4" />
        </video>



        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
          <h1 className="text-5xl md:text-7xl font-[Orbitron] font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_25px_#00fff2]">
            ROBOTECH CLUB
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mt-6 max-w-2xl">
            A community of innovators, engineers, and creators — building
            intelligent machines to shape tomorrow.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/contactUs"
              className="bg-cyan-500 hover:bg-cyan-600 px-8 py-3 rounded-md font-semibold transition transform hover:scale-105"
            >
              Join Now
            </a>
            <a
              href="#projects"
              className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-md font-semibold transition transform hover:scale-105"
            >
              Explore Projects
            </a>
          </div>

          <div className="flex gap-8 mt-12 text-3xl text-cyan-400 animate-pulse">
            <i className="fa-solid fa-robot"></i>
            <i className="fa-solid fa-microchip"></i>
            <i className="fa-solid fa-gears"></i>
            <i className="fa-solid fa-brain"></i>
          </div>
        </div>
      </section>

      {/* ================= ABOUT US (RESTORED, UNCHANGED) ================= */}
      <section className="py-24 text-center px-6">
        <h2 className="text-4xl font-[Orbitron] text-cyan-400 mb-6">
          About Us
        </h2>
        <p className="max-w-3xl mx-auto text-gray-300 text-lg leading-relaxed">
          At RoboTech NITK, we bridge creativity and engineering through robotics,
          AI, and automation. Our club hosts workshops, participates in
          competitions, and mentors students to explore the world of technology.
        </p>
      </section>

      {/* ================= OUR VISION (RESTORED, UNCHANGED) ================= */}
      <section className="py-24 text-center px-6">
        <h2 className="text-4xl font-[Orbitron] text-cyan-400 mb-6">
          Our Vision
        </h2>
        <p className="max-w-3xl mx-auto text-gray-300 text-lg leading-relaxed">
          Our vision is to cultivate a culture of innovation at NITK where
          students explore robotics and AI to solve real-world challenges.
          <br />
          <br />
          We envision a club that not only builds robots, but builds thinkers,
          leaders, and innovators.
        </p>
      </section>

      {/* ================= RECRUITMENT SECTION ================= */}
      {recruitment && (
        <section className="py-20 px-6 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs uppercase tracking-widest mb-6 animate-pulse">
              Recruitment Active
            </div>

            <h2 className="text-4xl md:text-5xl font-[Orbitron] text-white mb-6">
              {recruitment.title}
            </h2>

            {recruitment.description && (
              <p className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto">{recruitment.description}</p>
            )}

            {/* TIMELINE */}
            <div className="mb-12 relative flex justify-between items-center max-w-3xl mx-auto">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10" />

              {recruitment.timeline && recruitment.timeline.map((event, i) => {
                const isFuture = new Date(event.date) > new Date();
                const statusColor = event.is_completed ? "bg-green-500" : (isFuture ? "bg-gray-800 border-2 border-gray-600" : "bg-orange-500");

                return (
                  <div key={event.id} className="relative group">
                    <div className={`w-4 h-4 rounded-full ${statusColor} mx-auto relative z-10 box-content transition-transform group-hover:scale-150 shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                    <div className="absolute top-6 left-1/2 -translate-left-1/2 w-32 -ml-16 text-center">
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${event.is_completed ? 'text-gray-500 line-through' : 'text-orange-400'}`}>
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className={`text-sm font-medium ${event.is_completed ? 'text-gray-600' : 'text-white'}`}>{event.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-16">
              {recruitment.registration_link ? (
                <a
                  href={recruitment.registration_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105 hover:shadow-orange-500/40"
                >
                  Apply Now <i className="fa-solid fa-arrow-right"></i>
                </a>
              ) : (
                <button disabled className="bg-white/10 text-gray-400 px-8 py-4 rounded-xl font-bold uppercase tracking-widest cursor-not-allowed">
                  Applications Opening Soon
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================= PROJECTS ================= */}
      <section id="projects" className="py-20">
        <h2 className="text-4xl text-center font-[Orbitron] text-cyan-400 mb-12">
          Our Projects
        </h2>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => setActiveProjectId(p.id)}
            />
          ))}
        </div>
      </section>

      {activeProjectId && (
        <ProjectModal
          projectId={activeProjectId}
          onClose={() => setActiveProjectId(null)}
        />
      )}

      {/* ================= GALLERY ================= */}
      <section className="py-20">
        <h2 className="text-4xl font-[Orbitron] text-cyan-400 text-center mb-12">
          Gallery
        </h2>

        <GalleryMarquee
          images={gallery}
          onOpen={(img) => setActiveImage(img)}
        />
      </section>

      {activeImage && (
        <GalleryModal
          image={activeImage}
          onClose={() => setActiveImage(null)}
        />
      )}

      <Footer />
    </>
  );
}
