import { RegisterForm } from "@/components/forms/register-form";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";

const directions = ["Хакатон", "CTF", "Кибербезопасность", "AI", "Мобильные", "Стартап"];

export default function RegisterPage() {
  return (
    <section className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[20px] border border-border bg-card shadow-soft md:min-h-[calc(100vh-4rem)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-between bg-teal-700 p-8 text-white md:p-12">
          <div>
            <Logo className="[&_span:first-child]:border-white [&_span:first-child]:bg-white [&_span:first-child]:text-teal-700 [&_span:last-child]:text-white" />
            <p className="mt-12 max-w-sm text-lg leading-8 text-teal-50">
              Собери профиль, выбери навыки и находи проекты, где твой стек действительно нужен команде.
            </p>
          </div>
          <div className="mt-10 rounded-[8px] border border-white/20 bg-white/12 p-5">
            <p className="text-sm text-teal-50">Направления</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {directions.map((item) => (
                <Badge key={item} className="border-white/25 bg-white/10 text-white" variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-12">
          <RegisterForm />
        </div>
      </div>
    </section>
  );
}
