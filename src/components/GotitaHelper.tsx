import Image from "next/image";

export default function GotitaHelper({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
      <Image
        src="/gotita.png"
        alt="Gotita Liqui Moly"
        width={70}
        height={70}
        className="object-contain"
      />
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  );
}