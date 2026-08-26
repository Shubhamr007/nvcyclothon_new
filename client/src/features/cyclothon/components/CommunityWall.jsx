import { useEffect, useMemo, useRef, useState } from "react";
import { getCommunityPosts, submitCommunityPost } from "../../../api/http";
import { Reveal } from "../../../components/Reveal";
import { LoadingIndicator } from "../../../components/LoadingIndicator";

const MAX_IMAGE_MB = 5;
const MAX_MESSAGE = 500;

function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CommunityWall() {
  const [state, setState] = useState({ loading: true, enabled: true, items: [], totalApproved: 0 });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true }));
    getCommunityPosts()
      .then((data) => {
        if (cancelled) return;
        setState({
          loading: false,
          enabled: Boolean(data?.enabled),
          items: Array.isArray(data?.items) ? data.items : [],
          totalApproved: Number(data?.total_approved) || 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, enabled: false, items: [], totalApproved: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  if (state.loading) return null;
  if (!state.enabled) return null;

  const hideBecauseEmpty = state.totalApproved === 0;

  return (
    <section
      id="community"
      aria-labelledby="community-heading"
      className="bg-[#f4f1e9] px-5 py-24 text-[#071313]"
    >
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <p className="text-xs font-black tracking-[.28em] text-[#ff5f3d] uppercase">
            Community wall
          </p>
          <h2
            id="community-heading"
            className="mt-3 max-w-2xl text-4xl font-black leading-none tracking-[-.06em] uppercase md:text-6xl"
          >
            Ride stories,<br />
            <span className="text-[#ff5f3d]">your words.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-[#071313]/70">
            Share a memory, a shout-out to a fellow rider, or a photo from a past edition.
            Every submission is reviewed by our team before it goes live.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
          <CommunitySubmissionForm onSubmitted={() => setRefreshTick((n) => n + 1)} />
          {!hideBecauseEmpty && (
            <div className="grid gap-4 sm:grid-cols-2">
              {state.items.map((post, index) => (
                <Reveal key={post.id} delay={Math.min(index * 0.05, 0.4)}>
                  <article className="flex h-full flex-col rounded-3xl border border-[#071313]/10 bg-white p-5 shadow-sm">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="mb-4 aspect-video w-full rounded-2xl object-cover"
                      />
                    )}
                    <p className="text-sm leading-6 text-[#071313]/85">
                      “{post.message}”
                    </p>
                    <p className="mt-4 text-xs font-black tracking-[.16em] text-[#ff5f3d] uppercase">
                      {post.name}
                    </p>
                    <p className="mt-1 text-[10px] tracking-[.16em] text-[#071313]/50 uppercase">
                      {formatDate(post.approved_at || post.created_at)}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CommunitySubmissionForm({ onSubmitted }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState({ state: "idle", text: "" });
  const fileInputRef = useRef(null);

  const messageRemaining = useMemo(() => MAX_MESSAGE - message.length, [message]);

  const disabled =
    status.state === "loading" ||
    !consent ||
    !name.trim() ||
    !message.trim() ||
    message.trim().length < 4 ||
    messageRemaining < 0;

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    setImageError("");
    if (!file) {
      setImage(null);
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image is over ${MAX_IMAGE_MB} MB.`);
      setImage(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Use a JPEG, PNG, or WebP image.");
      setImage(null);
      return;
    }
    setImage(file);
  }

  async function submit(event) {
    event.preventDefault();
    if (disabled) return;
    setStatus({ state: "loading", text: "" });
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("message", message.trim());
      formData.append("consent_accepted", "true");
      if (image) formData.append("image", image);
      await submitCommunityPost(formData);
      setStatus({
        state: "success",
        text: "Thanks — your submission is with the team for review. It will appear here once approved.",
      });
      setName("");
      setMessage("");
      setImage(null);
      setConsent(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (typeof onSubmitted === "function") onSubmitted();
    } catch (error) {
      setStatus({
        state: "error",
        text: error.message || "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl bg-[#071313] p-6 text-white shadow-[10px_10px_0_#ff5f3d]"
    >
      <p className="text-xs font-black tracking-[.24em] text-[#d9ff38] uppercase">
        Share your story
      </p>
      <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight">
        Post a message to the wall
      </h3>
      <p className="mt-2 text-xs text-white/60">
        Reviewed before publishing. Please do not share other people's images
        without permission.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="text-xs font-bold uppercase tracking-[.14em] text-white/70">
          Your name
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-sm font-normal normal-case text-white outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-[#d9ff38]"
            placeholder="First name or handle"
          />
        </label>

        <label className="text-xs font-bold uppercase tracking-[.14em] text-white/70">
          Message
          <textarea
            required
            minLength={4}
            maxLength={MAX_MESSAGE}
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-sm font-normal normal-case text-white outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-[#d9ff38]"
            placeholder="What did the ride mean to you?"
          />
          <span
            className={`mt-1 block text-[10px] tracking-[.14em] uppercase ${
              messageRemaining < 0 ? "text-[#ff5f3d]" : "text-white/50"
            }`}
          >
            {Math.max(messageRemaining, 0)} characters left
          </span>
        </label>

        <label className="text-xs font-bold uppercase tracking-[.14em] text-white/70">
          Photo (optional, JPEG/PNG/WebP, up to {MAX_IMAGE_MB} MB)
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="mt-2 block w-full text-xs text-white/80 file:mr-3 file:rounded-full file:border-0 file:bg-[#d9ff38] file:px-3 file:py-1 file:text-xs file:font-black file:uppercase file:text-[#071313]"
          />
          {imageError && (
            <span className="mt-1 block text-[11px] text-[#ff5f3d]">{imageError}</span>
          )}
        </label>

        <label className="flex items-start gap-3 text-xs leading-5 text-white/80">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          I confirm I own the content or have permission to share it, and it does not
          violate anyone's rights, sentiments, or applicable laws.
        </label>

        <button
          type="submit"
          disabled={disabled}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-[#d9ff38] px-5 py-3 text-xs font-black tracking-[.16em] uppercase text-[#071313] transition disabled:opacity-50"
        >
          {status.state === "loading" ? (
            <LoadingIndicator label="Submitting…" className="text-[#071313]" />
          ) : (
            "Submit for review"
          )}
        </button>
        {status.text && (
          <p
            role="status"
            aria-live="polite"
            className={`text-xs ${
              status.state === "error" ? "text-[#ff5f3d]" : "text-[#d9ff38]"
            }`}
          >
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}
