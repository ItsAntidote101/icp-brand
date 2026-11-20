import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Shared look and closing section for every public page: home, pricing, about
// and the guides. One set of styles, one button wording.

export const CTA = 'Get my free diagnosis'

export const siteCss = `
.hp{--ink:#201515;--ink2:#36342e;--muted:#605d52;--faint:#8a877b;--bg:#f8f4f0;--card:#fff;--line:rgba(201,192,177,.55);--fill:rgba(32,21,21,.05);--accent:#e8330a;--good:#15803d;
  --head:'PolySans Median',-apple-system,system-ui,sans-serif;--body:'PolySans Neutral',-apple-system,system-ui,sans-serif;
  background:var(--bg);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:clip}
.hp *{box-sizing:border-box}
.hp a{color:inherit}
.hp :focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:8px}
.hp-wrap{max-width:1080px;margin:0 auto;padding:0 clamp(20px,5vw,40px)}
.hp section{padding:clamp(56px,9vw,104px) 0}
.hp h1,.hp h2,.hp h3{font-family:var(--head);font-weight:700;letter-spacing:-.025em;margin:0;text-wrap:balance}
.hp h1{font-size:clamp(40px,7.2vw,76px);line-height:1.02}
.hp h2{font-size:clamp(28px,4.4vw,44px);line-height:1.1}
.hp h3{font-size:19px;line-height:1.3;letter-spacing:-.01em}
.hp p{margin:0;text-wrap:pretty}
.hp-lead{font-size:clamp(17px,2vw,20px);line-height:1.55;color:var(--ink2);max-width:58ch}
.hp-sub{font-size:17px;line-height:1.6;color:var(--muted);max-width:62ch;margin-top:14px!important}
.hp-kicker{font-size:15px;color:var(--muted);margin-bottom:18px!important}
.hp-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:54px;padding:0 28px;border-radius:980px;background:var(--ink);color:#fff!important;font:600 17px/1 var(--body);text-decoration:none;border:0;cursor:pointer;transition:transform .15s ease,background .15s ease}
.hp-btn:hover{background:#000}.hp-btn:active{transform:scale(.98)}
.hp-btn-sm{min-height:42px;padding:0 18px;font-size:15px}
.hp-btn-light{background:#fff;color:var(--ink)!important}.hp-btn-light:hover{background:#f1ece6}
.hp-fine{font-size:14px;color:var(--faint);margin-top:14px!important}
.hp-card{background:var(--card);border-radius:22px;box-shadow:0 1px 2px rgba(32,21,21,.05),0 10px 30px -14px rgba(32,21,21,.16)}
.hp-sep{height:1px;background:var(--line)}

.hp-nav{position:sticky;top:0;z-index:50;background:rgba(248,244,240,.86);backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);border-bottom:1px solid var(--line)}
.hp-nav-in{max-width:1080px;margin:0 auto;padding:0 clamp(20px,5vw,40px);height:62px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.hp-brand{display:flex;align-items:center;gap:9px;font:700 16px/1 var(--head);text-decoration:none}
.hp-mark{width:24px;height:24px;border-radius:7px;background:var(--accent)}
.hp-links{display:none;gap:28px}.hp-links a,.hp-login{font-size:15px;color:var(--muted);text-decoration:none}.hp-links a:hover,.hp-login:hover{color:var(--ink)}
.hp-nav-cta{display:flex;align-items:center;gap:14px}.hp-login{display:none}
.hp-burger{display:flex;background:none;border:0;padding:8px;margin-right:-8px;color:var(--ink);cursor:pointer}
.hp-menu{position:fixed;inset:62px 0 0;background:var(--bg);padding:12px clamp(20px,5vw,40px) 40px;display:flex;flex-direction:column;overflow:auto}
.hp-menu a:not(.hp-btn){font:700 24px/1 var(--head);padding:20px 0;border-bottom:1px solid var(--line);text-decoration:none}
@media (max-width:420px){.hp-nav-cta .hp-btn-sm{display:none}}
@media (min-width:900px){.hp-links{display:flex}.hp-login{display:inline}.hp-burger{display:none}}

.hp-hero{padding-top:clamp(40px,7vw,88px)!important}
.hp-hero-grid{display:grid;gap:clamp(36px,6vw,64px);align-items:center}
@media (min-width:900px){.hp-hero-grid{grid-template-columns:1.15fr .85fr}}
.hp-hero .hp-lead{margin:22px 0 30px}

.hp-chat{padding:20px 18px 18px;max-width:400px;width:100%;justify-self:center}
.hp-chat-top{display:flex;align-items:center;gap:10px;padding:0 4px 14px;border-bottom:1px solid var(--line);margin-bottom:16px}
.hp-ava{width:36px;height:36px;border-radius:50%;background:var(--fill);display:flex;align-items:center;justify-content:center;font:600 14px/1 var(--body);color:var(--muted)}
.hp .hp-bub{width:fit-content;max-width:84%;padding:11px 14px;border-radius:18px;font-size:15px;line-height:1.45;margin-bottom:8px}
.hp-in{background:var(--fill);border-bottom-left-radius:6px}
.hp .hp-out{background:var(--ink);color:#fff;margin-left:auto;border-bottom-right-radius:6px}
.hp-seen{text-align:center;font-size:13px;color:var(--faint);padding:14px 0 4px}
.hp-seen strong{display:block;font:600 15px/1.4 var(--body);color:var(--accent)}

.hp-list{list-style:none;margin:32px 0 0;padding:0}
.hp-list li{display:flex;gap:14px;align-items:flex-start;padding:18px 0;border-top:1px solid var(--line);font-size:clamp(17px,2.1vw,21px);line-height:1.4}
.hp-list li:last-child{border-bottom:1px solid var(--line)}
.hp-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:.55em;flex-shrink:0}

.hp-grid2{display:grid;gap:16px;margin-top:36px}
@media (min-width:760px){.hp-grid2{grid-template-columns:1fr 1fr}}
.hp-cause{padding:26px 26px 28px}
.hp-cause p{font-size:16px;line-height:1.6;color:var(--muted);margin-top:8px}

.hp-how{display:grid;gap:clamp(32px,6vw,64px);align-items:start;margin-top:40px}
@media (min-width:900px){.hp-how{grid-template-columns:.9fr 1.1fr}}
.hp-steps{list-style:none;margin:0;padding:0;counter-reset:s}
.hp-steps li{counter-increment:s;position:relative;padding:0 0 28px 56px}
.hp-steps li::before{content:counter(s);position:absolute;left:0;top:-2px;width:38px;height:38px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(32,21,21,.08),0 4px 12px -6px rgba(32,21,21,.2);display:flex;align-items:center;justify-content:center;font:700 16px/1 var(--head)}
.hp-steps li:not(:last-child)::after{content:'';position:absolute;left:18.5px;top:42px;bottom:6px;width:1px;background:var(--line)}
.hp-steps p{font-size:16px;line-height:1.6;color:var(--muted);margin-top:6px}

.hp-report{padding:clamp(22px,3vw,30px)}
.hp-tag{display:inline-block;font-size:13px;color:var(--muted);background:var(--fill);border-radius:980px;padding:6px 12px;margin-bottom:20px}
.hp-score{display:flex;align-items:center;gap:20px;padding-bottom:22px}
.hp-ring{position:relative;width:96px;height:96px;flex-shrink:0}
.hp-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 32px/1 var(--head);letter-spacing:-.03em}
.hp-waste{font:700 clamp(22px,3vw,28px)/1.15 var(--head);letter-spacing:-.02em}
.hp-small{font-size:14px;line-height:1.5;color:var(--muted)}
.hp-find{display:flex;gap:12px;align-items:flex-start;padding:14px 0;font-size:16px;line-height:1.45}
.hp-sev{width:9px;height:9px;border-radius:50%;margin-top:.5em;flex-shrink:0}
.hp .hp-fix{margin-top:8px;padding:16px 18px;background:var(--fill);border-radius:14px;font-size:15px;line-height:1.55}
.hp-fix strong{font-weight:600}

.hp-me{display:grid;gap:clamp(28px,5vw,56px);align-items:center}
@media (min-width:820px){.hp-me{grid-template-columns:300px 1fr}}
.hp-photo{aspect-ratio:4/5;width:100%;max-width:300px;border-radius:22px;background:linear-gradient(160deg,#eadfd3,#d8c9b8);display:flex;align-items:flex-end;padding:18px;font:700 64px/1 var(--head);color:rgba(32,21,21,.28);letter-spacing:-.04em}
.hp-me p{font-size:clamp(17px,2vw,19px);line-height:1.65;color:var(--ink2);max-width:60ch;margin-top:16px}

.hp-dark{background:var(--ink);color:#fff}
.hp-dark h2,.hp-dark h3,.hp-dark .hp-price p{color:#fff}
.hp-dark .hp-sub,.hp-dark .hp-stay p{color:rgba(255,255,255,.66)}
.hp-stay-grid{display:grid;gap:0;margin-top:40px;border-top:1px solid rgba(255,255,255,.14)}
@media (min-width:820px){.hp-stay-grid{grid-template-columns:repeat(3,1fr);border-top:0;gap:clamp(24px,4vw,48px)}}
.hp-stay{padding:24px 0;border-bottom:1px solid rgba(255,255,255,.14)}
@media (min-width:820px){.hp-stay{border-bottom:0;border-top:1px solid rgba(255,255,255,.14)}}
.hp-stay p{font-size:16px;line-height:1.6;margin-top:8px}
.hp-price{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between;margin-top:36px}
.hp-price p{font-size:17px;line-height:1.55;max-width:52ch}.hp-price strong{font-weight:600}
.hp-textlink{font:600 16px/1 var(--body);text-decoration:underline;text-underline-offset:4px}

.hp-when{display:grid;gap:clamp(28px,5vw,56px);align-items:start}
@media (min-width:900px){.hp-when{grid-template-columns:1fr 1fr}}
.hp-check{list-style:none;margin:0;padding:8px 26px}
.hp-check li{display:flex;gap:14px;align-items:flex-start;padding:17px 0;font-size:17px;line-height:1.45}
.hp-check li+li{border-top:1px solid var(--line)}
.hp-tick{width:24px;height:24px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}

.hp-faq{margin-top:32px;overflow:hidden}
.hp-faq details+details{border-top:1px solid var(--line)}
.hp-faq summary{list-style:none;cursor:pointer;padding:22px 26px;font:600 18px/1.35 var(--body);display:flex;justify-content:space-between;gap:16px;align-items:center}
.hp-faq summary::-webkit-details-marker{display:none}
.hp-faq summary::after{content:'+';font:400 26px/1 var(--body);color:var(--faint);flex-shrink:0;transition:transform .2s ease}
.hp-faq details[open] summary::after{transform:rotate(45deg)}
.hp-faq details p{padding:0 26px 24px;font-size:16px;line-height:1.65;color:var(--muted);max-width:70ch}

.hp-end{text-align:left}
.hp-end .hp-lead{color:rgba(255,255,255,.72);margin:18px 0 30px}
.hp-foot{padding:32px 0 48px;display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between;font-size:14px;color:rgba(255,255,255,.55);border-top:1px solid rgba(255,255,255,.14)}
.hp-foot nav{display:flex;flex-wrap:wrap;gap:8px 22px}.hp-foot a{text-decoration:none}.hp-foot a:hover{color:#fff}
@media (prefers-reduced-motion:reduce){.hp *{transition:none!important}}

.hp-page-top{padding:clamp(40px,7vw,80px) 0 clamp(28px,4vw,44px)!important}
.hp-page-top h1{font-size:clamp(34px,5.6vw,58px);line-height:1.05;max-width:18ch}
.hp-plans{display:grid;gap:16px}
@media (min-width:700px){.hp-plans{grid-template-columns:1fr 1fr}}
@media (min-width:1040px){.hp-plans{grid-template-columns:repeat(4,1fr)}}
.hp-plan{padding:26px 24px 28px;display:flex;flex-direction:column}
.hp-plan-pick{outline:2px solid var(--ink);outline-offset:-2px}
.hp-plan-for{font-size:15px;line-height:1.5;color:var(--muted);margin-top:8px!important;min-height:4.5em}
.hp-plan-price{font:700 30px/1.1 var(--head);letter-spacing:-.025em;margin:18px 0 4px!important}
.hp-plan-price small{font:400 15px/1 var(--body);color:var(--muted);letter-spacing:0}
.hp-plan ul{list-style:none;margin:18px 0 24px;padding:0;flex:1}
.hp-plan li{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.45;padding:7px 0}
.hp-plan li svg{flex-shrink:0;margin-top:3px;color:var(--good)}
.hp-plan .hp-btn{width:100%;min-height:48px;font-size:15px;padding:0 14px;white-space:nowrap}
.hp-btn-line{background:transparent;color:var(--ink)!important;box-shadow:inset 0 0 0 1.5px var(--ink)}.hp-btn-line:hover{background:var(--fill)}
.hp-badge{align-self:flex-start;font:600 13px/1 var(--body);background:var(--ink);color:#fff;border-radius:980px;padding:6px 11px;margin-bottom:12px}
.hp-prose{max-width:68ch}
.hp-prose h2{font-size:clamp(24px,3.4vw,32px);margin-top:44px}
.hp-prose p{font-size:18px;line-height:1.7;color:var(--ink2);margin-top:16px}
.hp-prose p.hp-answer{font-size:clamp(19px,2.3vw,22px);line-height:1.55;color:var(--ink);margin-top:0}
.hp-prose ul,.hp-prose ol{margin:16px 0 0;padding-left:22px}
.hp-prose li{font-size:18px;line-height:1.65;color:var(--ink2);padding:5px 0}
.hp-prose strong{font-weight:600;color:var(--ink)}
.hp-note{margin-top:28px;padding:20px 22px;background:var(--card);border-radius:18px;box-shadow:0 1px 2px rgba(32,21,21,.05),0 10px 30px -14px rgba(32,21,21,.16)}
.hp-prose .hp-note p{margin-top:0;font-size:17px}
.hp-crumb{font-size:15px;color:var(--muted);margin-bottom:18px!important}.hp-crumb a{text-decoration:underline;text-underline-offset:3px}
.hp-guides{display:grid;gap:16px;margin-top:8px}
@media (min-width:820px){.hp-guides{grid-template-columns:repeat(3,1fr)}}
.hp-guide{display:block;padding:26px;text-decoration:none;transition:transform .15s ease}.hp-guide:hover{transform:translateY(-2px)}
.hp-guide p{font-size:16px;line-height:1.55;color:var(--muted);margin-top:10px}
.hp-guide span{display:inline-block;margin-top:16px;font:600 15px/1 var(--body);text-decoration:underline;text-underline-offset:4px}
.hp-byline{display:flex;align-items:center;gap:12px;margin-top:22px;font-size:15px;color:var(--muted)}
.hp-byline i{width:40px;height:40px;border-radius:50%;background:linear-gradient(160deg,#eadfd3,#d8c9b8);display:flex;align-items:center;justify-content:center;font:700 14px/1 var(--head);font-style:normal;color:rgba(32,21,21,.45)}

.hp-c{text-align:center}
.hp-c h1,.hp-c h2,.hp-c .hp-lead,.hp-c .hp-sub{margin-left:auto!important;margin-right:auto!important}
.hp-top{padding:clamp(44px,8vw,96px) 0 clamp(40px,6vw,72px)!important}
.hp-top h1{font-size:clamp(44px,8.4vw,92px);line-height:.98;max-width:12ch}
.hp-top .hp-lead{font-size:clamp(20px,2.6vw,26px);line-height:1.35;margin:22px auto 30px!important;color:var(--ink2)}
.hp-top .hp-chat{margin:clamp(40px,6vw,64px) auto 0;text-align:left}
.hp-four{list-style:none;margin:clamp(40px,6vw,64px) auto 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:28px 16px;max-width:880px}
@media (min-width:760px){.hp-four{grid-template-columns:repeat(4,1fr)}}
.hp-four li{font:500 16px/1.3 var(--body);color:var(--ink)}
.hp-ico{width:56px;height:56px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(32,21,21,.06),0 8px 22px -12px rgba(32,21,21,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--ink)}
.hp-tiles{display:grid;gap:20px}
.hp-tile{border-radius:30px;padding:clamp(28px,5vw,60px);display:grid;gap:clamp(28px,4vw,56px);align-items:center;background:var(--card);box-shadow:0 1px 2px rgba(32,21,21,.05),0 10px 30px -14px rgba(32,21,21,.16)}
@media (min-width:900px){.hp-tile{grid-template-columns:1fr 1fr}.hp-tile-flip>:first-child{order:2}}
.hp-tile h2{font-size:clamp(30px,4.6vw,52px);line-height:1.04}
.hp-tt>p{font-size:clamp(17px,2vw,20px);line-height:1.5;color:var(--muted);margin-top:14px;max-width:34ch}
.hp-tile-dark{background:var(--ink);box-shadow:none}.hp-tile-dark h2{color:#fff}.hp-tile-dark .hp-tt>p{color:rgba(255,255,255,.66)}
.hp-tile-warm{background:#efe5da;box-shadow:none}
.hp-tile .hp-report{box-shadow:none;background:#fff;color:var(--ink)}
.hp-tile .hp-photo{max-width:340px;margin:0 auto}
.hp-more{display:inline-flex;align-items:center;gap:6px;margin-top:22px;font:600 17px/1 var(--body);color:var(--accent)!important;text-decoration:none}.hp-more:hover{text-decoration:underline;text-underline-offset:4px}
.hp-tile-dark .hp-more{color:#ff8a6b!important}
.hp-rows{list-style:none;margin:0;padding:0}
.hp-rows li{display:flex;align-items:center;gap:16px;padding:18px 0;font:500 clamp(17px,2vw,20px)/1.3 var(--body)}
.hp-rows li+li{border-top:1px solid var(--line)}
.hp-rows .hp-ico{width:46px;height:46px;margin:0;flex-shrink:0;background:var(--fill);box-shadow:none}
.hp-minis{display:grid;gap:16px;margin-top:36px}
@media (min-width:820px){.hp-minis{grid-template-columns:repeat(3,1fr)}}
.hp-mini{padding:22px 22px 26px;text-align:left}
.hp-mini-vis{height:132px;border-radius:16px;background:var(--fill);margin-bottom:20px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:16px}
.hp-mini p{font-size:16px;line-height:1.5;color:var(--muted);margin-top:6px}
.hp-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:28px auto 34px;max-width:760px;list-style:none;padding:0}
.hp-chips li{font:500 16px/1 var(--body);background:var(--card);border-radius:980px;padding:13px 18px;box-shadow:0 1px 2px rgba(32,21,21,.06),0 6px 16px -10px rgba(32,21,21,.2)}
.hp-priceline{font-size:17px;line-height:1.5;color:var(--muted);margin-top:28px!important}.hp-priceline strong{color:var(--ink);font-weight:600}
`

export function SiteStyles() {
  return <style dangerouslySetInnerHTML={{ __html: siteCss }} />
}

export function SiteFooter({ title, lead }: { title: string; lead?: string }) {
  return (
    <footer className="hp-dark">
      <section className="hp-end">
        <div className="hp-wrap">
          <h2>{title}</h2>
          <p className="hp-lead">{lead ?? '10 questions, about 3 minutes. Your score and your first fixes, free.'}</p>
          <Link href="/questionnaire" className="hp-btn hp-btn-light">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
      <div className="hp-wrap">
        <div className="hp-foot">
          <span>© 2026 Ideal ICP, Nairobi</span>
          <nav aria-label="Footer">
            <Link href="/pricing">Pricing</Link><Link href="/guides">Guides</Link><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:info@idealicp.com">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
