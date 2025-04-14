"use client";

import { useEffect, useState } from "react";

const getHashParams = () => {
  if (typeof window === "undefined") return {};
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const params = Object.fromEntries(hashParams.entries());
  return params;
};

const useHashParams = () => {
  const [hashParams, setHashParams] =
    useState<Record<string, string>>(getHashParams());

  useEffect(() => {
    const handleHashChange = () => setHashParams(getHashParams());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hashParams;
};

export default useHashParams;
