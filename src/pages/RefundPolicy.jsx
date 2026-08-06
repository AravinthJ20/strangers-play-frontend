import { appConfig } from '../config';

export default function RefundPolicy() {
  return (
    <main className="static-page">
      <h1>Refund & Cancellation Policy</h1>
      <p>
        Green Lynk is committed to delivering a high-quality digital messaging platform.
        This policy explains cancellations and when refunds may be available for paid
        or premium services.
      </p>
      <section>
        <h2>Cancellation</h2>
        <p>
          You may request cancellation of a paid plan by contacting support. Access to
          premium features may continue until the end of the active billing period unless
          otherwise agreed in writing.
        </p>
      </section>
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
          Refund requests are reviewed within 7 business days. Approved refunds are
          processed to the original payment method within 7 to 10 business days, subject
          to payment gateway and bank timelines.
        </p>
      </section>
    </main>
  );
}
