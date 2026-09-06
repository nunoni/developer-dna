"use client";

import { CARD_HEIGHT, CARD_WIDTH } from "./DnaCard";

const block = "animate-pulse rounded-2xl bg-white/[0.06]";

export function CardSkeleton() {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[32px] border border-white/10"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, background: "linear-gradient(155deg,#0a0f1e,#070b16)" }}
    >
      <div className="flex items-start justify-between px-10 pt-9">
        <div className="flex items-center gap-5">
          <div className={`${block} h-[88px] w-[88px]`} />
          <div className="flex flex-col gap-2.5">
            <div className={`${block} h-7 w-64`} />
            <div className={`${block} h-4 w-80`} />
          </div>
        </div>
        <div className={`${block} h-12 w-56`} />
      </div>
      <div className="mt-4 flex flex-1 gap-6 px-10">
        <div className="flex w-[410px] items-center justify-center">
          <div className={`${block} h-[280px] w-[280px] rounded-full`} />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className={`${block} h-32`} />
          <div className={`${block} h-28`} />
          <div className="grid grid-cols-4 gap-3">
            <div className={`${block} h-[70px]`} />
            <div className={`${block} h-[70px]`} />
            <div className={`${block} h-[70px]`} />
            <div className={`${block} h-[70px]`} />
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.07] px-10 py-4">
        <div className={`${block} h-4 w-72`} />
      </div>
    </div>
  );
}
