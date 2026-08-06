import { appConfig } from '../config';

export default function ContactPage() {
  const supportPhoneHref = appConfig.supportPhone.replace(/\s/g, '');

  return (
    <main className="static-page">
      <h1>Contact Us</h1>
      <p>
        Have questions about Green Lynk or need help with account setup, pricing, or
        premium features? We are here to help.
      </p>
      <section>
        <h2>Get in touch</h2>
        <p>Email: <a href={`mailto:${appConfig.supportEmail}`}>{appConfig.supportEmail}</a></p>
        <p className="is-hidden">Phone: <a href={`tel:${supportPhoneHref}`}>{appConfig.supportPhone}</a></p>
        <p>Response time: within 1 business day.</p>
      </section>
      <section>
        <h2>Business details</h2>
        <p>
          Green Lynk provides digital social networking, messaging, community, and
          premium support services through this website and application.
        </p>
      </section>
      <section>
        <h2>Business inquiries</h2>
        <p>
          For Razorpay approval, premium onboarding, or custom integration questions,
          please email our team with your project details and expected usage.
        </p>
      </section>
      <section>
        <h2>Features overview</h2>
        <ul>
          <li>Invite-based messaging and connection approvals.</li>
          <li>Media-rich chat, groups, and status updates.</li>
          <li>Simple onboarding with branded registration links.</li>
          <li>Dedicated support for premium customers.</li>
        </ul>
      </section>
    </main>
  );
}
