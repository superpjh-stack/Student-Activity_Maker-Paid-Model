function getSuneungDate(year: number): Date {
  // 수능일: 매년 11월 둘째 목요일
  const nov1 = new Date(year, 10, 1); // 11월 1일
  const dayOfWeek = nov1.getDay(); // 0=일, 4=목
  const daysToThursday = (4 - dayOfWeek + 7) % 7;
  const firstThursday = 1 + daysToThursday;
  return new Date(year, 10, firstThursday + 7); // 둘째 목요일
}

interface DdayWidgetProps {
  examDate?: string | null;
}

export default function DdayWidget({ examDate }: DdayWidgetProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let target: Date;
  if (examDate) {
    target = new Date(examDate);
  } else {
    target = getSuneungDate(today.getFullYear());
    if (target < today) target = getSuneungDate(today.getFullYear() + 1);
  }

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let colorClass = 'gradient-text';
  if (diffDays <= 30) colorClass = 'text-red-500';
  else if (diffDays <= 100) colorClass = 'text-yellow-500';

  const month = target.getMonth() + 1;
  const day = target.getDate();

  return (
    <div className="glass-card rounded-2xl px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-purple-400 font-medium">수능까지</p>
        <p className={`text-3xl font-black ${colorClass}`}>
          D-{diffDays > 0 ? diffDays : 0}
        </p>
        <p className="text-xs text-purple-300 mt-0.5">{month}월 {day}일</p>
      </div>
      <div className="text-4xl">🎯</div>
    </div>
  );
}
