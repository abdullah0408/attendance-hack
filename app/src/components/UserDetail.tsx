"use client";
import { Card } from "@/components/ui/card";
import { User } from "@/generated/prisma";
import SignOutButton from "./SignOutButton";

export default function UserDetail({ userData }: { userData: User }) {
  const hasData = userData && Object.keys(userData).length > 0;

  if (!hasData) return null;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Card className="w-[80%] max-w-80 mx-auto !gap-0 p-6 m-4 border rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold mb-4">User Details</h2>
        <SignOutButton />
      </div>

      <div className="space-y-3">
        <div>
          <span className="font-medium text-primary">Email:</span>
          <p className="text-sm text-primary font-bold">{userData.email}</p>
        </div>

        <div>
          <span className="font-medium text-primary">Student ID:</span>
          <p className="text-sm text-muted-foreground">{userData.stuID}</p>
        </div>

        <div>
          <span className="font-medium text-primary">Automation Status:</span>
          <span
            className={`text-sm px-2 py-1 rounded-full ml-5 ${
              userData.inUse
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {userData.inUse ? "Active" : "Inactive"}
          </span>
        </div>

        <div>
          <span className="font-medium text-primary">Created:</span>
          <p className="text-sm text-muted-foreground">
            {formatDate(userData.createdAt)}
          </p>
        </div>

        {userData.cookie && (
          <div>
            <span className="font-medium text-primary">Session Status:</span>
            <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800 ml-5">
              Connected
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
