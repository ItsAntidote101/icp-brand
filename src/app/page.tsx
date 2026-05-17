export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-lg font-bold tracking-tight text-white">ICP<span className="text-indigo-400">Diagnostic</span></span>
        <a
          href="#start"
          className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg"
        >
          Get Free Diagnosis
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-4 py-1.5 rounded-full mb-6">
          Free ICP Diagnostic — Takes 5 Minutes
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-white mb-6">
          Find Out Why Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Ads Aren&apos;t Converting
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Get a free ICP diagnostic report in 5 minutes.{" "}
          <span className="text-white font-medium">No fluff. Just answers.</span>{" "}
          We pinpoint exactly where your targeting, messaging, or offer is leaking revenue.
        </p>
        <a
          id="start"
          href="/questionnaire"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-semibold text-lg px-10 py-4 rounded-xl shadow-lg shadow-indigo-600/30"
        >
          Get My Free Diagnosis →
        </a>
        <p className="mt-4 text-sm text-slate-500">No credit card required. Results delivered instantly.</p>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-white/10 bg-white/[0.02] py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm font-medium">
          <span>✦ 100% Free</span>
          <span>✦ AI-Powered Analysis</span>
          <span>✦ Instant Report</span>
          <span>✦ No Agency Speak</span>
          <span>✦ Actionable Fixes Only</span>
        </div>
      </div>

      {/* Pain points */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Burning ad spend with nothing to show for it?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Most campaigns fail for one of five reasons. We diagnose all of them.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "🎯",
              title: "ICP Misalignment",
              desc: "You&apos;re targeting the right industry but the wrong decision-maker — or chasing a customer who can&apos;t afford you.",
            },
            {
              icon: "📡",
              title: "Ad Targeting Mismatch",
              desc: "Your audience settings look correct but the algorithm is serving your ads to people who will never buy.",
            },
            {
              icon: "🚧",
              title: "Landing Page Friction",
              desc: "Clicks are coming in but the page kills intent. Wrong headline, wrong proof, wrong ask.",
            },
            {
              icon: "💸",
              title: "Budget Misallocation",
              desc: "Too much on top-of-funnel awareness, not enough on conversion. Or the reverse. Either way, you&apos;re bleeding.",
            },
            {
              icon: "📣",
              title: "Message to Market Disconnect",
              desc: "Your offer is solid but the copy speaks to pain your audience doesn&apos;t feel — or doesn&apos;t believe yet.",
            },
            {
              icon: "📊",
              title: "Weak Offer Positioning",
              desc: "Competitors say the same thing. Nothing in your funnel makes switching feel like the obvious next step.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-6 hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{item.title}</h3>
              <p
                className="text-slate-400 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.desc }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/[0.02] border-y border-white/10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">Three steps. Five minutes. A clear path forward.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Answer 30 questions about your business",
                desc: "Tell us about your offer, your current targeting, your funnel, and your results. No fluff questions — every one matters.",
              },
              {
                step: "02",
                title: "Get your personalized diagnostic report",
                desc: "Our AI cross-references your answers against proven ICP frameworks and surfaces exactly where your funnel is breaking.",
              },
              {
                step: "03",
                title: "Fix your targeting and convert more",
                desc: "Walk away with a prioritized action list — not a 40-page PDF you&apos;ll never read. Changes you can implement this week.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-black text-white/5 absolute -top-4 -left-2 select-none">
                  {item.step}
                </div>
                <div className="relative pt-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p
                    className="text-slate-400 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.desc }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
          Stop guessing. Start{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            converting.
          </span>
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Every day you run ads without a clear ICP is money you&apos;re handing your competitors.
          Five minutes now saves thousands later.
        </p>
        <a
          href="/questionnaire"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-semibold text-lg px-12 py-4 rounded-xl shadow-xl shadow-indigo-600/30"
        >
          Start My Free Diagnosis →
        </a>
        <p className="mt-4 text-sm text-slate-500">Takes 5 minutes. Instant results. Zero cost.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-slate-600 text-sm">
        <span>ICP<span className="text-indigo-400/60">Diagnostic</span></span>
        <span className="mx-3">·</span>
        <span>Built to help you stop wasting ad spend.</span>
      </footer>
    </main>
  )
}
