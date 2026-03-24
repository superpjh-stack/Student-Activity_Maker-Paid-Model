import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DnaCard from '@/components/features/DnaCard';

export default async function DnaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="py-4 space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-black gradient-text">진로 키워드 DNA</h1>
        <p className="mt-1 text-sm text-purple-400">
          "당신을 설명하는 단어들, AI가 발굴해 드립니다"
        </p>
      </div>

      <DnaCard />
    </div>
  );
}
