"use client";
import React, { useState, useEffect } from "react";
import { getDeviceInfo } from "@/lib/getDeviceInfo";

export default function Page() {
  const [deviceData, setDeviceData] = useState<any | null>(null);

  useEffect(() => {
    setDeviceData(getDeviceInfo());
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Device Information</h1>

      {deviceData ? (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-700">Device Details:</h2>
            <ul className="space-y-2 mt-2">
              <li className="text-gray-600">
                <strong>Device:</strong> {deviceData.device}
              </li>
              <li className="text-gray-600">
                <strong>Operating System:</strong> {deviceData.os}
              </li>
              <li className="text-gray-600">
                <strong>OS Version:</strong> {deviceData.osVersion}
              </li>
              <li className="text-gray-600">
                <strong>Device Model:</strong> {deviceData.deviceModel}
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-700">Raw Data:</h2>
            <pre className="mt-2 p-4 bg-gray-200 rounded-lg">{JSON.stringify(deviceData, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading device data...</p>
      )}
    </div>
  );
}
