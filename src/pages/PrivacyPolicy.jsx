import { appConfig } from '../config';

export default function PrivacyPolicy() {
  return (
    <main className="static-page">
      <h1>Privacy Policy</h1>
      <p>
        Green Lynk respects your privacy and is committed to protecting the personal data you
        share with us while using our platform.
      </p>
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Account registration details like name, email, and profile information.</li>
          <li>Messages, attachments, and media shared within the app.</li>
          <li>Usage data such as login activity, device metadata, and feature interactions.</li>
        </ul>
      </section>
      <section>
        <h2>How we use data</h2>
        <ul>
          <li>To provide and maintain the Green Lynk service.</li>
          <li>To support secure authentication and user account management.</li>
          <li>To improve our product and develop new features.</li>
        </ul>
      </section>
      <section>
        <h2>Data sharing</h2>
        <p>
          We do not sell your personal information. We may share data with service providers
          who help operate the platform, and we comply with legal requirements when necessary.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          If you have questions about this policy, email <a href={`mailto:${appConfig.supportEmail}`}>{appConfig.supportEmail}</a>.
        </p>
      </section>
    </main>
  );
}
