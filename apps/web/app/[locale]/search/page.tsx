export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">ابحث عن مكان إقامتك</h1>
        <form method="GET" className="mb-6">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="القاهرة، شرم الشيخ، الغردقة..."
            className="w-full max-w-md rounded border border-gray-300 px-4 py-2"
          />
          <button
            type="submit"
            className="mt-2 rounded bg-blue-600 px-4 py-2 text-white"
          >
            بحث
          </button>
        </form>
        {query ? (
          <p className="text-gray-700">
            جاري البحث عن: <strong>{query}</strong>
          </p>
        ) : (
          <p className="text-gray-500">أدخل وجهتك لبدء البحث.</p>
        )}
      </div>
    </div>
  );
}
