"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LocationRequest() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { 
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLoading(false);
        toast.success("Nearby stores updated based on your location!");

        // Logic to save coords (e.g., to a global State, Context, or Cookie)
        console.log("User Location Captured:", userCoords);
      },
      (error) => {
        setLoading(false);
        // If denied, we don't want to annoy the user with a toast
        // every time they visit /items, so we log it instead.
        console.warn("Location access denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  };

  // Return null so nothing renders on the screen
  return null;
}
