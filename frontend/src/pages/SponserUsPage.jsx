import { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"
import api from "../api/axios";

/* ================= CONSTANTS ================= */

const initialForm = {
  name: "",
  organization: "",
  phone: "",
  email: "",
  message: ""
};

const initialTouched = {
  name: false,
  organization: false,
  phone: false,
  email: false,
  message: false
};

/* ================= COMPONENT ================= */

export default function SponsorUsPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(initialTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" // success | error | info
  });

  const submittingRef = useRef(false);
  const cooldownRef = useRef(null);

  /* ================= AOS ================= */
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  /* ================= VALIDATION ================= */
  useEffect(() => {
    validateForm(form);
  }, [form]);

  function validateForm(values) {
    const e = {};

    if (!values.name || values.name.trim().length < 2)
      e.name = "Name must be at least 2 characters.";

    if (values.organization && values.organization.length > 150)
      e.organization = "Organization cannot exceed 150 characters.";

    if (values.phone && values.phone.length > 20)
      e.phone = "Phone number is too long.";

    if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email))
      e.email = "Please enter a valid email address.";

    if (!values.message || values.message.trim().length < 10)
      e.message = "Message must be at least 10 characters.";

    setErrors(e);
    setIsValid(Object.keys(e).length === 0);
    return Object.keys(e).length === 0;
  }

  /* ================= HELPERS ================= */

  function showToast(message, type = "info") {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  }

  function shouldShowError(field) {
    return (touched[field] || submitAttempted) && errors[field];
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }

  /* ================= SUBMIT ================= */

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (submittingRef.current || rateLimited) return;

    if (!validateForm(form)) {
      showToast("Please fix the highlighted errors.", "error");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      await api.post("/sponsorship/", form);

      setSuccess(true);
      setForm(initialForm);
      setTouched(initialTouched);
      setSubmitAttempted(false);
      showToast("Sponsorship request submitted successfully!", "success");
    } catch (err) {
      if (err.response?.status === 429) {
        showToast(
          "Too many requests. Please try again after some time.",
          "error"
        );
        setRateLimited(true);
        cooldownRef.current = setTimeout(
          () => setRateLimited(false),
          5 * 60 * 1000
        );
      } else {
        console.error(err);
        showToast("Submission failed. Please try again later.", "error");
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <>
      <Navbar></Navbar>
      {/* ===== BACKGROUND VIDEO ===== */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-20"
      >
        <source src="/sponsorBg.mp4" type="video/mp4" />
      </video>

      {/* ===== OVERLAY ===== */}
      <div className="fixed inset-0 bg-[rgba(11,11,32,0.7)] backdrop-blur-sm -z-10" />

      <main className="pt-24 text-white overflow-x-hidden">

        {/* ===== HERO ===== */}
        <section className="text-center mb-20 px-6" data-aos="fade-down">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Sponsor Us
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Partner with the Robotech Club to empower innovation,
            foster student excellence, and shape the future of robotics.
          </p>
        </section>

        {/* ===== WHY SPONSOR ===== */}
        <section className="max-w-6xl mx-auto mb-20 px-6">
          <h2
            className="text-3xl font-semibold mb-10 text-indigo-400 text-center"
            data-aos="fade-up"
          >
            Why Sponsor Us?
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <InfoCard
              icon="fa-rocket"
              title="Innovation Exposure"
              text="Showcase your brand to future engineers and innovators."
            />
            <InfoCard
              icon="fa-handshake"
              title="Industry Collaboration"
              text="Collaborate with students on cutting-edge robotics projects."
            />
            <InfoCard
              icon="fa-bullhorn"
              title="Brand Visibility"
              text="Get featured in national events, workshops, and competitions."
            />
          </div>
        </section>

        {/* ===== TIERS ===== */}
        <section className="max-w-6xl mx-auto mb-20 px-6">
          <h2
            className="text-3xl font-semibold mb-10 text-indigo-400 text-center"
            data-aos="fade-up"
          >
            Sponsorship Tiers
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <Tier
              title="Platinum"
              price="₹1,00,000+"
              items={[
                "Logo on all event banners & website",
                "Dedicated booth at Robotech Expo",
                "Special mention during major events"
              ]}
            />
            <Tier
              title="Gold"
              price="₹50,000 – ₹99,999"
              items={[
                "Logo on website & event posters",
                "Recognition in newsletters & socials",
                "Invitation to club showcases"
              ]}
            />
            <Tier
              title="Silver"
              price="₹25,000 – ₹49,999"
              items={[
                "Logo displayed on select materials",
                "Social media recognition"
              ]}
            />
          </div>
        </section>

        {/* ===== FORM ===== */}
        <section className="max-w-4xl mx-auto mb-24 px-6">
          <h2
            className="text-3xl font-semibold mb-10 text-indigo-400 text-center"
            data-aos="fade-up"
          >
            Get In Touch
          </h2>

          {success ? (
            <div className="text-center text-green-400 text-lg font-semibold">
              Thank you! Our team will contact you shortly.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-6"
              data-aos="fade-up"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  name="name"
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={shouldShowError("name")}
                />
                <Input
                  name="organization"
                  placeholder="Organization"
                  value={form.organization}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={shouldShowError("organization")}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={shouldShowError("email")}
                />
                <Input
                  name="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={shouldShowError("phone")}
                />
              </div>

              <div>
                <textarea
                  name="message"
                  rows="4"
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tell us how you’d like to collaborate..."
                  className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none focus:border-indigo-400"
                />
                {shouldShowError("message") && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={!isValid || loading || rateLimited}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-semibold bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-50"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer></Footer>

      {/* ===== TOAST ===== */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm
            ${toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-indigo-600"
            }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}

/* ================= SUB COMPONENTS ================= */

function InfoCard({ icon, title, text }) {
  return (
    <div
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-center transition hover:-translate-y-1 hover:shadow-lg"
      data-aos="fade-up"
    >
      <i className={`fa-solid ${icon} text-3xl mb-4 text-indigo-400`} />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function Tier({ title, price, items }) {
  return (
    <div
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-center transition hover:-translate-y-1 hover:shadow-lg"
      data-aos="fade-up"
    >
      <h3 className="text-2xl font-semibold text-indigo-300 mb-3">
        {title}
      </h3>
      <p className="text-gray-300 text-sm mb-4">{price}</p>
      <ul className="text-sm text-gray-400 space-y-2">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <div>
      <input
        {...props}
        className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none focus:border-indigo-400"
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
