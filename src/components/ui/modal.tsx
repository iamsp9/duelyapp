"use client";

interface Props {
  open: boolean;

  onClose: () => void;

  title: string;

  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center">
      <div className="w-full md:max-w-2xl rounded-t-[2rem] md:rounded-[2rem] border border-white/10 bg-[#111827] p-6 animate-in slide-in-from-bottom duration-300">
        <div className="w-16 h-1 rounded-full bg-white/20 mx-auto mb-6 md:hidden" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="size-10 rounded-2xl bg-white/5 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}