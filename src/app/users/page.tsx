import { AnimatedPage } from "@/components/layout/animated-page";

import { UsersBrowser } from "@/features/users/components/users-browser";

export default function UsersPage() {
  return (
    <AnimatedPage>
      <UsersBrowser />
    </AnimatedPage>
  );
}
