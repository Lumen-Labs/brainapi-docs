"use client";

import { useTheme } from "next-themes";
import NextImage from "next/image";
import { useEffect, useState } from "react";

export function ThemeLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src =
    !mounted || resolvedTheme === "dark"
      ? "/images/logo-dark.png"
      : "/images/logo-light.png";

  return (
    <div className="">
      <NextImage
        src={src}
        alt="BrainAPI"
        width={60}
        height={60}
      />
    </div>
  );
}
