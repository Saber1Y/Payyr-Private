"use client";

import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoAccessStateProps {
  title?: string;
  message: string;
}

export function NoAccessState({
  title = "No access",
  message,
}: NoAccessStateProps) {
  return (
    <div className="min-h-screen bg-[#114277] p-4 md:p-8">
      <div className="mx-auto mt-8 max-w-2xl">
        <Card className="border-red-200 bg-white text-black">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <CardTitle className="text-xl text-black">{title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-gray-700">{message}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
