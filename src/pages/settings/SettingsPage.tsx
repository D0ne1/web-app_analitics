import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-red-500 font-semibold">Ошибка: пользователь не найден.</div>
      </div>
    );
  }

  const handleDeleteAll = async () => {
    if (!window.confirm("Вы уверены? Это действие нельзя отменить!")) return;
    setDeleting(true);
    setDeleteMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/delete-all", { method: "POST" });
      if (!res.ok) throw new Error();
      setDeleteMessage("Все данные успешно удалены!");
    } catch {
      setDeleteMessage("Ошибка при удалении данных.");
    }
    setDeleting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
        });
        if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Ошибка при сохранении изменений");
        }
        setMessage("Изменения сохранены!");
        const updatedUser = { ...user, username, email };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err: any) {
        setMessage(err.message || "Ошибка при сохранении изменений");
    }
    setSaving(false);
};

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Настройки</h1>
      <div>
        <label>
          <strong>Имя пользователя:</strong>
          <input
            className="border rounded px-2 py-1 ml-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          <strong>Email:</strong>
          <input
            className="border rounded px-2 py-1 ml-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Сохраняем..." : "Сохранить"}
      </button>
      {message && <div>{message}</div>}
      <hr />
      {/* Показываем кнопку удаления только если пользователь не официант */}
      {user.role !== 'waiter' && (
        <>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            disabled={deleting}
            onClick={handleDeleteAll}
          >
            {deleting ? "Удаление..." : "Удалить все данные"}
          </button>
          {deleteMessage && (
            <div className="mt-2 text-sm" style={{ color: deleteMessage.includes("Ошибка") ? "red" : "green" }}>
              {deleteMessage}
            </div>
          )}
          <hr />
        </>
      )}
      
      <hr />
      <button
        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
        onClick={logout}
      >
        Выйти из аккаунта
      </button>
      <div className="mt-8 text-xs text-gray-400">Версия приложения: 1.0.0</div>
    </div>
  );
}