import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <main className="static-page">
      <h1>About Green Lynk</h1>
      <p>
        Green Lynk is a private social messaging platform designed for people who want
        smarter, more intentional online connections. We combine invite-driven growth,
        rich messaging, connection approval, groups, and media sharing into one polished
        experience.
      </p>
      <p>
        Our service is built for founders, communities, early-stage networks, and teams
        who want a beautiful and secure space for conversation without the noise of
        public social feeds.
      </p>
      <section>
        <h2>What We Offer</h2>
        <ul>
          <li>Invite-based connection requests so chats start only after approval.</li>
          <li>Rich conversations with attachments, media, stickers, and emoji.</li>
          <li>Group chat and request workflows for community onboarding.</li>
          <li>Branded landing pages and streamlined invite sharing.</li>
        </ul>
      </section>
      <section>
        <h2>Contact and Pricing</h2>
        <p>
          We provide tailored pricing for startups, communities, and premium use cases.
          Pricing is available on request so we can recommend the right plan for your needs.
        </p>
      </section>
      <p>
        <Link to="/contact" className="nav-link subtle">Contact us</Link> for more details.
      </p>
    </main>
  );
}
