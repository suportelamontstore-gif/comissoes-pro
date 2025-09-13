"use client";

import Papa from "papaparse";

export default function CsvUploader({ onData }: { onData: (rows: any[]) => void }) {
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // primeira linha vira chave
      skipEmptyLines: true,
      complete: (results) => {
        onData(results.data); // entrega os dados pro painel
      },
    });
  }

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="text-gray-200 cursor-pointer"
      />
    </div>
  );
}
