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
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Check session + initialize
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/");
        return;
      }

      const uid = data.session.user.id;
      setUserId(uid);
      setLoading(false);

      fetchBookmarks(uid);
      subscribeToRealtime(uid);
    };

    init();

    // 🔄 Auto redirect on logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          router.replace("/");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 📥 Initial Fetch
  const fetchBookmarks = async (uid: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  // 🔄 Realtime (no refetch, direct state updates)
  const subscribeToRealtime = (uid: string) => {
    supabase
      .channel("bookmarks-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== payload.old.id)
          );
        }
      )
      .subscribe();
  };

  // ➕ Add Bookmark (Optimistic)
  const addBookmark = async () => {
    if (!title || !url || !userId) return;

    const tempId = crypto.randomUUID();

    const optimisticBookmark: Bookmark = {
      id: tempId,
      title,
      url,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    // Optimistic UI
    setBookmarks((prev) => [optimisticBookmark, ...prev]);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        title,
        url,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // Rollback if failed
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      console.error(error.message);
      return;
    }

    // Replace temp bookmark with real one
    setBookmarks((prev) =>
      prev.map((b) => (b.id === tempId ? data : b))
    );

    setTitle("");
    setUrl("");
  };

  // ❌ Delete Bookmark (Optimistic)
  const deleteBookmark = async (id: string) => {
    const previous = bookmarks;

    // Remove instantly
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      // Rollback if failed
      setBookmarks(previous);
      console.error(error.message);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
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
