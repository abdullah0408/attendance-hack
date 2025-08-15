import { useClerk } from "@clerk/nextjs";
import React from "react";
import { Button } from "./ui/button";
import { LogOutIcon } from "lucide-react";

const SignOutButton = () => {
  const { signOut } = useClerk();

  return (
    <Button variant="outline" onClick={() => signOut()}>
      Logout
      <LogOutIcon className="mr-2 h-4 w-4" />
    </Button>
  );
};

export default SignOutButton;
