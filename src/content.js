import siteData from '../data/gryphons-site-content.json';
import griffinMark from '../data/site-assets/assets/Griffin_small_light.png';
import wordmark from '../data/site-assets/assets/GryphonsLightLogo.png';
import communityImage from '../data/site-assets/assets/community.png';
import isacaLogo from '../data/site-assets/assets/isaca.png';
import merchBlack from '../data/site-assets/assets/merchandise/dcdf_shirt_black.png';
import merchWhite from '../data/site-assets/assets/merchandise/dcdf_shirt_white.png';
import merchWindbreaker from '../data/site-assets/assets/merchandise/dcdf_windbreaker.png';
import merchVarsity from '../data/site-assets/assets/merchandise/gryphons_varsity_jacket.png';

const page = siteData.pages[0];
const sectionMap = Object.fromEntries(page.sections.map((section) => [section.label, section]));

function parseFaqItems(text, questions) {
  const intro = "FAQ Have a question? We'll answer them right here!";
  const cleanedText = text.replace(intro, '').trim();

  return questions.map((question, index) => {
    const start = cleanedText.indexOf(question);
    const nextQuestion = questions[index + 1];
    const end = nextQuestion ? cleanedText.indexOf(nextQuestion) : cleanedText.length;
    const answer = start >= 0
      ? cleanedText.slice(start + question.length, end >= 0 ? end : cleanedText.length).trim()
      : '';

    return { question, answer };
  });
}

function socialLabelFromUrl(url) {
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('discord.gg')) return 'Discord';
  if (url.includes('github.com')) return 'GitHub';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.startsWith('mailto:')) return 'Email';
  return 'Link';
}

const about = sectionMap.aboutus;
const mission = sectionMap.mission;
const isaca = sectionMap['about-isaca'];
const events = sectionMap.events;
const merch = sectionMap.merch;
const faq = sectionMap.faq;

export const siteContent = {
  meta: {
    title: page.title,
    heroTitle: sectionMap.hero.headings[0],
    heroSubtitle: sectionMap.hero.paragraphs[0],
    missionQuote: mission.headings[1].replace(/[“”]/g, '"'),
    footerText: sectionMap.footer.text,
  },
  assets: {
    griffinMark,
    wordmark,
    communityImage,
    isacaLogo,
  },
  nav: [
    { label: 'About', href: '#about' },
    { label: 'ISACA', href: '#isaca' },
    { label: 'Events', href: '#events' },
    { label: 'Merchandise', href: '#merch' },
    { label: 'FAQ', href: '#faq' },
  ],
  hero: {
    eyebrow: 'Student-led cybersecurity collective',
    title: sectionMap.hero.headings[0],
    subtitle: sectionMap.hero.paragraphs[0],
    primaryCta: { label: 'Enter the network', href: '#about' },
    secondaryCta: { label: 'See events', href: '#events' },
    stats: [
      { value: 'SoC', label: 'School of Computing' },
      { value: 'CTF', label: 'Offensive and defensive challenges' },
      { value: 'SIG', label: 'Official student interest group' },
    ],
    orbitLabels: ['Offensive', 'Defensive', 'Forensics'],
  },
  about: {
    eyebrow: 'About Gryphons',
    title: about.displayTitle,
    paragraphs: about.paragraphs,
    highlightLabel: 'Community',
    highlightTitle: 'A place to build, belong, and get sharper together.',
    highlightBody:
      'Gryphons welcomes students across the School of Computing with a shared interest in cybersecurity and turns that energy into practical growth.',
    image: communityImage,
  },
  mission: {
    eyebrow: 'Mission',
    quote: mission.headings[1],
    pillars: [
      {
        title: mission.headings[2],
        description: mission.paragraphs[0],
      },
      {
        title: mission.headings[3],
        description: mission.paragraphs[1],
      },
    ],
  },
  isaca: {
    eyebrow: 'ISACA Chapter',
    title: sectionMap.isaca.headings[0],
    kicker: sectionMap.isaca.paragraphs[0],
    paragraphs: isaca.paragraphs.slice(0, 2),
    missions: [
      {
        title: isaca.headings[2],
        description: isaca.paragraphs[2],
      },
      {
        title: isaca.headings[3],
        description: isaca.paragraphs[3],
      },
    ],
    featured: [
      {
        title: isaca.headings[5],
        description: isaca.paragraphs[4],
      },
      {
        title: isaca.headings[6],
        description: isaca.paragraphs[5],
      },
    ],
    image: isacaLogo,
  },
  events: {
    eyebrow: 'Events',
    title: events.headings[0],
    intro: events.paragraphs[0],
    items: [
      {
        id: 'gctf',
        label: 'Signature competition',
        title: 'Gryphons CTF',
        description: events.paragraphs[1],
      },
      {
        id: 'ycep',
        label: 'Bootcamp',
        title: 'Youth Cyber Exploration Programme',
        description: events.paragraphs[2],
      },
      {
        id: 'ctf101',
        label: 'Workshop series',
        title: 'CTF101',
        description: events.paragraphs[3],
      },
      {
        id: 'lag-and-crash',
        label: 'Inter-polytechnic event',
        title: 'Lag and Crash CTF',
        description: events.paragraphs[4],
      },
      {
        id: 'cyberblitz',
        label: 'Monthly drop',
        title: 'Gryphons CyberBlitz!',
        description: events.paragraphs[5],
      },
    ],
  },
  merchandise: {
    eyebrow: 'Merchandise',
    title: merch.headings[0],
    intro: merch.paragraphs[0],
    paragraphs: merch.paragraphs.slice(1),
    items: [
      { title: 'DCDF Shirt / Black', image: merchBlack },
      { title: 'DCDF Shirt / White', image: merchWhite },
      { title: 'Varsity Jacket', image: merchVarsity },
      { title: 'Windbreaker', image: merchWindbreaker },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: faq.headings[0],
    intro: faq.paragraphs[0],
    items: parseFaqItems(faq.text, faq.buttons),
  },
  footer: {
    address:
      'School of Computing, Block T19, Singapore Polytechnic, 500 Dover Road, Singapore 139651',
    email: 'contactus@gryphons.sg',
    socials: page.links
      .filter((link) => link.absoluteHref && link.absoluteHref !== 'https://gryphons.sg/#')
      .filter((link) => !String(link.absoluteHref).includes('#'))
      .map((link) => ({
        label: socialLabelFromUrl(link.absoluteHref),
        href: link.absoluteHref,
      })),
  },
};
