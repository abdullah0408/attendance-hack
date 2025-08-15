import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import UserForm from "@/components/UserForm";
import UserDetail from "@/components/UserDetail";
import QrScanButton from "@/components/QrScanButton";

export default async function Home() {
  const { userId: clerkId } = await auth();

  let user = null;
  if (clerkId) {
    user = await prisma.user.findUnique({ where: { clerkId } });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <UserForm userData={user} />
      {user && <UserDetail userData={user} />}
      <div className="fixed bottom-4 right-4 z-50">
        <QrScanButton />
      </div>
    </main>
  );
}
