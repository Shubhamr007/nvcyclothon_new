import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { FaBicycle, FaHeartPulse, FaMedal, FaMusic, FaPersonBiking, FaRegHeart, FaWater } from "react-icons/fa6";
import { MdMedicalServices, MdPhotoCamera } from "react-icons/md";

const highlights = [
  [FaMedal, "Finisher medal"], [FaPersonBiking, "Ride with champions"], [FaHeartPulse, "Healthy lifestyle"], [FaRegHeart, "A family event"], [FaMusic, "Live music"], [FaWater, "Water stations"], [MdPhotoCamera, "Event photography"], [MdMedicalServices, "Medical support"],
];
const testimonials = [
  {
    quote:
      "My daughter crossed her first finish line here. She still wears the medal every weekend.",
    name: "Asha M.",
    role: "Parent & rider",
  },
  {
    quote:
      "The route was well marked, the volunteers were brilliant, and the sunrise was unforgettable.",
    name: "Rohan K.",
    role: "Road Challenge rider",
  },
  {
    quote:
      "It felt like Rewa was cheering for every single person on a bicycle.",
    name: "Meera S.",
    role: "Community rider",
  },
];
export function SocialProofAndExperience() {
  return (
    <>
      <section className="bg-[#071313] px-5 py-10 text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-8 text-center sm:grid-cols-5">
          {[[500, "", "Total rider places"], [4, "", "Race categories"], [300, "+", "Finish moments"], [50, "+", "Volunteers"], [12, "", "Community partners"]].map(([number, suffix, label]) => (
            <AnimatedStat key={label} number={number} suffix={suffix} label={label} />
          ))}
        </div>
      </section>
      <Countdown />
      <section className="bg-[#f4f1e9] px-5 py-28 text-[#071313]">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-xs font-black tracking-[.2em] text-[#ff5f3d] uppercase">
            A whole morning of movement
          </p>
          <h2 className="mt-4 text-5xl font-black tracking-[-.08em] uppercase md:text-7xl">
            More than
            <br />a finish line.
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {highlights.map(([Icon, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#071313]/15 bg-white p-5"
              >
                <Icon className="text-3xl text-[#ff5f3d]" aria-hidden="true" />
                <h3 className="mt-5 text-sm font-black uppercase">{label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#ff5f3d] px-5 py-28 text-[#071313]">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-xs font-black tracking-[.2em] uppercase">
            The last ride, in their words
          </p>
          <h2 className="mt-4 text-5xl font-black tracking-[-.08em] uppercase md:text-7xl">
            Stories with
            <br />
            pedal power.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.name} className="rounded-2xl bg-[#f4f1e9] p-7">
                <blockquote className="text-xl font-bold leading-7">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-8 text-xs font-black tracking-[.12em] uppercase">
                  {item.name}
                  <span className="mt-1 block font-medium tracking-normal text-[#071313]/60">
                    {item.role}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <Faq />
    </>
  );
}
function AnimatedStat({ number, suffix, label }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.6 });
  return <div ref={ref}><b className="block text-3xl font-black text-[#d9ff38]">{inView ? <CountUp end={number} duration={1.4} separator="," /> : 0}{suffix}</b><span className="mt-1 block text-[10px] font-bold tracking-[.14em] text-white/65 uppercase">{label}</span></div>;
}
function Countdown() {
  const target = new Date("2026-10-18T05:30:00+05:30").getTime();
  const [remaining, setRemaining] = useState(Math.max(0, target - Date.now()));
  useEffect(() => {
    const timer = setInterval(
      () => setRemaining(Math.max(0, target - Date.now())),
      1000,
    );
    return () => clearInterval(timer);
  }, [target]);
  const parts = [
    Math.floor(remaining / 86400000),
    Math.floor(remaining / 3600000) % 24,
    Math.floor(remaining / 60000) % 60,
    Math.floor(remaining / 1000) % 60,
  ];
  return (
    <section className="bg-[#d9ff38] px-5 py-10 text-[#071313]">
      <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 md:flex-row md:items-center">
        <p className="text-xl font-black uppercase">
          The starting bell is waiting.
        </p>
        <div aria-label="Countdown to 18 October 2026" className="flex gap-5">
          {parts.map((value, index) => (
            <div key={index}>
              <b className="block text-4xl font-black tabular-nums">
                {String(value).padStart(2, "0")}
              </b>
              <span className="text-[10px] font-bold tracking-[.14em] uppercase">
                {["Days", "Hours", "Mins", "Secs"][index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function Faq() {
  const questions = [
    [
      "Can children ride?",
      "Yes. Children can participate with a parent or guardian in the appropriate route category.",
    ],
    [
      "Is this a bicycle-only event?",
      "Yes. NV Cyclothon is exclusively for pedal bicycles; no motorised vehicles are part of the ride.",
    ],
    [
      "What does registration include?",
      "Challenge kits include a jersey, medal, bib, e-certificate, hydration, medical support and photography. Green Ride includes a bib, medal, e-certificate and hydration; Kid-o-thon includes a medal, certificate and refreshment.",
    ],
  ];
  return (
    <section className="bg-[#f4f1e9] px-5 py-28 text-[#071313]">
      <div className="mx-auto grid max-w-[1240px] gap-10 md:grid-cols-[.7fr_1.3fr]">
        <h2 className="text-5xl font-black leading-[.86] tracking-[-.08em] uppercase md:text-7xl">
          Good
          <br />
          to know.
        </h2>
        <div>
          {questions.map(([question, answer]) => (
            <details
              key={question}
              className="border-b border-[#071313]/20 py-5"
            >
              <summary className="cursor-pointer list-none pr-6 text-lg font-black">
                {question}
                <span className="float-right text-[#ff5f3d]">+</span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#071313]/70">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
