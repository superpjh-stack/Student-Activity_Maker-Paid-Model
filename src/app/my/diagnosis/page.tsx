import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DiagnosisReport from '@/components/features/DiagnosisReport';

export default async function DiagnosisPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="py-4 space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-black gradient-text">생기부 건강 진단</h1>
        <p className="mt-1 text-sm text-purple-400">
          "지금 내 생기부, 입시에서 살아남을 수 있나요?"
        </p>
      </div>

      <DiagnosisReport />
    </div>
  );
}
