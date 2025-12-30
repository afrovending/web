import { TIMEZONE } from "@/setting";
import { useEffect, useState } from "react";

export default function useCanadaGreeting() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
 
      const canadaHour = Number(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hourCycle: "h23",
          timeZone: TIMEZONE,
        }).format(now)
      );

      let greet;
      if (canadaHour < 12) {
        greet = "Good morning";
      } else if (canadaHour < 17) {
        greet = "Good afternoon";
      } else {
        greet = "Good evening";
      }

      setGreeting(greet);
    };

    // Initial run
    updateGreeting();

    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  return greeting;
}
