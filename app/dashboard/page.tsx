"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push("/");
    } else {
      fetchBookmarks();
      subscribeToRealtime();
    }
  };

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  const subscribeToRealtime = () => {
    supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();
  };

  const addBookmark = async () => {
    if (!title || !url) return;

    const { data } = await supabase.auth.getUser();

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: data.user?.id,
    });

    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // ✅ FIXED DATE FORMAT (no hydration issue)
  const formatDate = (date: string) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const formatTime = (date: string) => {
    return new Date(date).toISOString().split("T")[1].slice(0, 8);
  };

  return (
    <div className="min-h-screen bg-blue-950 p-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

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
          className="bg-black text-white px-4 rounded"
        >
          Add
        </button>
      </div>

      <div className=" rounded shadow">
        <table className="w-full text-left">
          <thead className="">
            <tr>
              <th className="p-3">SL No</th>
              <th className="p-3">Title</th>
              <th className="p-3">URL</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.map((bookmark, index) => (
              <tr key={bookmark.id} className="border-t">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{bookmark.title}</td>
                <td className="p-3">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Visit
                  </a>
                </td>
                <td className="p-3">
                  {formatDate(bookmark.created_at)}
                </td>
                <td className="p-3">
                  {formatTime(bookmark.created_at)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
