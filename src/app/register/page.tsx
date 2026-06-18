import { AnimatedPage } from "@/components/layout/animated-page";
import { PageIntro } from "@/components/layout/page-intro";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <AnimatedPage>
      <section className="container py-10 md:py-14">
        <div className="space-y-8">
          <PageIntro
            eyebrow="Get started"
            title="Create your EduMatch account."
            description="Join the platform, complete your profile and start matching with student teams."
          />
          <RegisterForm />
        </div>
      </section>
    </AnimatedPage>
  );
}
