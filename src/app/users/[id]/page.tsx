import { AnimatedPage } from "@/components/layout/animated-page";

import { UserProfileView } from "@/features/users/components/user-profile-view";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AnimatedPage>
      <UserProfileView userId={id} />
    </AnimatedPage>
  );
}
