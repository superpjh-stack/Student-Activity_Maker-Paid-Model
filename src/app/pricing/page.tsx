import { auth } from '@/lib/auth';
import { getSubscription } from '@/lib/subscription';
import PricingCards from '@/components/payment/PricingCards';

export default async function PricingPage() {
  const session = await auth();
  const subscription = session?.user?.id
    ? await getSubscription(session.user.id)
    : null;

  return (
    <div className="py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-black gradient-text">플랜 선택</h1>
        <p className="mt-2 text-sm text-purple-400">
          나에게 맞는 플랜을 선택하고 세특을 완성하세요
        </p>
      </div>

      <PricingCards currentPlan={subscription?.plan ?? 'free'} />

      {/* Feature comparison table */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-bold text-purple-900 mb-4 text-center">플랜 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="py-2 text-left text-purple-500 font-medium">기능</th>
                <th className="py-2 text-center text-gray-500 font-medium">탐구생</th>
                <th className="py-2 text-center text-blue-600 font-medium">준비생</th>
                <th className="py-2 text-center text-fuchsia-600 font-medium">입시생</th>
              </tr>
            </thead>
            <tbody className="text-purple-700">
              <tr className="border-b border-purple-50">
                <td className="py-2">세특 생성</td>
                <td className="py-2 text-center">월 3회</td>
                <td className="py-2 text-center">월 20회</td>
                <td className="py-2 text-center font-bold">무제한</td>
              </tr>
              <tr className="border-b border-purple-50">
                <td className="py-2">탐구보고서</td>
                <td className="py-2 text-center">월 1회</td>
                <td className="py-2 text-center">월 10회</td>
                <td className="py-2 text-center font-bold">무제한</td>
              </tr>
              <tr className="border-b border-purple-50">
                <td className="py-2">과목</td>
                <td className="py-2 text-center">3과목</td>
                <td className="py-2 text-center">8과목 전체</td>
                <td className="py-2 text-center">8과목 전체</td>
              </tr>
              <tr className="border-b border-purple-50">
                <td className="py-2">이력 보관</td>
                <td className="py-2 text-center">7일</td>
                <td className="py-2 text-center">무제한</td>
                <td className="py-2 text-center">무제한</td>
              </tr>
              <tr className="border-b border-purple-50">
                <td className="py-2">SKY 합격생 분석</td>
                <td className="py-2 text-center text-gray-300">-</td>
                <td className="py-2 text-center text-gray-300">-</td>
                <td className="py-2 text-center text-fuchsia-500">O</td>
              </tr>
              <tr>
                <td className="py-2">선생님 공유 링크</td>
                <td className="py-2 text-center text-gray-300">-</td>
                <td className="py-2 text-center text-gray-300">-</td>
                <td className="py-2 text-center text-fuchsia-500">O</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-purple-900 text-center">자주 묻는 질문</h2>
        <details className="glass-card rounded-2xl p-4 group">
          <summary className="text-sm font-medium text-purple-900 cursor-pointer list-none flex items-center justify-between">
            결제는 어떻게 하나요?
            <span className="text-purple-400 group-open:rotate-180 transition-transform">&#9662;</span>
          </summary>
          <p className="mt-2 text-xs text-purple-500 leading-relaxed">
            토스페이먼츠를 통해 안전하게 결제됩니다. 신용카드/체크카드로 결제할 수 있으며, 매월(또는 매년) 자동 결제됩니다.
          </p>
        </details>
        <details className="glass-card rounded-2xl p-4 group">
          <summary className="text-sm font-medium text-purple-900 cursor-pointer list-none flex items-center justify-between">
            환불이 가능한가요?
            <span className="text-purple-400 group-open:rotate-180 transition-transform">&#9662;</span>
          </summary>
          <p className="mt-2 text-xs text-purple-500 leading-relaxed">
            결제 후 7일 이내에 환불을 요청하실 수 있습니다. 마이페이지에서 구독을 취소하시면 현재 결제 기간이 끝날 때까지 이용 가능합니다.
          </p>
        </details>
        <details className="glass-card rounded-2xl p-4 group">
          <summary className="text-sm font-medium text-purple-900 cursor-pointer list-none flex items-center justify-between">
            플랜을 변경할 수 있나요?
            <span className="text-purple-400 group-open:rotate-180 transition-transform">&#9662;</span>
          </summary>
          <p className="mt-2 text-xs text-purple-500 leading-relaxed">
            언제든 업그레이드하실 수 있습니다. 업그레이드 시 기존 결제 기간의 잔여 금액이 차감됩니다.
          </p>
        </details>
      </div>
    </div>
  );
}
