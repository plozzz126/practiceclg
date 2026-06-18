import { AnimatedPage } from "@/components/layout/animated-page";
import { PageIntro } from "@/components/layout/page-intro";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <AnimatedPage>
      <section className="container py-10 md:py-14">
        <div className="space-y-8">
          <PageIntro
            eyebrow="Access"
            title="Return to your student workspace."
            description="Log in to continue exploring projects, teammates and your personalized dashboard."
          />
          <LoginForm />
        </div>
      </section>
    </AnimatedPage>
  );
}
