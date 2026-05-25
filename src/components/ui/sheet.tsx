"use client";

interface Props {
  open: boolean;

  onClose: () => void;

  children: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  children,
}: Props) {
  if (!open)
    return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/60 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-white/10 bg-[#111827] px-5 pb-32 pt-5">
        <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-white/20" />

        {children}
      </div>
    </div>
  );
}