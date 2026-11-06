"use client";

import { useEffect, useRef, useState } from "react";

export function useCompte(valeur: number, duree = 900) {
  const [affiche, setAffiche] = useState(0);
  const courant = useRef(0);

  useEffect(() => {
    const de = courant.current;
    const debut = performance.now();
    let frame = 0;
    const pas = (t: number) => {
      const p = Math.min(1, (t - debut) / duree);
      const v = de + (valeur - de) * (1 - Math.pow(1 - p, 3));
      courant.current = v;
      setAffiche(v);
      if (p < 1) frame = requestAnimationFrame(pas);
    };
    frame = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(frame);
  }, [valeur, duree]);

  return affiche;
}
