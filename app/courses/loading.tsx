export default function Loading() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="h-9 w-64 bg-slate-200 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border overflow-hidden">
            <div className="aspect-video bg-slate-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
