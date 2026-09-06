"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Search } from "lucide-react";

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

interface HeroInputProps {
  initialValue: string;
  large?: boolean;
}

export function HeroInput({ initialValue, large = false }: HeroInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [invalid, setInvalid] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const submit = (candidate: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const username = candidate.trim().replace(/^@/, "");
    if (!username) return;
    if (!USERNAME_PATTERN.test(username)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    router.replace(`/?user=${encodeURIComponent(username)}`, { scroll: false });
  };

  const handleChange = (next: string) => {
    setValue(next);
    setInvalid(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => submit(next), 600);
  };

  return (
    <div className={large ? "w-full max-w-xl" : "w-full max-w-md"}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        className={`group flex items-center gap-3 rounded-2xl border bg-white/[0.04] backdrop-blur-md transition focus-within:border-cyan-400/50 focus-within:bg-white/[0.06] ${
          invalid ? "border-rose-500/60" : "border-white/10"
        } ${large ? "px-5 py-4" : "px-4 py-3"}`}
      >
        <Github size={large ? 22 : 18} className="shrink-0 text-slate-400" />
        <input
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="GitHub username, e.g. torvalds"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className={`w-full bg-transparent font-mono text-slate-100 outline-none placeholder:text-slate-600 ${
            large ? "text-lg" : "text-sm"
          }`}
        />
        <button
          type="submit"
          aria-label="Analyze"
          className="shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300 transition hover:bg-cyan-400/20"
        >
          <Search size={large ? 18 : 15} />
        </button>
      </form>
      {invalid && (
        <p className="mt-2 text-sm text-rose-400">
          Invalid username. GitHub usernames are alphanumeric with hyphens, up to 39 characters.
        </p>
      )}
    </div>
  );
}
