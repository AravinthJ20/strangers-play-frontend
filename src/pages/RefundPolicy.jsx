import { appConfig } from '../config';

export default function RefundPolicy() {
  return (
    <main className="static-page">
      <h1>Refund Policy</h1>
      <p>
        Green Lynk is committed to delivering a high-quality messaging platform. This refund policy explains when refunds may be available.
      </p>
      <section>
        <h2>Eligibility</h2>
        <p>
          Refunds are considered on a case-by-case basis for paid or premium accounts when the service does not function as described,
          or when we fail to deliver agreed onboarding services.
        </p>
      </section>
      <section>
        <h2>How to request a refund</h2>
        <p>
          Contact support at <a href={`mailto:${appConfig.supportEmail}`}>{appConfig.supportEmail}</a> and provide your account details and reason.
        </p>
      </section>
      <section>
        <h2>Processing</h2>
        <p>
          Refund requests are reviewed within 7 business days. Final approval is at our discretion and depends on the circumstances.
        </p>
      </section>
    </main>
  );
}
