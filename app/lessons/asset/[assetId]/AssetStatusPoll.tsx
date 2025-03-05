"use client";

import { useEffect, useState } from "react";
import { Status } from "./types";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

type Props = {
  initialStatus: Status;
  checkAssetStatus: () => Promise<Status>;
};

export default function AssetStatusPoll({
  initialStatus,
  checkAssetStatus,
}: Props) {
  const [{ status, errors }, setStatus] = useState<Status>(() => initialStatus);

  useEffect(() => {
    const poll = async () => setStatus(await checkAssetStatus());
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [checkAssetStatus]);

  switch (status) {
    case "preparing":
      return (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          <p className="text-blue-700">Your video is being prepared...</p>
        </div>
      );
    case "errored":
      return (
        <div className="p-4 bg-red-50 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 font-medium">Video processing failed</p>
          </div>
          
          {Array.isArray(errors) && errors.length > 0 && (
            <ul className="mb-4 list-disc pl-6 text-red-600 text-sm">
              {errors.map((error, key) => (
                <li key={key}>{typeof error === 'object' ? error.message || JSON.stringify(error) : error}</li>
              ))}
            </ul>
          )}
          
          <p className="text-sm mt-4">
            Let's <Link href="/lessons/create" className="text-blue-600 hover:underline">try again</Link> with a different video.
          </p>
        </div>
      );
    case "ready":
      return (
        <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-md">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-green-700">
            Your video is ready! You should be redirected automatically.
          </p>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="mb-2 text-gray-700">Video is in an unknown state.</p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ status, errors }, null, 2)}
          </pre>
          <p className="text-sm mt-4">
            Let's <Link href="/lessons/create" className="text-blue-600 hover:underline">try again</Link>.
          </p>
        </div>
      );
  }
}
