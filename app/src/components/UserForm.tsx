"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Loader } from "lucide-react";
import axios from "axios";
import { User } from "@/generated/prisma";

export default function UserForm({ userData }: { userData: User | null }) {
  const router = useRouter();
  const [email, setEmail] = useState(userData?.email || "");
  const [password, setPassword] = useState(userData?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState("");
  const [toggleError, setToggleError] = useState("");
  const [toggleSuccess, setToggleSuccess] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [automateAttendance, setAutomateAttendance] = useState(
    userData?.inUse || false
  );
  const [toggleLoading, setToggleLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleVerify = async () => {
    setVerifyLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post("/api/camu-credentials", {
        email,
        password,
      });
      if (response.data.message === "Correct credentials") {
        setSuccessMessage("Credentials verified successfully!");
        router.refresh();
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error verifying credentials:", error);
      setError(
        error.response?.data?.error || "Failed to connect to the server"
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleToggleAutomate = async (value: boolean) => {
    setToggleLoading(true);
    setToggleError("");
    setToggleSuccess("");
    try {
      await axios.post("/api/toggle-attendance-automation", { inUse: value });
      setAutomateAttendance(value);
      setToggleSuccess(
        `Automation ${value ? "enabled" : "disabled"} successfully!`
      );
      setTimeout(() => setToggleSuccess(""), 3000);
    } catch {
      setToggleError(
        `Failed to ${
          value ? "enable" : "disable"
        } automation. Please try again.`
      );
    } finally {
      setToggleLoading(false);
    }
  };

  const isFormValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0,
    [email, password]
  );

  return (
    <div className="w-[80%] max-w-80 mx-auto space-y-4 p-6 m-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-center mb-6">CAMU Credentials</h2>
      <div className="space-y-2">
        <Label htmlFor="email">Bennett University Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={error ? "border-red-500" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 pt-1">{error}</p>}
        {successMessage && (
          <p className="text-sm text-green-500 pt-1">{successMessage}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Button
          onClick={handleVerify}
          disabled={!isFormValid || verifyLoading}
          className="w-full"
        >
          {verifyLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Verify & Save Credentials
        </Button>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Automate Attendance</Label>
          <Switch
            checked={automateAttendance}
            onCheckedChange={handleToggleAutomate}
            disabled={!userData || toggleLoading}
          />
        </div>
        {toggleError && <p className="text-sm text-red-500">{toggleError}</p>}
        {toggleSuccess && (
          <p className="text-sm text-green-500">{toggleSuccess}</p>
        )}
      </div>
    </div>
  );
}
