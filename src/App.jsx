import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ParticleLogo } from './ParticleLogo';
import { siteContent } from './content';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const rootRef = useRef(null);
  const eventsSectionRef = useRef(null);
  const eventsTrackRef = useRef(null);
  const [activeFaq, setActiveFaq] = useState(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const context = gsap.context(() => {
      const introTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      introTimeline
        .from('.nav-shell', { y: -32, opacity: 0, duration: 0.9 })
        .from(
          '.hero-reveal',
          {
            y: 64,
            opacity: 0,
            duration: 1.1,
            stagger: 0.1,
          },
          '-=0.35',
        )
        .from(
          '.hero-stat',
          {
            y: 24,
            opacity: 0,
            duration: 0.7,
            stagger: 0.08,
          },
          '-=0.55',
        );

      gsap.utils.toArray('[data-reveal]').forEach((element, index) => {
        gsap.from(element, {
          y: 70,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          delay: index % 4 === 0 ? 0 : 0.04,
          scrollTrigger: {
            trigger: element,
            start: 'top 84%',
          },
        });
      });

      gsap.utils.toArray('[data-parallax]').forEach((element) => {
        const speed = Number(element.dataset.speed || 0.2);
        gsap.fromTo(
          element,
          { yPercent: -12 * speed * 10 },
          {
            yPercent: 12 * speed * 10,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      gsap.to('.progress-bar', {
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.35,
        },
      });

      const media = gsap.matchMedia();
      media.add('(min-width: 901px)', () => {
        const section = eventsSectionRef.current;
        const track = eventsTrackRef.current;
        if (!section || !track) {
          return undefined;
        }

        const pinTarget = section.querySelector('.events-pin');
        const distance = () => Math.max(track.scrollWidth - pinTarget.clientWidth, 0);

        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pinTarget,
            start: 'top top',
            end: () => `+=${distance() + window.innerHeight * 0.65}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          ScrollTrigger.refresh();
        };
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <div className="app-shell" ref={rootRef}>
      <div className="page-noise" />
      <div className="progress-shell">
        <span className="progress-bar" />
      </div>

      <header className="floating-header nav-shell">
        <a className="brand-lockup" href="#top">
          <img alt="Gryphons mark" src={siteContent.assets.griffinMark} />
          <span>Gryphons</span>
        </a>

        <nav className="header-nav">
          {siteContent.nav.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="nav-cta" href="#events">
          Explore events
        </a>
      </header>

      <main>
        <section className="hero-entry" id="top">
          <div className="hero-stick">
            <div className="hero-camera">
              <div className="hero-grid">
                <div className="hero-copy">
                  <p className="section-eyebrow hero-reveal">{siteContent.hero.eyebrow}</p>

                  <div className="hero-title-wrap">
                    <h1 className="hero-title hero-title-primary">
                      <span className="hero-reveal">{siteContent.hero.title}</span>
                    </h1>

                    <div className="hero-outline-stack hero-reveal" aria-hidden="true">
                      <span>Networked.</span>
                      <span>Restless.</span>
                      <span>Precise.</span>
                    </div>
                  </div>

                  <p className="hero-description hero-reveal">{siteContent.hero.subtitle}</p>

                  <div className="hero-actions hero-reveal">
                    <a className="button-primary" href={siteContent.hero.primaryCta.href}>
                      {siteContent.hero.primaryCta.label}
                    </a>
                    <a className="button-secondary" href={siteContent.hero.secondaryCta.href}>
                      {siteContent.hero.secondaryCta.label}
                    </a>
                  </div>

                  <div className="hero-stats">
                    {siteContent.hero.stats.map((stat) => (
                      <article className="hero-stat panel" key={stat.label}>
                        <span>{stat.value}</span>
                        <small>{stat.label}</small>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="hero-visual hero-reveal">
                  <div className="hero-visual-frame">
                    <div className="orbit-chip orbit-chip-1">
                      <span>{siteContent.hero.orbitLabels[0]}</span>
                    </div>
                    <div className="orbit-chip orbit-chip-2">
                      <span>{siteContent.hero.orbitLabels[1]}</span>
                    </div>
                    <div className="orbit-chip orbit-chip-3">
                      <span>{siteContent.hero.orbitLabels[2]}</span>
                    </div>

                    <div className="hero-visual-shell">
                      <ParticleLogo imageSrc={siteContent.assets.griffinMark} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="marquee-band">
          <div className="marquee-track">
            <span>cybersecurity</span>
            <span>student-led</span>
            <span>hands-on workshops</span>
            <span>community</span>
            <span>capture the flag</span>
            <span>industry exposure</span>
            <span>cybersecurity</span>
            <span>student-led</span>
            <span>hands-on workshops</span>
            <span>community</span>
            <span>capture the flag</span>
            <span>industry exposure</span>
          </div>
        </section>

        <section className="section manifesto-grid" id="about">
          <div className="section-lead">
            <p className="section-eyebrow" data-reveal>
              {siteContent.about.eyebrow}
            </p>
            <h2 data-reveal>{siteContent.about.title}</h2>
            {siteContent.about.paragraphs.map((paragraph) => (
              <p data-reveal key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="manifesto-panels">
            <article className="panel statement-panel" data-reveal>
              <span className="panel-label">{siteContent.about.highlightLabel}</span>
              <h3>{siteContent.about.highlightTitle}</h3>
              <p>{siteContent.about.highlightBody}</p>
              <div className="statement-image-frame" data-parallax data-speed="0.22">
                <img alt="Community illustration" src={siteContent.about.image} />
              </div>
            </article>

            <article className="panel quote-panel" data-reveal>
              <span className="panel-label">{siteContent.mission.eyebrow}</span>
              <blockquote>{siteContent.mission.quote}</blockquote>
            </article>

            {siteContent.mission.pillars.map((pillar, index) => (
              <article className="panel value-panel" data-reveal key={pillar.title}>
                <span className="panel-index">0{index + 1}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section isaca-zone" id="isaca">
          <div className="section-head" data-reveal>
            <p className="section-eyebrow">{siteContent.isaca.eyebrow}</p>
            <h2>{siteContent.isaca.title}</h2>
            <p>{siteContent.isaca.kicker}</p>
          </div>

          <div className="isaca-stage">
            <article className="panel isaca-emblem" data-parallax data-speed="0.18">
              <img alt="ISACA logo" src={siteContent.isaca.image} />
              <div className="emblem-copy">
                {siteContent.isaca.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <div className="isaca-grid">
              {siteContent.isaca.missions.map((item) => (
                <article className="panel mission-card" data-reveal key={item.title}>
                  <span className="panel-label">Mission</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}

              {siteContent.isaca.featured.map((item) => (
                <article className="panel mission-card" data-reveal key={item.title}>
                  <span className="panel-label">Featured</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section events-zone" id="events" ref={eventsSectionRef}>
          <div className="section-head" data-reveal>
            <p className="section-eyebrow">{siteContent.events.eyebrow}</p>
            <h2>{siteContent.events.title}</h2>
            <p>{siteContent.events.intro}</p>
          </div>

          <div className="events-pin">
            <div className="events-track" ref={eventsTrackRef}>
              {siteContent.events.items.map((item, index) => (
                <article className="panel event-card" key={item.id}>
                  <div className="event-card-top">
                    <span className="event-index">0{index + 1}</span>
                    <span className="event-tag">{item.label}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section merch-zone" id="merch">
          <div className="merch-copy" data-reveal>
            <p className="section-eyebrow">{siteContent.merchandise.eyebrow}</p>
            <h2>{siteContent.merchandise.title}</h2>
            <p>{siteContent.merchandise.intro}</p>
            {siteContent.merchandise.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="merch-grid">
            {siteContent.merchandise.items.map((item, index) => (
              <figure
                className="panel merch-card"
                data-parallax
                data-reveal
                data-speed={0.14 + index * 0.04}
                key={item.title}
              >
                <div className="merch-image-shell">
                  <img alt={item.title} src={item.image} />
                </div>
                <figcaption>{item.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="section faq-zone" id="faq">
          <div className="section-head" data-reveal>
            <p className="section-eyebrow">{siteContent.faq.eyebrow}</p>
            <h2>{siteContent.faq.title}</h2>
            <p>{siteContent.faq.intro}</p>
          </div>

          <div className="faq-list panel" data-reveal>
            {siteContent.faq.items.map((item, index) => {
              const open = activeFaq === index;

              return (
                <div className={`faq-item ${open ? 'is-open' : ''}`} key={item.question}>
                  <button
                    aria-expanded={open}
                    className="faq-question"
                    onClick={() => setActiveFaq(open ? -1 : index)}
                    type="button"
                  >
                    <span>{item.question}</span>
                    <span className="faq-symbol">{open ? '−' : '+'}</span>
                  </button>
                  <div className="faq-answer">
                    <p>
                      {item.answer || 'No detailed answer was published on the current site for this question.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="footer-zone section">
        <div className="footer-brand" data-reveal>
          <img alt="Gryphons wordmark" src={siteContent.assets.wordmark} />
          <p>{siteContent.meta.heroSubtitle}</p>
        </div>

        <div className="footer-columns">
          <article data-reveal>
            <span className="panel-label">Contact</span>
            <a href={`mailto:${siteContent.footer.email}`}>{siteContent.footer.email}</a>
            <p>{siteContent.footer.address}</p>
          </article>

          <article data-reveal>
            <span className="panel-label">Connect</span>
            <div className="footer-links">
              {siteContent.footer.socials.map((item) => (
                <a href={item.href} key={item.href} rel="noreferrer" target="_blank">
                  {item.label}
                </a>
              ))}
            </div>
          </article>
        </div>
      </footer>
    </div>
  );
}

export default App;
