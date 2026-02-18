"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

type Asset = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  downloadURL: string;
  createdAt: any;
  active: boolean;
};

const CATEGORIES = ["Lista de precios", "Trípticos", "Catálogos", "Promos"] as const;

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes + 1) / Math.log(1024)), sizes.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default function MaterialAssetsCard() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Lista de precios");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "assets"),
        where("active", "==", true),
        where("category", "==", category),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const rows: Asset[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setAssets(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [category]);

  async function onUpload() {
    if (!file) return alert("Selecciona un archivo");
    const cleanTitle = (title || file.name).trim();
    if (!cleanTitle) return alert("Pon un título");

    setUploading(true);
    setProgress(0);

    try {
      const ts = Date.now();
      const safeCategory = category.replace(/\s+/g, "-").toLowerCase();
      const path = `assets/${safeCategory}/${ts}-${file.name}`;

      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, file, { contentType: file.type });

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
            setProgress(Math.round(pct));
          },
          reject,
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(sRef);

      await addDoc(collection(db, "assets"), {
        title: cleanTitle,
        category,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        storagePath: path,
        downloadURL,
        createdAt: Timestamp.now(),
        active: true,
      });

      setTitle("");
      setFile(null);
      await load();
      alert("✅ Archivo subido");
    } catch (e: any) {
      console.error(e);
      alert("❌ Error subiendo archivo");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Material comercial</div>
          <div className="text-sm text-gray-500">
            Listas de precios, trípticos, catálogos, promos.
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              c === category ? "bg-gray-900 text-white border-gray-900" : "bg-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border p-3">
        <div className="text-sm font-medium mb-2">Subir a: {category}</div>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ej: Lista de precios Feb 2026)"
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={onUpload}
            disabled={uploading}
            className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm disabled:opacity-60"
          >
            {uploading ? `Subiendo... ${progress}%` : "Subir archivo"}
          </button>
        </div>

        {uploading && (
          <div className="mt-2 text-xs text-gray-500">Progreso: {progress}%</div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium mb-2">Archivos ({assets.length})</div>

        {loading ? (
          <div className="text-sm text-gray-500">Cargando...</div>
        ) : assets.length === 0 ? (
          <div className="text-sm text-gray-500">No hay archivos todavía.</div>
        ) : (
          <div className="space-y-2">
            {assets.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 border rounded-xl p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {a.fileName} • {formatBytes(a.size)}
                  </div>
                </div>

                <a
                  href={a.downloadURL}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Abrir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
