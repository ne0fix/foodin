import AdminSidebar from '@/src/components/admin/AdminSidebar';
import AdminTopBar from '@/src/components/admin/AdminTopBar';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminTopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
