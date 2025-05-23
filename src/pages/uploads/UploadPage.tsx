import React, { useState } from "react";

const UploadsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/uploads", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setMessage("Файл успешно загружен и обработан!");
      } else {
        setMessage(result.error || "Ошибка загрузки файла");
      }
    } catch (e) {
      setMessage("Ошибка соединения с сервером");
    }
    setIsUploading(false);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Загрузка Excel-файлов</h1>
      <div className="flex items-center mb-4 space-x-4">
        <label
          htmlFor="file-upload"
          className={`${
            file
              ? "bg-gray-400 hover:bg-gray-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } px-4 py-2 rounded cursor-pointer transition-colors duration-150 font-semibold`}
        >
          {file ? "Файл выбран" : "Выберите файл"}
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <span className="text-gray-700 text-sm">
          {file && file.name}
        </span>
      </div>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150 font-semibold"
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? "Загрузка..." : "Загрузить"}
      </button>
      {message && (
        <div className={`mt-4 font-semibold ${message.includes("успешно") ? "text-green-700" : "text-red-600"}`}>
          {message}
        </div>
      )}
      <div className="mt-8 text-gray-600 text-sm">
        Поддерживаются файлы Excel (.xls, .xlsx) с данными заказов или блюд.<br />
        После загрузки данные автоматически попадут в дашборд и аналитику.
      </div>
    </div>
  );
};

export default UploadsPage;