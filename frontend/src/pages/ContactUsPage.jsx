import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../api/axios";

export default function ContactUs() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info", // info | success | error
  });

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const isFormValid =
    formValues.name.trim() &&
    formValues.email.trim() &&
    formValues.subject.trim() &&
    formValues.message.trim();

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      showToast("Please fill in all fields before submitting", "error");
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    try {
      const res = await api.post("/contact-messages/", formValues);
      // api.post returns the response object directly, no need for res.ok check as axios throws on error (caught in catch)
      // if (!res.ok) throw new Error(...) is not needed with axios interceptors usually, but let's keep logic simple.
      // With axios, success is 2xx.
      setSuccess(true);
      setFormValues({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/contactUsBgPoster.png"
        id="bg-video"
      >
        <source src="/contactUsBg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div id="video-overlay"></div>

      <main className="pt-24">
        {/* Header */}
        <section className="text-center px-6 mb-20" data-aos="fade-down">
          <h1 className="text-5xl font-bold mb-3">Contact Us</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Have questions or want to collaborate? Reach out to the Robotech Club
            — we’d love to hear from you!
          </p>
        </section>

        {/* Contact Info */}
        <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6 mb-20">
          <div className="glass-card p-6 text-center" data-aos="zoom-in">
            <i className="fa-solid fa-location-dot text-3xl text-indigo-400 mb-3"></i>
            <h3 className="text-xl font-semibold mb-2">Our Address</h3>
            <p className="text-gray-300 text-sm">
              Robotech Club, NITK Surathkal
              <br />
              Mangalore, Karnataka – 575025
            </p>
          </div>

          <div className="glass-card p-6 text-center" data-aos="zoom-in" data-aos-delay="100">
            <i className="fa-solid fa-envelope text-3xl text-indigo-400 mb-3"></i>
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="text-gray-300 text-sm">
              <a href="mailto:robotech@nitk.edu.in" className="text-indigo-400">
                robotech@nitk.edu.in
              </a>
            </p>
          </div>

          <div className="glass-card p-6 text-center" data-aos="zoom-in" data-aos-delay="200">
            <i className="fa-solid fa-phone text-3xl text-indigo-400 mb-3"></i>
            <h3 className="text-xl font-semibold mb-2">Call Us</h3>
            <p className="text-gray-300 text-sm">+91 98765 43210</p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="max-w-4xl mx-auto px-6 mb-24">
          <h2 className="text-3xl font-semibold text-indigo-400 text-center mb-10">
            Send Us a Message
          </h2>

          <form
            onSubmit={handleSubmit}
            className="glass-card p-8 space-y-6"
            data-aos="fade-up"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  className="input-field w-full p-2 rounded-md"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="input-field w-full p-2 rounded-md"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={formValues.subject}
                onChange={handleChange}
                className="input-field w-full p-2 rounded-md"
                placeholder="Subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Message</label>
              <textarea
                name="message"
                rows="4"
                value={formValues.message}
                onChange={handleChange}
                className="input-field w-full p-2 rounded-md"
                placeholder="Write your message..."
                required
              ></textarea>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className="px-8 py-3 rounded-lg font-semibold shadow-md disabled:opacity-60 contact-btn"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </div>

            {success && (
              <p className="text-green-400 text-center text-sm">
                Your message has been sent successfully.
              </p>
            )}
          </form>
        </section>

        {/* Map */}
        <section className="max-w-6xl mx-auto px-6 mb-24">
          <div className="rounded-3xl overflow-hidden border border-white/10 h-160">
            <iframe
              title="NITK Map"
              loading="lazy"
              className="w-full h-full"
              src="https://www.google.com/maps?q=NITK%20Surathkal&output=embed"
            />
          </div>
        </section>
      </main>

      {/* Custom Toaster */}
      {
        toast.show && (
          <div
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-sm z-50
            ${toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                  ? "bg-red-600"
                  : "bg-indigo-600"
              }`}
          >
            {toast.message}
          </div>
        )
      }

      <Footer />

      {/* Styles unchanged */}
      <style>{`
        body {
          font-family: "Inter", sans-serif;
          color: white;
          overflow-x: hidden;
        }

        #bg-video {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -2;
        }

        #video-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(
            to bottom right,
            rgba(11, 11, 32, 0.8),
            rgba(20, 20, 50, 0.7)
          );
          z-index: -1;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 1rem;
          backdrop-filter: blur(6px);
          transition: all 0.3s ease;
        }

        .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 20px rgba(91, 91, 220, 0.4);
        }

        .input-field {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .input-field:focus {
          outline: none;
          border-color: #5b5bdc;
          box-shadow: 0 0 10px rgba(91, 91, 220, 0.6);
        }

        .contact-btn {
          background-color: #5b5bdc;
          transition: all 0.3s ease;
        }

        .contact-btn:hover {
          background-color: #6f6ff0;
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
}
