import { Suspense } from "react";
import DnaExperience from "@/components/DnaExperience";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <DnaExperience />
    </Suspense>
  );
}
