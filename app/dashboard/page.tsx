"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 🔐 Check session on mount
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/");
        return;
      }

      setUserId(data.session.user.id);
      setLoading(false);
      fetchBookmarks(data.session.user.id);
      subscribeToRealtime(data.session.user.id);
    };

    init();
  }, []);

  // 📥 Fetch user bookmarks
  const fetchBookmarks = async (uid: string) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error) {
      setBookmarks(data || []);
    }
  };

  // 🔄 Realtime subscription (filtered by user)
  const subscribeToRealtime = (uid: string) => {
    const channel = supabase
      .channel("bookmarks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${uid}`,
        },
        () => {
          fetchBookmarks(uid);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // ➕ Add bookmark
  const addBookmark = async () => {
    if (!title || !url || !userId) return;

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: userId,
    });

    setTitle("");
    setUrl("");
  };

  // ❌ Delete bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-blue-950 p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Add Bookmark */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded w-1/4"
        />
        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 rounded w-1/2"
        />
        <button
          onClick={addBookmark}
          className="bg-black text-white px-4 rounded hover:bg-gray-800"
        >
          Add
        </button>
      </div>

      {/* Bookmark List */}
      <ul className="space-y-3">
        {bookmarks.map((bookmark) => (
          <li
            key={bookmark.id}
            className="bg-white p-4 rounded shadow flex justify-between"
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {bookmark.title}
            </a>
            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
