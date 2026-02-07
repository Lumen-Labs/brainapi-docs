"use client";

import { useTheme } from "next-themes";
import NextImage from "next/image";
import { useEffect, useState } from "react";

import logoDark from "@/assets/images/logo-dark.png";
import logoLight from "@/assets/images/logo-light.png";

export function ThemeLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src =
    !mounted || resolvedTheme === "dark" ? logoDark.src : logoLight.src;

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
