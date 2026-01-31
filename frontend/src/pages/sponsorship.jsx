import { useState, useEffect } from "react";

const initialForm = {
  name: "",
  organization: "",
  phone: "",
  email: "",
  message: ""
};

export default function SponsorshipPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ================= VALIDATION ================= */

  useEffect(() => {
    validateForm();
  }, [form]);

  function validateForm() {
    const newErrors = {};

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (form.name.length > 120) {
      newErrors.name = "Name cannot exceed 120 characters.";
    }

    if (form.organization && form.organization.length > 150) {
      newErrors.organization = "Organization cannot exceed 150 characters.";
    }

    if (form.phone && form.phone.length > 20) {
      newErrors.phone = "Phone number is too long.";
    }

    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!form.message || form.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters.";
    } else if (form.message.length > 2000) {
      newErrors.message = "Message cannot exceed 2000 characters.";
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }

  /* ================= HANDLERS ================= */

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/sponsorship/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      if (!res.ok) throw new Error();

      setSuccess(true);
      setForm(initialForm);
    } catch {
      setErrors({
        form: "Submission failed. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <main className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4 text-cyan-400">
        Sponsor RoboTech NITK
      </h1>

      <p className="mb-8 text-gray-300">
        Partner with RoboTech NITK to support innovation, robotics,
        and engineering excellence.
      </p>

      {/* ===== SUCCESS STATE ===== */}
      {success ? (
        <div
          className="
            flex flex-col items-center justify-center
            text-center
            animate-[fadeInScale_0.6s_ease-out]
          "
        >
          <div
            className="
              w-16 h-16 mb-4 rounded-full
              bg-cyan-500 flex items-center justify-center
              text-black text-3xl font-bold
            "
          >
            ✓
          </div>

          <p className="text-green-400 text-lg font-semibold">
            Thank you!
          </p>
          <p className="text-gray-300 mt-2">
            Our team will contact you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* NAME */}
          <Field
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            error={errors.name}
          />

          {/* ORGANIZATION */}
          <Field
            name="organization"
            value={form.organization}
            onChange={handleChange}
            placeholder="Organization (optional)"
            error={errors.organization}
          />

          {/* PHONE */}
          <Field
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone (optional)"
            error={errors.phone}
          />

          {/* EMAIL */}
          <Field
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            error={errors.email}
          />

          {/* MESSAGE */}
          <div>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Message"
              className="w-full p-2 bg-black border border-gray-600 min-h-[140px]"
            />
            {errors.message && (
              <p className="text-red-400 text-sm mt-1">
                {errors.message}
              </p>
            )}
          </div>

          {/* FORM ERROR */}
          {errors.form && (
            <p className="text-red-500 text-sm">{errors.form}</p>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`
              flex items-center justify-center gap-2
              px-6 py-2 font-semibold
              rounded
              ${isValid ? "bg-cyan-500 text-black" : "bg-gray-600 text-gray-300"}
              ${loading ? "opacity-80" : ""}
            `}
          >
            {loading && <Spinner />}
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}
    </main>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function Field({ name, value, onChange, placeholder, error, type = "text" }) {
  return (
    <div>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2 bg-black border border-gray-600"
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="
        w-4 h-4
        border-2 border-black border-t-transparent
        rounded-full
        animate-spin
      "
    />
  );
}
